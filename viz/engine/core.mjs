// 共通計算エンジンの最小核 — 「この数はどの入力・重み・演算から来たか」を保持したまま計算する。
// DOM を参照しない純粋関数だけで書き、Node の検証（tools/verify-engine.mjs）と画面が同じ計算を使う。
//
// 表し方の約束:
//   - パラメータ θ は { テンソルID: Float64Array } の平らな配列。重み W は常に [out][in]（行=出力ユニット）
//     の行優先で、W[i][j] は flat[i * nIn + j]。
//   - 計算の 1 回分は Trace に記録する。図・式・文章は同じ Trace を読むだけで、自前で再計算しない。
//   - Focus { tensor, index } が「どの数か」の住所。index はテンソル内の平らな位置。
//
// いまの範囲: 全結合（dense）・ReLU・tanh・二乗誤差・SGD。層は一直線につなぐ。
// 抽象化は 2 本目の教材で必要になってから広げる（最初から大きく作らない）。

const ACT = {
  relu: { f: z => (z > 0 ? z : 0), d: (z) => (z > 0 ? 1 : 0) },
  tanh: { f: z => Math.tanh(z), d: (z) => { const t = Math.tanh(z); return 1 - t * t; } },
};

// spec = { input: { id, size }, layers: [{ id, kind:'dense', W, b, size } | { id, kind:'relu'|'tanh' }], output: id }
// 損失は出力ごとに ½(ŷ − y)² をとり、サンプル平均する。
export function defineModel(spec) {
  const tensors = { [spec.input.id]: { id: spec.input.id, size: spec.input.size, role: 'input' } };
  const params = {};
  const layers = [];
  let prev = spec.input.id;
  for (const layer of spec.layers) {
    const nIn = tensors[prev].size;
    if (layer.kind === 'dense') {
      params[layer.W] = { id: layer.W, shape: [layer.size, nIn], size: layer.size * nIn, layer: layer.id };
      params[layer.b] = { id: layer.b, shape: [layer.size], size: layer.size, layer: layer.id };
      tensors[layer.id] = { id: layer.id, size: layer.size, role: 'activation' };
      layers.push({ id: layer.id, kind: 'dense', from: prev, W: layer.W, b: layer.b, nIn, nOut: layer.size });
    } else if (ACT[layer.kind]) {
      tensors[layer.id] = { id: layer.id, size: nIn, role: 'activation' };
      layers.push({ id: layer.id, kind: layer.kind, from: prev, nIn, nOut: nIn });
    } else {
      throw new Error('未対応の層: ' + layer.kind);
    }
    prev = layer.id;
  }
  const consumer = {};
  for (const layer of layers) consumer[layer.from] = layer;
  return { tensors, params, layers, consumer, input: spec.input.id, output: prev };
}

// θ を値で複製する（履歴・分岐は必ず複製を持ち、元を書き換えない）。
export function cloneTheta(theta) {
  const out = {};
  for (const key of Object.keys(theta)) out[key] = Float64Array.from(theta[key]);
  return out;
}

export function thetaFrom(model, values) {
  const theta = {};
  for (const id of Object.keys(model.params)) {
    const flat = [values[id]].flat(2);
    if (flat.length !== model.params[id].size) throw new Error(`${id} の要素数が ${model.params[id].size} ではない`);
    theta[id] = Float64Array.from(flat);
  }
  return theta;
}

// 順伝播＋逆伝播を 1 回行い、全中間値・各テンソルの δ=∂L/∂t・パラメータ勾配（サンプル平均）を記録する。
// batch = [{ x: number[], y: number[] }]
export function run(model, theta, batch) {
  const n = batch.length;
  const grads = {};
  for (const id of Object.keys(model.params)) grads[id] = new Float64Array(model.params[id].size);
  const samples = [];
  let loss = 0;

  for (const { x, y } of batch) {
    const values = { [model.input]: Float64Array.from(x) };
    for (const layer of model.layers) {
      const a = values[layer.from];
      const out = new Float64Array(layer.nOut);
      if (layer.kind === 'dense') {
        const W = theta[layer.W], b = theta[layer.b];
        for (let i = 0; i < layer.nOut; i++) {
          let s = b[i];
          for (let j = 0; j < layer.nIn; j++) s += W[i * layer.nIn + j] * a[j];
          out[i] = s;
        }
      } else {
        for (let i = 0; i < layer.nOut; i++) out[i] = ACT[layer.kind].f(a[i]);
      }
      values[layer.id] = out;
    }

    const yhat = values[model.output];
    const deltas = { [model.output]: new Float64Array(yhat.length) };
    for (let k = 0; k < yhat.length; k++) {
      const e = yhat[k] - y[k];
      loss += 0.5 * e * e / n;
      deltas[model.output][k] = e / n;
    }
    for (let li = model.layers.length - 1; li >= 0; li--) {
      const layer = model.layers[li];
      const dOut = deltas[layer.id];
      const a = values[layer.from];
      const dIn = new Float64Array(layer.nIn);
      if (layer.kind === 'dense') {
        const W = theta[layer.W], gW = grads[layer.W], gb = grads[layer.b];
        for (let i = 0; i < layer.nOut; i++) {
          gb[i] += dOut[i];
          for (let j = 0; j < layer.nIn; j++) {
            gW[i * layer.nIn + j] += dOut[i] * a[j];
            dIn[j] += W[i * layer.nIn + j] * dOut[i];
          }
        }
      } else {
        for (let i = 0; i < layer.nIn; i++) dIn[i] = dOut[i] * ACT[layer.kind].d(a[i]);
      }
      deltas[layer.from] = dIn;
    }
    samples.push({ x: Float64Array.from(x), y: Float64Array.from(y), values, deltas });
  }
  return { theta: cloneTheta(theta), samples, loss, grads };
}

// SGD の 1 歩。θ を書き換えず、新しい θ を返す。
export function sgdStep(theta, grads, lr) {
  const next = cloneTheta(theta);
  for (const id of Object.keys(next)) for (let i = 0; i < next[id].length; i++) next[id][i] -= lr * grads[id][i];
  return next;
}

// その 1 個のパラメータだけを delta 動かした分岐の Trace（元の θ は変えない）。
export function nudge(model, theta, batch, focus, delta) {
  const branch = cloneTheta(theta);
  branch[focus.tensor][focus.index] += delta;
  return run(model, branch, batch);
}

// 他のパラメータを固定し、focus の値だけを xs に置いたときの実損失。勾配＝この曲線の接線の傾き。
export function lossSlice(model, theta, batch, focus, xs) {
  const branch = cloneTheta(theta);
  return xs.map(v => { branch[focus.tensor][focus.index] = v; return run(model, branch, batch).loss; });
}

// 有限差分（中心差分）。逆伝播の勾配と独立に、同じ傾きを数値で求める。
export function finiteDiff(model, theta, batch, focus, h = 1e-6) {
  return (nudge(model, theta, batch, focus, h).loss - nudge(model, theta, batch, focus, -h).loss) / (2 * h);
}

// ---- 「この数はどこから来たか」を返す説明関数（画面の式はここから組み立てる） ----

// テンソル tensor の index 番目が、サンプル s でどう計算されたか。
export function explainValue(model, trace, s, tensor, index) {
  const { values } = trace.samples[s];
  const layer = model.layers.find(l => l.id === tensor);
  if (!layer) return { kind: 'input', tensor, index, value: values[tensor][index] };
  if (layer.kind === 'dense') {
    const terms = [];
    for (let j = 0; j < layer.nIn; j++) {
      terms.push({
        weight: { tensor: layer.W, index: index * layer.nIn + j }, w: trace.theta[layer.W][index * layer.nIn + j],
        input: { tensor: layer.from, index: j }, a: values[layer.from][j],
      });
    }
    return { kind: 'dense', tensor, index, terms, bias: { tensor: layer.b, index }, b: trace.theta[layer.b][index], value: values[tensor][index] };
  }
  return { kind: layer.kind, tensor, index, input: { tensor: layer.from, index }, z: values[layer.from][index], value: values[tensor][index] };
}

// δ(tensor, index) = ∂L/∂tensor[index] がどの積・和で決まったか（1 段ぶん）。
export function explainDelta(model, trace, s, tensor, index) {
  const { values, deltas, y } = trace.samples[s];
  const value = deltas[tensor][index];
  if (tensor === model.output) {
    return { kind: 'loss', tensor, index, yhat: values[tensor][index], y: y[index], n: trace.samples.length, value };
  }
  const next = model.consumer[tensor];
  if (next.kind === 'dense') {
    const terms = [];
    for (let k = 0; k < next.nOut; k++) {
      terms.push({ weight: { tensor: next.W, index: k * next.nIn + index }, w: trace.theta[next.W][k * next.nIn + index], next: { tensor: next.id, index: k }, delta: deltas[next.id][k] });
    }
    return { kind: 'sum', tensor, index, terms, value };
  }
  return { kind: 'act', act: next.kind, tensor, index, z: values[tensor][index], deriv: ACT[next.kind].d(values[tensor][index]), next: { tensor: next.id, index }, delta: deltas[next.id][index], value };
}

// パラメータ 1 個の勾配が、どの δ とどの入力の積か（サンプル s の寄与）。
export function explainGrad(model, trace, s, focus) {
  const p = model.params[focus.tensor];
  const layer = model.layers.find(l => l.id === p.layer);
  const { values, deltas } = trace.samples[s];
  if (focus.tensor === layer.W) {
    const i = Math.floor(focus.index / layer.nIn), j = focus.index % layer.nIn;
    return { kind: 'weight', focus, out: { tensor: layer.id, index: i }, delta: deltas[layer.id][i], input: { tensor: layer.from, index: j }, a: values[layer.from][j], value: deltas[layer.id][i] * values[layer.from][j], total: trace.grads[focus.tensor][focus.index] };
  }
  return { kind: 'bias', focus, out: { tensor: layer.id, index: focus.index }, delta: deltas[layer.id][focus.index], value: deltas[layer.id][focus.index], total: trace.grads[focus.tensor][focus.index] };
}
