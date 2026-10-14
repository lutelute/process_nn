// 共通計算エンジン（viz/engine）の参照値検証。画面と同じモジュールを Node で直接動かし、
// 手計算できる 1→2→1 ReLU ネットの値・勾配・更新・履歴の同一性を固定する。
import { defineModel, explainDelta, explainGrad, explainValue, finiteDiff, lossSlice, nudge, run, sgdStep, thetaFrom } from '../viz/engine/core.mjs';
import { Session } from '../viz/engine/session.mjs';

let failed = 0;
const ok = message => console.log('  ok   ' + message);
const fail = message => { console.error('  FAIL ' + message); failed++; };
const check = (condition, message) => condition ? ok(message) : fail(message);
const close = (a, b, tolerance = 1e-9) => Math.abs(a - b) <= tolerance;

const model = defineModel({
  input: { id: 'x', size: 1 },
  layers: [
    { id: 'z1', kind: 'dense', W: 'W1', b: 'b1', size: 2 },
    { id: 'h', kind: 'relu' },
    { id: 'yhat', kind: 'dense', W: 'W2', b: 'b2', size: 1 },
  ],
});
const theta0 = thetaFrom(model, { W1: [[0.5], [1.0]], b1: [0, 0], W2: [[0.4, -0.2]], b2: [0] });
const batch = [{ x: [1], y: [1] }];
const w1 = { tensor: 'W1', index: 0 };

// ① 順伝播: h = (0.5, 1.0)、ŷ = 0、L = 0.5
const t0 = run(model, theta0, batch);
const v0 = t0.samples[0].values;
check(close(v0.h[0], 0.5) && close(v0.h[1], 1.0) && close(v0.yhat[0], 0) && close(t0.loss, 0.5),
  'forward: h=(0.5,1.0), ŷ=0, L=0.5');

// ② w₁ を +0.01 だけ動かした分岐: ŷ=0.004、L=0.496008。元の θ は変わらない
const nudged = nudge(model, theta0, batch, w1, 0.01);
check(close(nudged.samples[0].values.yhat[0], 0.004) && close(nudged.loss, 0.496008),
  'nudge w₁ +0.01: ŷ=0.004, L=0.496008');
check(theta0.W1[0] === 0.5, 'nudge: original θ is untouched');

// ③ 逆伝播: ∂L/∂w₁ = (ŷ−y)·v₁·ReLU′(z₁)·x = −0.4。有限差分と一致
check(close(t0.grads.W1[0], -0.4), 'backward: ∂L/∂w₁ = −0.4');
check(close(finiteDiff(model, theta0, batch, w1), -0.4, 1e-7), 'finite difference agrees with backprop for w₁');
const expected = { W1: [-0.4, 0.2], b1: [-0.4, 0.2], W2: [-0.5, -1.0], b2: [-1.0] };
check(Object.entries(expected).every(([id, g]) => g.every((v, i) => close(t0.grads[id][i], v))),
  'backward: all 7 gradients match hand calculation');
const allFd = Object.keys(model.params).every(id => [...t0.grads[id]].every((g, i) =>
  close(finiteDiff(model, theta0, batch, { tensor: id, index: i }), g, 1e-6)));
check(allFd, 'finite difference agrees with backprop for all 7 parameters');

// ④ 説明関数が同じ Trace から積を組み立てる
const ev = explainValue(model, t0, 0, 'z1', 0);
check(ev.kind === 'dense' && close(ev.terms[0].w * ev.terms[0].a + ev.b, ev.value) && ev.terms[0].weight.tensor === 'W1',
  'explainValue: z₁ = w₁·x + b₁ from the same trace');
const eg = explainGrad(model, t0, 0, w1);
check(eg.kind === 'weight' && close(eg.delta * eg.a, -0.4) && eg.out.tensor === 'z1',
  'explainGrad: ∂L/∂w₁ = δ(z₁) × x');
const dz = explainDelta(model, t0, 0, 'z1', 0);
const dh = explainDelta(model, t0, 0, 'h', 0);
const dy = explainDelta(model, t0, 0, 'yhat', 0);
check(dz.kind === 'act' && dz.deriv === 1 && dh.kind === 'sum' && close(dh.terms[0].w, 0.4)
  && dy.kind === 'loss' && close(dy.value, -1), 'explainDelta: δ chain is ReLU′ → v₁ → (ŷ−y)');

// ⑤ SGD 1 歩（η=0.1）: w₁ 0.5→0.54、ŷ=0.265、L=0.2701125
const theta1 = sgdStep(theta0, t0.grads, 0.1);
const t1 = run(model, theta1, batch);
check(close(theta1.W1[0], 0.54) && close(t1.samples[0].values.yhat[0], 0.265) && close(t1.loss, 0.2701125),
  'one SGD step: w₁=0.54, ŷ=0.265, L=0.2701125');

// ⑥ 履歴: 10 更新後の損失 ≈ 0.0003221、時点の選択は学習を進めない
const session = new Session(model, theta0, batch, { lr: 0.1 });
session.train(10);
check(session.length === 11 && close(session.losses[10], 0.0003221, 5e-8), 'session: 10 updates reach L≈0.0003221');
const before = session.length;
session.at(3); session.at(0); session.at(10);
check(session.length === before && close(session.at(1).loss, 0.2701125), 'session: viewing past points does not train');
check(close(session.at(1).loss, t1.loss) && session.theta(0).W1[0] === 0.5, 'session: point k is θ after k updates, history is immutable');
const leaked = session.theta(0); leaked.W1[0] = 99;
check(session.theta(0).W1[0] === 0.5 && close(session.at(0).loss, 0.5), 'session: theta(k) returns a copy, so callers cannot rewrite history');
const lenBefore = session.length;
check(close(session.preview(3).loss, session.at(4).loss, 1e-15) && session.length === lenBefore,
  'session: preview(k) equals the recorded update and does not train');
const fresh = new Session(model, theta0, batch, { lr: 0.1 });
check(close(fresh.preview(0).loss, 0.2701125) && fresh.length === 1, 'session: preview at the end of history does not append');

// ⑦ 損失曲線の切り口: 他を固定して w₁ だけ動かすと、接線の傾き＝勾配
const xs = [0.5 - 1e-5, 0.5 + 1e-5];
const [la, lb] = lossSlice(model, theta0, batch, w1, xs);
check(close((lb - la) / 2e-5, -0.4, 1e-6), 'loss slice: tangent slope at w₁=0.5 equals the gradient');

console.log(failed ? `\n✗ engine: ${failed} 件失敗` : '\n✓ engine: すべての参照値と一致');
process.exit(failed ? 1 : 0);
