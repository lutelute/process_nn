// 学習の進行を「履歴」として持つ。説明の往復や時点の選択は閲覧だけで、学習を進めるのは train() だけ。
// 点 k = k 回更新した後の全パラメータ θₖ。Trace（値・勾配）は θₖ で計算し直して返す
// （直前の更新に使った勾配とは区別する）。
import { cloneTheta, run, sgdStep } from './core.mjs';

export class Session {
  constructor(model, theta0, batch, { lr = 0.1 } = {}) {
    this.model = model;
    this.batch = batch;
    this.lr = lr;
    this.history = [cloneTheta(theta0)];
    this.losses = [];
    this.cache = new Map();
    this.previews = new Map();
    this.losses.push(this.at(0).loss);
  }

  get length() { return this.history.length; }      // 記録済みの時点数（更新回数 + 1）
  theta(k) { return cloneTheta(this.history[k]); }   // 複製を返す（呼び出し側が履歴を書き換えられないように）

  at(k) {
    if (!this.cache.has(k)) this.cache.set(k, run(this.model, this.history[k], this.batch));
    return this.cache.get(k);
  }

  // θₖ から 1 回だけ更新した結果の Trace。履歴には記録しない（説明のための「もし今更新したら」）。
  // train() と同じ sgdStep なので、記録済みなら at(k + 1) と一致する。
  preview(k) {
    if (!this.previews.has(k)) this.previews.set(k, run(this.model, sgdStep(this.history[k], this.at(k).grads, this.lr), this.batch));
    return this.previews.get(k);
  }

  // 末尾から n 回だけ更新を足す。途中の時点を見ていても、履歴の末尾から続ける。
  train(n = 1) {
    for (let t = 0; t < n; t++) {
      const k = this.history.length - 1;
      const next = sgdStep(this.history[k], this.at(k).grads, this.lr);
      this.history.push(next);
      this.losses.push(this.at(k + 1).loss);
    }
    return this.history.length - 1;
  }
}
