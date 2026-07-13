// GPT-2 small forward エンジン（環境非依存・素の JS 実装）
//
// 目的: 生成（自己回帰）の 1 ステップごとに、内部構造
//   - 各層・各ヘッドの attention 行列 softmax(QKᵀ/√d + causal)
//   - 残差ストリームのノルム推移
//   - logit lens（各層の中間表現を ln_f+lm_head に通した「途中の予測」）
//   - 次トークン確率分布
// を取り出して可視化できるようにする。フレームワーク不使用。
//
// 重みは parseSafetensors() で {name → {data:Float32Array, shape}} に展開して渡す。
// Node（fs で ArrayBuffer 化）でもブラウザ（fetch/File で ArrayBuffer）でも同一コードで動く。
//
// 参照: gpt2/GPT_NOTES.md §3,§6（アーキテクチャと forward 計算）

// ---- safetensors パーサ（F32/F16, 環境非依存 / DataView） --------------------
// フォーマット: [u64 LE header長][JSON header][生バイナリ]
export function parseSafetensors(arrayBuffer) {
  const dv = new DataView(arrayBuffer);
  const headerLen = Number(dv.getBigUint64(0, true));
  const headerText = new TextDecoder('utf-8').decode(new Uint8Array(arrayBuffer, 8, headerLen));
  const header = JSON.parse(headerText);
  const base = 8 + headerLen;
  const weights = new Map();
  for (const [name, info] of Object.entries(header)) {
    if (name === '__metadata__') continue;
    const [s, e] = info.data_offsets;
    const byteLen = e - s;
    let data;
    if (info.dtype === 'F32') {
      data = new Float32Array(byteLen / 4);
      const src = new DataView(arrayBuffer, base + s, byteLen);
      for (let i = 0; i < data.length; i++) data[i] = src.getFloat32(i * 4, true);
    } else if (info.dtype === 'F16') {
      const m = byteLen / 2;
      data = new Float32Array(m);
      const src = new DataView(arrayBuffer, base + s, byteLen);
      for (let i = 0; i < m; i++) data[i] = f16ToF32(src.getUint16(i * 2, true));
    } else {
      throw new Error('unsupported dtype ' + info.dtype);
    }
    weights.set(name, { data, shape: info.shape });
  }
  return weights;
}
function f16ToF32(h) {
  const s = (h & 0x8000) >> 15, e = (h & 0x7c00) >> 10, f = h & 0x03ff;
  if (e === 0) return (s ? -1 : 1) * Math.pow(2, -14) * (f / 1024);
  if (e === 0x1f) return f ? NaN : (s ? -Infinity : Infinity);
  return (s ? -1 : 1) * Math.pow(2, e - 15) * (1 + f / 1024);
}

// ---- 数値カーネル ----------------------------------------------------------
function geluNew(x) {
  // 0.5·x·(1 + tanh[√(2/π)·(x + 0.044715·x³)])
  const c = Math.sqrt(2 / Math.PI);
  return 0.5 * x * (1 + Math.tanh(c * (x + 0.044715 * x * x * x)));
}

// LayerNorm（1 ベクトル, 長さ d）。g,b は長さ d。
function layerNormVec(x, g, b, d, eps) {
  let mean = 0;
  for (let i = 0; i < d; i++) mean += x[i];
  mean /= d;
  let v = 0;
  for (let i = 0; i < d; i++) { const t = x[i] - mean; v += t * t; }
  v /= d;
  const inv = 1 / Math.sqrt(v + eps);
  const out = new Float32Array(d);
  for (let i = 0; i < d; i++) out[i] = (x[i] - mean) * inv * g[i] + b[i];
  return out;
}

// y = x·W + b。W は GPT-2 の Conv1D 形状 [inDim, outDim]（row-major）。x:[inDim] → y:[outDim]
function linearVec(x, W, b, inDim, outDim) {
  const y = new Float32Array(outDim);
  if (b) y.set(b);
  for (let i = 0; i < inDim; i++) {
    const xi = x[i];
    if (xi === 0) continue;
    const off = i * outDim;
    for (let j = 0; j < outDim; j++) y[j] += xi * W[off + j];
  }
  return y;
}

function softmaxInPlace(arr, n) {
  let max = -Infinity;
  for (let i = 0; i < n; i++) if (arr[i] > max) max = arr[i];
  let sum = 0;
  for (let i = 0; i < n; i++) { arr[i] = Math.exp(arr[i] - max); sum += arr[i]; }
  for (let i = 0; i < n; i++) arr[i] /= sum;
  return arr;
}

// ---- モデル本体 ------------------------------------------------------------
export class GPT2 {
  constructor(weights, config = {}) {
    this.w = weights;
    this.nLayer = config.n_layer ?? 12;
    this.nHead = config.n_head ?? 12;
    this.nEmbd = config.n_embd ?? 768;
    this.nCtx = config.n_ctx ?? 1024;
    this.vocab = config.vocab_size ?? 50257;
    this.eps = config.layer_norm_epsilon ?? 1e-5;
    this.headDim = this.nEmbd / this.nHead;
    const need = ['wte.weight', 'wpe.weight', 'ln_f.weight', 'ln_f.bias', 'h.0.attn.c_attn.weight'];
    for (const n of need) if (!this.w.has(n)) throw new Error('重みが見つかりません: ' + n);
  }
  _t(name) { const t = this.w.get(name); if (!t) throw new Error('missing ' + name); return t.data; }

  // tokens（id 配列）を forward。capture:true で各層の内部表現を保存。
  // 返り値: { T, logits:[vocab], attn?, lens?, residNorm? }
  forward(tokens, { capture = false, lensTopK = 5 } = {}) {
    const T = tokens.length, D = this.nEmbd, H = this.nHead, hd = this.headDim, L = this.nLayer;
    const wte = this._t('wte.weight'), wpe = this._t('wpe.weight');

    // 残差ストリーム h: [T][D]
    const h = [];
    for (let t = 0; t < T; t++) {
      const row = new Float32Array(D);
      const tokOff = tokens[t] * D, posOff = t * D;
      for (let i = 0; i < D; i++) row[i] = wte[tokOff + i] + wpe[posOff + i];
      h.push(row);
    }

    const cap = capture ? { attn: [], lens: [], residNorm: [], attnContrib: [], mlpContrib: [], mlpAct: [] } : null;
    if (cap) cap.residNorm.push(vecNorm(h[T - 1]));

    for (let l = 0; l < L; l++) {
      const p = `h.${l}.`;
      const ln1g = this._t(p + 'ln_1.weight'), ln1b = this._t(p + 'ln_1.bias');
      const aW = this._t(p + 'attn.c_attn.weight'), aB = this._t(p + 'attn.c_attn.bias');
      const pW = this._t(p + 'attn.c_proj.weight'), pB = this._t(p + 'attn.c_proj.bias');

      // --- causal self-attention ---
      // Q,K,V: [T][D]
      const Q = [], K = [], V = [];
      for (let t = 0; t < T; t++) {
        const x = layerNormVec(h[t], ln1g, ln1b, D, this.eps);
        const qkv = linearVec(x, aW, aB, D, 3 * D);
        Q.push(qkv.subarray(0, D)); K.push(qkv.subarray(D, 2 * D)); V.push(qkv.subarray(2 * D, 3 * D));
      }
      const attnOut = [];
      for (let t = 0; t < T; t++) attnOut.push(new Float32Array(D));
      const scale = 1 / Math.sqrt(hd);
      const headAttn = capture ? new Float32Array(H * T * T) : null; // [head][T][T]
      for (let head = 0; head < H; head++) {
        const ho = head * hd;
        for (let i = 0; i < T; i++) {
          // scores over j<=i
          const scores = new Float32Array(i + 1);
          for (let j = 0; j <= i; j++) {
            let s = 0;
            const qi = Q[i], kj = K[j];
            for (let d = 0; d < hd; d++) s += qi[ho + d] * kj[ho + d];
            scores[j] = s * scale;
          }
          softmaxInPlace(scores, i + 1);
          if (headAttn) { const base = head * T * T + i * T; for (let j = 0; j <= i; j++) headAttn[base + j] = scores[j]; }
          // weighted sum of V
          const out = attnOut[i];
          for (let j = 0; j <= i; j++) {
            const a = scores[j], vj = V[j];
            for (let d = 0; d < hd; d++) out[ho + d] += a * vj[ho + d];
          }
        }
      }
      if (cap) cap.attn.push(headAttn);
      // c_proj + residual add
      for (let t = 0; t < T; t++) {
        const proj = linearVec(attnOut[t], pW, pB, D, D);
        if (cap && t === T - 1) cap.attnContrib.push(vecNorm(proj)); // 注意が残差に足す量（最終位置）
        for (let i = 0; i < D; i++) h[t][i] += proj[i];
      }

      // --- MLP ---
      const ln2g = this._t(p + 'ln_2.weight'), ln2b = this._t(p + 'ln_2.bias');
      const fcW = this._t(p + 'mlp.c_fc.weight'), fcB = this._t(p + 'mlp.c_fc.bias');
      const mpW = this._t(p + 'mlp.c_proj.weight'), mpB = this._t(p + 'mlp.c_proj.bias');
      for (let t = 0; t < T; t++) {
        const x = layerNormVec(h[t], ln2g, ln2b, D, this.eps);
        const a = linearVec(x, fcW, fcB, D, 4 * D);
        for (let k = 0; k < a.length; k++) a[k] = geluNew(a[k]);
        const m = linearVec(a, mpW, mpB, 4 * D, D);
        if (cap && t === T - 1) { cap.mlpAct.push(a.slice()); cap.mlpContrib.push(vecNorm(m)); } // MLP中間活性(3072)とMLPが残差に足す量
        for (let i = 0; i < D; i++) h[t][i] += m[i];
      }

      if (cap) {
        cap.residNorm.push(vecNorm(h[T - 1]));
        // logit lens: 最終位置の中間 h に ln_f+lm_head を適用した top-k
        cap.lens.push(this._topkFromHidden(h[T - 1], lensTopK));
      }
    }

    // 最終 LayerNorm → lm_head（= wteᵀ, 重み共有）。最終位置のみ。
    const lnfg = this._t('ln_f.weight'), lnfb = this._t('ln_f.bias');
    const hf = layerNormVec(h[T - 1], lnfg, lnfb, D, this.eps);
    const logits = this._lmHead(hf);
    return { T, logits, attn: cap?.attn ?? null, lens: cap?.lens ?? null, residNorm: cap?.residNorm ?? null,
      attnContrib: cap?.attnContrib ?? null, mlpContrib: cap?.mlpContrib ?? null, mlpAct: cap?.mlpAct ?? null };
  }

  _lmHead(vec) {
    const wte = this._t('wte.weight'), D = this.nEmbd, V = this.vocab;
    const logits = new Float32Array(V);
    for (let v = 0; v < V; v++) {
      let s = 0; const off = v * D;
      for (let i = 0; i < D; i++) s += vec[i] * wte[off + i];
      logits[v] = s;
    }
    return logits;
  }
  _topkFromHidden(hVec, k) {
    const lnfg = this._t('ln_f.weight'), lnfb = this._t('ln_f.bias');
    const hf = layerNormVec(hVec, lnfg, lnfb, this.nEmbd, this.eps);
    const logits = this._lmHead(hf);
    return topkSoftmax(logits, k);
  }
}

function vecNorm(v) { let s = 0; for (let i = 0; i < v.length; i++) s += v[i] * v[i]; return Math.sqrt(s); }

// logits → top-k の {id, prob}（softmax は全体で計算）。
export function topkSoftmax(logits, k) {
  const n = logits.length;
  k = Math.max(0, Math.min(n, k | 0));
  if (k === 0) return [];
  const probs = new Float32Array(n);
  let max = -Infinity;
  for (let i = 0; i < n; i++) if (logits[i] > max) max = logits[i];
  let sum = 0;
  for (let i = 0; i < n; i++) { probs[i] = Math.exp(logits[i] - max); sum += probs[i]; }
  for (let i = 0; i < n; i++) probs[i] /= sum;
  // 全語彙 sort O(V log V) を避け、必要な k 件だけを降順に保つ O(Vk)。
  const best = [];
  for (let id = 0; id < n; id++) {
    const p = probs[id];
    if (best.length === k && p <= best[best.length - 1].prob) continue;
    let at = best.length;
    while (at > 0 && best[at - 1].prob < p) at--;
    best.splice(at, 0, { id, prob: p });
    if (best.length > k) best.pop();
  }
  return best;
}

// 次トークンをサンプリング。opts: {temperature, topK, topP, greedy, rand}
export function sampleNext(logits, opts = {}) {
  const { temperature = 1.0, topK = 0, topP = 1.0, greedy = false } = opts;
  const rand = opts.rand || Math.random;
  const n = logits.length;
  if (greedy || temperature <= 0) {
    let best = 0; for (let i = 1; i < n; i++) if (logits[i] > logits[best]) best = i;
    return best;
  }
  // temperature
  const scaled = new Float32Array(n);
  for (let i = 0; i < n; i++) scaled[i] = logits[i] / temperature;
  // softmax
  let max = -Infinity; for (let i = 0; i < n; i++) if (scaled[i] > max) max = scaled[i];
  let sum = 0; const probs = new Float32Array(n);
  for (let i = 0; i < n; i++) { probs[i] = Math.exp(scaled[i] - max); sum += probs[i]; }
  for (let i = 0; i < n; i++) probs[i] /= sum;
  // top-k / top-p で候補を絞る。通常の top-k では語彙全体の sort を避ける。
  let idx;
  if (topK > 0 && topK < n) {
    const best = [];
    for (let id = 0; id < n; id++) {
      const p = probs[id];
      if (best.length === topK && p <= probs[best[best.length - 1]]) continue;
      let at = best.length;
      while (at > 0 && probs[best[at - 1]] < p) at--;
      best.splice(at, 0, id);
      if (best.length > topK) best.pop();
    }
    idx = best;
  } else if (topP < 1.0) {
    idx = Array.from({ length: n }, (_, i) => i).sort((a, b) => probs[b] - probs[a]);
  } else {
    idx = Array.from({ length: n }, (_, i) => i);
  }
  if (topP < 1.0) {
    const kept = []; let acc = 0;
    for (const i of idx) { kept.push(i); acc += probs[i]; if (acc >= topP) break; }
    idx = kept;
  }
  let z = 0; for (const i of idx) z += probs[i];
  let r = rand() * z;
  for (const i of idx) { r -= probs[i]; if (r <= 0) return i; }
  return idx[idx.length - 1];
}
