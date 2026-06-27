// 小型 char-level decoder-only Transformer（教育用・素 JS）
//
// forward + backward + Adam を自前実装。サイズが小さいので、ブラウザで 1 トークンごとに
// 内部構造（attention 全ヘッド・残差ストリーム・MLP 活性・logit lens）をリアルタイム観察できる。
//
// 使い方:
//   Node で学習 → exportWeights() で JSON 化 → 同梱 → ブラウザは importWeights()+forward+可視化。
//   ブラウザ側は forward だけでよい（軽量）。学習(backward)は Node 専用。
//
// 構造は GPT-2 と同じ Pre-LN decoder-only（ln1→attn→残差→ln2→mlp→残差）、活性は gelu(tanh近似)、
// lm_head は wte と重み共有(tied)。位置は学習可能な絶対位置(wpe)。

const mat = (r, c) => Array.from({ length: r }, () => new Float32Array(c));
const zeros = (n) => new Float32Array(n);

// ---- 線形 y = x·W + b（W:[in][out]） ----
function linF(X, W, b) {
  const N = X.length, IN = W.length, OUT = W[0].length, Y = mat(N, OUT);
  for (let n = 0; n < N; n++) {
    const xn = X[n], yn = Y[n];
    for (let o = 0; o < OUT; o++) yn[o] = b ? b[o] : 0;
    for (let i = 0; i < IN; i++) { const xi = xn[i]; if (xi === 0) continue; const Wi = W[i]; for (let o = 0; o < OUT; o++) yn[o] += xi * Wi[o]; }
  }
  return Y;
}
function linB(dY, X, W) {
  const N = X.length, IN = W.length, OUT = W[0].length;
  const dX = mat(N, IN), dW = mat(IN, OUT), db = zeros(OUT);
  for (let n = 0; n < N; n++) {
    const dyn = dY[n], xn = X[n], dxn = dX[n];
    for (let o = 0; o < OUT; o++) db[o] += dyn[o];
    for (let i = 0; i < IN; i++) { const Wi = W[i], dWi = dW[i], xi = xn[i]; let acc = 0; for (let o = 0; o < OUT; o++) { acc += dyn[o] * Wi[o]; dWi[o] += xi * dyn[o]; } dxn[i] = acc; }
  }
  return { dX, dW, db };
}

// ---- LayerNorm ----
function lnF(X, g, b, eps = 1e-5) {
  const N = X.length, D = g.length, Y = mat(N, D), stats = [];
  for (let n = 0; n < N; n++) {
    const x = X[n]; let m = 0; for (let i = 0; i < D; i++) m += x[i]; m /= D;
    let v = 0; for (let i = 0; i < D; i++) { const d = x[i] - m; v += d * d; } v /= D;
    const inv = 1 / Math.sqrt(v + eps), xh = new Float32Array(D);
    for (let i = 0; i < D; i++) { xh[i] = (x[i] - m) * inv; Y[n][i] = xh[i] * g[i] + b[i]; }
    stats.push({ xh, inv });
  }
  return { Y, cache: { X, g, b, stats, D } };
}
function lnB(dY, c) {
  const { X, g, stats, D } = c, N = X.length, dX = mat(N, D), dg = zeros(D), db = zeros(D);
  for (let n = 0; n < N; n++) {
    const dy = dY[n], { xh, inv } = stats[n], dxh = new Float32Array(D); let sdy = 0, sdyx = 0;
    for (let i = 0; i < D; i++) { dg[i] += dy[i] * xh[i]; db[i] += dy[i]; dxh[i] = dy[i] * g[i]; sdy += dxh[i]; sdyx += dxh[i] * xh[i]; }
    for (let i = 0; i < D; i++) dX[n][i] = inv * (dxh[i] - sdy / D - xh[i] * sdyx / D);
  }
  return { dX, dg, db };
}

// ---- gelu(tanh近似) ----
const GC = Math.sqrt(2 / Math.PI);
function geluF(X) {
  const N = X.length, D = X[0].length, Y = mat(N, D);
  for (let n = 0; n < N; n++) for (let i = 0; i < D; i++) { const x = X[n][i]; Y[n][i] = 0.5 * x * (1 + Math.tanh(GC * (x + 0.044715 * x * x * x))); }
  return Y;
}
function geluB(dY, X) {
  const N = X.length, D = X[0].length, dX = mat(N, D);
  for (let n = 0; n < N; n++) for (let i = 0; i < D; i++) { const x = X[n][i], t = Math.tanh(GC * (x + 0.044715 * x * x * x)), dt = (1 - t * t) * GC * (1 + 3 * 0.044715 * x * x); dX[n][i] = dY[n][i] * (0.5 * (1 + t) + 0.5 * x * dt); }
  return dX;
}

// ---- Causal multi-head attention（att 重みを cache に保持＝可視化用） ----
function attnF(X, P, nHead) {
  const T = X.length, D = X[0].length, hd = D / nHead, scale = 1 / Math.sqrt(hd);
  const QKV = linF(X, P.aw, P.ab), Q = mat(T, D), K = mat(T, D), V = mat(T, D);
  for (let t = 0; t < T; t++) for (let i = 0; i < D; i++) { Q[t][i] = QKV[t][i]; K[t][i] = QKV[t][D + i]; V[t][i] = QKV[t][2 * D + i]; }
  const att = [], ctx = mat(T, D);
  for (let h = 0; h < nHead; h++) {
    const off = h * hd, ah = mat(T, T);
    for (let i = 0; i < T; i++) {
      const sc = new Float32Array(i + 1);
      for (let j = 0; j <= i; j++) { let s = 0; for (let d = 0; d < hd; d++) s += Q[i][off + d] * K[j][off + d]; sc[j] = s * scale; }
      let mx = -Infinity; for (let j = 0; j <= i; j++) if (sc[j] > mx) mx = sc[j];
      let sm = 0; for (let j = 0; j <= i; j++) { sc[j] = Math.exp(sc[j] - mx); sm += sc[j]; }
      for (let j = 0; j <= i; j++) { sc[j] /= sm; ah[i][j] = sc[j]; }
      for (let d = 0; d < hd; d++) { let acc = 0; for (let j = 0; j <= i; j++) acc += sc[j] * V[j][off + d]; ctx[i][off + d] = acc; }
    }
    att.push(ah);
  }
  const Y = linF(ctx, P.pw, P.pb);
  return { Y, att, cache: { X, Q, K, V, att, ctx, nHead, hd, scale, P } };
}
function attnB(dY, c) {
  const { X, Q, K, V, att, ctx, nHead, hd, scale, P } = c, T = X.length, D = X[0].length;
  const pb = linB(dY, ctx, P.pw), dctx = pb.dX;
  const dQ = mat(T, D), dK = mat(T, D), dV = mat(T, D);
  for (let h = 0; h < nHead; h++) {
    const off = h * hd, ah = att[h];
    for (let i = 0; i <= T - 1; i++) {
      const da = new Float32Array(i + 1);
      for (let j = 0; j <= i; j++) { let acc = 0; for (let d = 0; d < hd; d++) acc += dctx[i][off + d] * V[j][off + d]; da[j] = acc; }
      for (let j = 0; j <= i; j++) for (let d = 0; d < hd; d++) dV[j][off + d] += ah[i][j] * dctx[i][off + d];
      let sad = 0; for (let j = 0; j <= i; j++) sad += ah[i][j] * da[j];
      for (let j = 0; j <= i; j++) { const ds = ah[i][j] * (da[j] - sad) * scale; for (let d = 0; d < hd; d++) { dQ[i][off + d] += ds * K[j][off + d]; dK[j][off + d] += ds * Q[i][off + d]; } }
    }
  }
  const dQKV = mat(T, 3 * D);
  for (let t = 0; t < T; t++) for (let i = 0; i < D; i++) { dQKV[t][i] = dQ[t][i]; dQKV[t][D + i] = dK[t][i]; dQKV[t][2 * D + i] = dV[t][i]; }
  const qb = linB(dQKV, X, P.aw);
  return { dX: qb.dX, grads: { aw: qb.dW, ab: qb.db, pw: pb.dW, pb: pb.db } };
}

// ---- パラメータ初期化 ----
function randn(rng) { let u = 0, v = 0; while (u === 0) u = rng(); while (v === 0) v = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
function initMat(r, c, std, rng) { const M = mat(r, c); for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) M[i][j] = randn(rng) * std; return M; }

export class MiniGPT {
  constructor(cfg, rng = Math.random) {
    this.cfg = { nLayer: 2, nHead: 2, nEmbd: 32, blockSize: 16, vocabSize: 16, ...cfg };
    const { nLayer, nHead, nEmbd: D, blockSize, vocabSize: V } = this.cfg;
    const s = 0.02;
    this.wte = initMat(V, D, s, rng);
    this.wpe = initMat(blockSize, D, s, rng);
    this.blocks = [];
    for (let l = 0; l < nLayer; l++) this.blocks.push({
      ln1g: new Float32Array(D).fill(1), ln1b: zeros(D),
      aw: initMat(D, 3 * D, s, rng), ab: zeros(3 * D),
      pw: initMat(D, D, s, rng), pb: zeros(D),
      ln2g: new Float32Array(D).fill(1), ln2b: zeros(D),
      fw: initMat(D, 4 * D, s, rng), fb: zeros(4 * D),
      fpw: initMat(4 * D, D, s, rng), fpb: zeros(D),
    });
    this.lnfg = new Float32Array(D).fill(1); this.lnfb = zeros(D);
    this._initAdam();
  }

  // forward。capture:true で内部表現を viz に格納。
  forward(idx, { capture = false } = {}) {
    const { nHead, nEmbd: D } = this.cfg, T = idx.length;
    let h = mat(T, D);
    for (let t = 0; t < T; t++) for (let i = 0; i < D; i++) h[t][i] = this.wte[idx[t]][i] + this.wpe[t][i];
    const caches = [], viz = capture ? { resid: [], att: [], mlpAct: [] } : null;
    if (viz) viz.resid.push(h.map(r => r.slice()));
    for (let l = 0; l < this.blocks.length; l++) {
      const B = this.blocks[l];
      const ln1 = lnF(h, B.ln1g, B.ln1b);
      const at = attnF(ln1.Y, { aw: B.aw, ab: B.ab, pw: B.pw, pb: B.pb }, nHead);
      const h1 = mat(T, D); for (let t = 0; t < T; t++) for (let i = 0; i < D; i++) h1[t][i] = h[t][i] + at.Y[t][i];
      const ln2 = lnF(h1, B.ln2g, B.ln2b);
      const fc = linF(ln2.Y, B.fw, B.fb), ga = geluF(fc), mp = linF(ga, B.fpw, B.fpb);
      const h2 = mat(T, D); for (let t = 0; t < T; t++) for (let i = 0; i < D; i++) h2[t][i] = h1[t][i] + mp[t][i];
      caches.push({ ln1, at, h1, ln2, fc, ga, mp, hPre: h });
      h = h2;
      if (viz) { viz.att.push(at.att); viz.resid.push(h.map(r => r.slice())); viz.mlpAct.push(ga.map(r => r.slice())); }
    }
    const lnf = lnF(h, this.lnfg, this.lnfb);
    // logits = lnf.Y · wteᵀ
    const T2 = T, V = this.cfg.vocabSize, logits = mat(T2, V);
    for (let t = 0; t < T2; t++) for (let v = 0; v < V; v++) { let s = 0; for (let i = 0; i < D; i++) s += lnf.Y[t][i] * this.wte[v][i]; logits[t][v] = s; }
    this._fwd = { idx, h, caches, lnf, logits, T };
    return { logits, viz, T };
  }

  // logit lens: 各層の残差（最終位置）に lnf+lm_head を当てた分布の top-1
  logitLens(viz) {
    const D = this.cfg.nEmbd, V = this.cfg.vocabSize, out = [];
    for (const resid of viz.resid) {
      const x = resid[resid.length - 1];
      const ln = lnF([x], this.lnfg, this.lnfb).Y[0];
      const lg = new Float32Array(V); for (let v = 0; v < V; v++) { let s = 0; for (let i = 0; i < D; i++) s += ln[i] * this.wte[v][i]; lg[v] = s; }
      let bi = 0; for (let v = 1; v < V; v++) if (lg[v] > lg[bi]) bi = v;
      out.push(bi);
    }
    return out;
  }

  // cross-entropy（全位置）+ backward。targets:[T]。grad を全パラメータに積む。
  backward(targets) {
    const { idx, h, caches, lnf, logits, T } = this._fwd, D = this.cfg.nEmbd, V = this.cfg.vocabSize;
    const g = this._zeroGrad();
    let loss = 0;
    const dlnfY = mat(T, D);
    for (let t = 0; t < T; t++) {
      // softmax
      const lo = logits[t]; let mx = -Infinity; for (let v = 0; v < V; v++) if (lo[v] > mx) mx = lo[v];
      let sm = 0; const p = new Float32Array(V); for (let v = 0; v < V; v++) { p[v] = Math.exp(lo[v] - mx); sm += p[v]; }
      for (let v = 0; v < V; v++) p[v] /= sm;
      loss += -Math.log(Math.max(p[targets[t]], 1e-12));
      // dlogits
      const dlo = p; dlo[targets[t]] -= 1; for (let v = 0; v < V; v++) dlo[v] /= T;
      // logits = lnf.Y · wteᵀ : dlnfY += dlo·wte ; dwte += dlo outer lnf.Y
      for (let v = 0; v < V; v++) { const dv = dlo[v]; if (dv === 0) continue; const wv = this.wte[v], gwv = g.wte[v], lt = lnf.Y[t]; for (let i = 0; i < D; i++) { dlnfY[t][i] += dv * wv[i]; gwv[i] += dv * lt[i]; } }
    }
    loss /= T;
    const lnfB = lnB(dlnfY, lnf.cache); for (let i = 0; i < D; i++) { g.lnfg[i] += lnfB.dg[i]; g.lnfb[i] += lnfB.db[i]; }
    let dh = lnfB.dX;
    for (let l = this.blocks.length - 1; l >= 0; l--) {
      const B = this.blocks[l], C = caches[l], gB = g.blocks[l];
      // h2 = h1 + mp ; dh -> dh1 += dh ; dmp = dh
      const dmp = dh;
      const mpB = linB(dmp, C.ga, B.fpw); for (let i = 0; i < B.fpw.length; i++) for (let j = 0; j < D; j++) gB.fpw[i][j] += mpB.dW[i][j]; for (let j = 0; j < D; j++) gB.fpb[j] += mpB.db[j];
      const dga = geluB(mpB.dX, C.fc);
      const fcB = linB(dga, C.ln2.Y, B.fw); for (let i = 0; i < D; i++) for (let j = 0; j < 4 * D; j++) gB.fw[i][j] += fcB.dW[i][j]; for (let j = 0; j < 4 * D; j++) gB.fb[j] += fcB.db[j];
      const ln2B = lnB(fcB.dX, C.ln2.cache); for (let i = 0; i < D; i++) { gB.ln2g[i] += ln2B.dg[i]; gB.ln2b[i] += ln2B.db[i]; }
      // dh1 = dh(from residual) + ln2B.dX
      const dh1 = mat(dh.length, D); for (let t = 0; t < dh.length; t++) for (let i = 0; i < D; i++) dh1[t][i] = dh[t][i] + ln2B.dX[t][i];
      // h1 = hPre + attn ; dattnY = dh1 ; dhPre += dh1
      const ab = attnB(dh1, C.at.cache);
      for (let i = 0; i < D; i++) for (let j = 0; j < 3 * D; j++) gB.aw[i][j] += ab.grads.aw[i][j];
      for (let j = 0; j < 3 * D; j++) gB.ab[j] += ab.grads.ab[j];
      for (let i = 0; i < D; i++) for (let j = 0; j < D; j++) gB.pw[i][j] += ab.grads.pw[i][j];
      for (let j = 0; j < D; j++) gB.pb[j] += ab.grads.pb[j];
      const ln1B = lnB(ab.dX, C.ln1.cache); for (let i = 0; i < D; i++) { gB.ln1g[i] += ln1B.dg[i]; gB.ln1b[i] += ln1B.db[i]; }
      const dhNew = mat(dh.length, D); for (let t = 0; t < dh.length; t++) for (let i = 0; i < D; i++) dhNew[t][i] = dh1[t][i] + ln1B.dX[t][i];
      dh = dhNew;
    }
    // 埋め込み: h0 = wte[idx]+wpe ; dh -> dwte[idx], dwpe[t]
    for (let t = 0; t < T; t++) for (let i = 0; i < D; i++) { g.wte[idx[t]][i] += dh[t][i]; g.wpe[t][i] += dh[t][i]; }
    this._grad = g;
    return loss;
  }

  // ---- Adam ----
  _initAdam() { this.t = 0; this.m = this._zeroGrad(); this.v = this._zeroGrad(); }
  step(lr = 3e-3, b1 = 0.9, b2 = 0.999, eps = 1e-8) {
    this.t++; const g = this._grad, m = this.m, v = this.v;
    const upd = (P, G, M, Vv) => { for (let i = 0; i < P.length; i++) { if (P[i].length !== undefined && P[i].BYTES_PER_ELEMENT === undefined && typeof P[i] !== 'number') { upd(P[i], G[i], M[i], Vv[i]); continue; } } };
    // フラット適用関数（1D/2D両対応）
    const apply = (P, G, M, Vv) => {
      if (P instanceof Float32Array) {
        for (let i = 0; i < P.length; i++) { M[i] = b1 * M[i] + (1 - b1) * G[i]; Vv[i] = b2 * Vv[i] + (1 - b2) * G[i] * G[i]; const mh = M[i] / (1 - Math.pow(b1, this.t)), vh = Vv[i] / (1 - Math.pow(b2, this.t)); P[i] -= lr * mh / (Math.sqrt(vh) + eps); }
      } else { for (let i = 0; i < P.length; i++) apply(P[i], G[i], M[i], Vv[i]); }
    };
    apply(this.wte, g.wte, m.wte, v.wte); apply(this.wpe, g.wpe, m.wpe, v.wpe);
    for (let l = 0; l < this.blocks.length; l++) for (const k of ['ln1g', 'ln1b', 'aw', 'ab', 'pw', 'pb', 'ln2g', 'ln2b', 'fw', 'fb', 'fpw', 'fpb']) apply(this.blocks[l][k], g.blocks[l][k], m.blocks[l][k], v.blocks[l][k]);
    apply(this.lnfg, g.lnfg, m.lnfg, v.lnfg); apply(this.lnfb, g.lnfb, m.lnfb, v.lnfb);
  }
  _zeroGrad() {
    const D = this.cfg.nEmbd, V = this.cfg.vocabSize, bs = this.cfg.blockSize;
    return {
      wte: mat(V, D), wpe: mat(bs, D),
      blocks: this.blocks.map(() => ({ ln1g: zeros(D), ln1b: zeros(D), aw: mat(D, 3 * D), ab: zeros(3 * D), pw: mat(D, D), pb: zeros(D), ln2g: zeros(D), ln2b: zeros(D), fw: mat(D, 4 * D), fb: zeros(4 * D), fpw: mat(4 * D, D), fpb: zeros(D) })),
      lnfg: zeros(D), lnfb: zeros(D),
    };
  }

  // 次トークンサンプリング（最終位置）
  sample(logits, { temperature = 1.0, greedy = false, rand = Math.random } = {}) {
    const last = logits[logits.length - 1], V = last.length;
    if (greedy || temperature <= 0) { let b = 0; for (let v = 1; v < V; v++) if (last[v] > last[b]) b = v; return b; }
    const p = new Float32Array(V); let mx = -Infinity; for (let v = 0; v < V; v++) { const x = last[v] / temperature; if (x > mx) mx = x; }
    let sm = 0; for (let v = 0; v < V; v++) { p[v] = Math.exp(last[v] / temperature - mx); sm += p[v]; }
    let r = rand() * sm; for (let v = 0; v < V; v++) { r -= p[v]; if (r <= 0) return v; } return V - 1;
  }

  exportWeights() {
    const f = (M) => Array.from(M, (row) => Array.from(row));
    return {
      cfg: this.cfg,
      wte: f(this.wte), wpe: f(this.wpe), lnfg: Array.from(this.lnfg), lnfb: Array.from(this.lnfb),
      blocks: this.blocks.map(B => ({ ln1g: Array.from(B.ln1g), ln1b: Array.from(B.ln1b), aw: f(B.aw), ab: Array.from(B.ab), pw: f(B.pw), pb: Array.from(B.pb), ln2g: Array.from(B.ln2g), ln2b: Array.from(B.ln2b), fw: f(B.fw), fb: Array.from(B.fb), fpw: f(B.fpw), fpb: Array.from(B.fpb) })),
    };
  }
  static importWeights(j) {
    const m = Object.create(MiniGPT.prototype);
    m.cfg = j.cfg;
    const F = (A) => A.map(r => Float32Array.from(r));
    m.wte = F(j.wte); m.wpe = F(j.wpe); m.lnfg = Float32Array.from(j.lnfg); m.lnfb = Float32Array.from(j.lnfb);
    m.blocks = j.blocks.map(B => ({ ln1g: Float32Array.from(B.ln1g), ln1b: Float32Array.from(B.ln1b), aw: F(B.aw), ab: Float32Array.from(B.ab), pw: F(B.pw), pb: Float32Array.from(B.pb), ln2g: Float32Array.from(B.ln2g), ln2b: Float32Array.from(B.ln2b), fw: F(B.fw), fb: Float32Array.from(B.fb), fpw: F(B.fpw), fpb: Float32Array.from(B.fpb) }));
    return m;
  }
}
