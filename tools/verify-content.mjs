// 教材の説明と実装が再び食い違わないための、小さく決定的な内容検証。
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cosineDiffusionSchedule } from '../viz/lib/diffusion-schedule.mjs';
import { averagePrecision, brierScore, meanConfidenceInterval, regressionMetrics, rocAuc } from '../viz/lib/evaluation-metrics.mjs';
import { chainRuleExample, crossEntropy, dot, entropy, klDivergence, matMul, matVec, softmax } from '../viz/lib/foundations-math.mjs';
import { sampleNext, topkSoftmax } from '../gpt2/tools/gpt2.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let failed = 0;
const ok = message => console.log('  ok   ' + message);
const fail = message => { console.error('  FAIL ' + message); failed++; };
const check = (condition, message) => condition ? ok(message) : fail(message);
const read = path => readFileSync(resolve(root, path), 'utf8');
const close = (a, b, tolerance = 1e-9) => Math.abs(a - b) <= tolerance;

// 数学の道具箱で表示する計算を、画面とは独立した参照値で固定する。
check(close(dot([2, -1], [1.5, -0.8]), 3.8), 'foundations dot product: scalar reference');
check(JSON.stringify(matVec([[1, 2], [3, 4]], [2, -1], [0.5, -0.5])) === JSON.stringify([0.5, 1.5]),
  'foundations matrix-vector product: shape and values');
check(JSON.stringify(matMul([[1, 2, 3], [4, 5, 6]], [[7, 8], [9, 10], [11, 12]])) === JSON.stringify([[58, 64], [139, 154]]),
  'foundations matrix product: row-column references');
const targetDistribution = [0.8, 0.1, 0.1];
const predictedDistribution = softmax([1.2, 1, -0.5]);
check(close(predictedDistribution.reduce((a, b) => a + b, 0), 1), 'foundations softmax: probabilities sum to 1');
check(close(crossEntropy(targetDistribution, predictedDistribution),
  entropy(targetDistribution) + klDivergence(targetDistribution, predictedDistribution)),
  'foundations probability identity: CE(q,p) = H(q) + KL(q||p)');
const chainX = 1.2, chainW = 1.5, epsilon = 1e-4;
const analyticGradient = chainRuleExample({ x: chainX, w: chainW }).dLossDw;
const numericGradient = (chainRuleExample({ x: chainX, w: chainW + epsilon }).loss
  - chainRuleExample({ x: chainX, w: chainW - epsilon }).loss) / (2 * epsilon);
check(close(analyticGradient, numericGradient, 1e-7), 'foundations chain rule: analytic gradient matches finite difference');

// モデル評価ページの物差しを、既知の小さな参照例で固定する。
const regressionReference = regressionMetrics([1, 2, 3], [1, 2, 5]);
check(close(regressionReference.mae, 2 / 3) && close(regressionReference.rmse, Math.sqrt(4 / 3))
  && close(regressionReference.r2, -1), 'evaluation regression: MAE, RMSE, and negative R-squared references');
check(close(rocAuc([1, 0, 1, 0], [0.9, 0.8, 0.7, 0.1]), 0.75)
  && close(rocAuc([1, 0], [0.5, 0.5]), 0.5), 'evaluation ROC AUC: pair ordering and tie references');
check(close(averagePrecision([1, 0, 1], [0.9, 0.8, 0.7]), 5 / 6),
  'evaluation average precision: ranked reference');
check(close(brierScore([1, 0], [0.8, 0.3]), 0.065), 'evaluation Brier score: probability reference');
const confidenceReference = meanConfidenceInterval([1, 2, 3, 4, 5]);
check(close(confidenceReference.mean, 3) && close(confidenceReference.critical, 2.776)
  && close(confidenceReference.margin, 1.9629284245738559), 'evaluation confidence interval: t-based 95% reference');

for (const steps of [20, 40, 80]) {
  const { beta, alpha, alphaBar } = cosineDiffusionSchedule(steps);
  check(beta.length === steps && alpha.length === steps && alphaBar.length === steps,
    `diffusion T=${steps}: schedule length`);
  check(beta.every(v => v > 0 && v < 1), `diffusion T=${steps}: 0 < beta < 1`);
  check(alphaBar.every((v, i) => i === 0 || v < alphaBar[i - 1]),
    `diffusion T=${steps}: alpha_bar strictly decreases`);
  check(alphaBar.at(-1) < 1e-4,
    `diffusion T=${steps}: terminal signal ${alphaBar.at(-1).toExponential(2)} < 1e-4`);
}

// 最適化した top-k が、全 sort する素朴な参照実装と一致することを確認。
const logits = Float32Array.from([0.2, -1.1, 3.4, 0.2, 2.7, -4.0, 1.8, 3.1]);
const actual = topkSoftmax(logits, 4);
const max = Math.max(...logits);
const weights = Array.from(logits, x => Math.exp(x - max));
const sum = weights.reduce((a, b) => a + b, 0);
const expectedIds = weights.map((p, id) => ({ id, p: p / sum })).sort((a, b) => b.p - a.p).slice(0, 4).map(x => x.id);
check(actual.map(x => x.id).join(',') === expectedIds.join(','), 'GPT-2 topkSoftmax: reference ordering');
check(Math.abs(actual[0].prob - weights[expectedIds[0]] / sum) < 1e-6, 'GPT-2 topkSoftmax: reference probability');
check(sampleNext(logits, { topK: 3, rand: () => 0 }) === expectedIds[0],
  'GPT-2 sampleNext: optimized top-k retains the largest logit');

const rag = read('viz/rag.html');
check(!rag.includes('Q.a'), 'RAG: no pre-authored answer lookup');
check(!/{q:'[^']+',\s*a:/.test(rag), 'RAG: questions do not embed preset answers');
check(rag.includes('ここまでがこのデモで実際に動く範囲'), 'RAG: implemented boundary is explicit');

const readme = read('README.md');
check(!readme.includes('勾配降下＝正規方程式'), 'linear regression: GD is not equated with normal equation');
check(!readme.includes('Mixtral/GPT-4 の構造'), 'MoE: undisclosed GPT-4 architecture is not asserted');

const vae = read('viz/vae.html');
check(!vae.includes('すべて意味のある点に復号される'), 'VAE: no guarantee that every latent sample is meaningful');

for (const path of ['viz/gp.html', 'viz/surrogate.html']) {
  check(!read(path).includes('95% 信頼区間') && !read(path).includes('95%信頼区間'),
    `${path}: GP posterior band is not mislabeled as a frequentist confidence interval`);
  check(read(path).includes('信用帯'), `${path}: model-conditional credible-band boundary is explicit`);
}

for (const path of ['index.html', 'viz/attention3d.html', 'viz/transformer.html']) {
  check(!read(path).includes('Math.random'), `${path}: seeded teaching-demo RNG`);
}

console.log(failed ? `\n✗ 内容検証 ${failed} 件失敗` : '\n✓ 教材内容の回帰検証に合格');
process.exit(failed ? 1 : 0);
