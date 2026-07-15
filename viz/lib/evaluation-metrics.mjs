const assertVector = (values, name) => {
  if (!Array.isArray(values) || !values.length || values.some(value => !Number.isFinite(value))) {
    throw new TypeError(`${name} must be a non-empty numeric vector`);
  }
};

const assertPair = (left, right, leftName, rightName) => {
  assertVector(left, leftName);
  assertVector(right, rightName);
  if (left.length !== right.length) throw new RangeError(`${leftName} and ${rightName} must have equal lengths`);
};

const assertBinaryLabels = labels => {
  assertVector(labels, 'labels');
  if (labels.some(value => value !== 0 && value !== 1)) throw new RangeError('labels must contain only 0 or 1');
};

export function regressionMetrics(yTrue, yPred) {
  assertPair(yTrue, yPred, 'yTrue', 'yPred');
  const errors = yPred.map((value, index) => value - yTrue[index]);
  const mae = errors.reduce((sum, value) => sum + Math.abs(value), 0) / errors.length;
  const mse = errors.reduce((sum, value) => sum + value * value, 0) / errors.length;
  const mean = yTrue.reduce((sum, value) => sum + value, 0) / yTrue.length;
  const total = yTrue.reduce((sum, value) => sum + (value - mean) ** 2, 0);
  const residual = errors.reduce((sum, value) => sum + value * value, 0);
  return { mae, rmse: Math.sqrt(mse), r2: total === 0 ? (residual === 0 ? 1 : 0) : 1 - residual / total, errors };
}

export function rocAuc(labels, scores) {
  assertBinaryLabels(labels);
  assertPair(labels, scores, 'labels', 'scores');
  const positives = scores.filter((_, index) => labels[index] === 1);
  const negatives = scores.filter((_, index) => labels[index] === 0);
  if (!positives.length || !negatives.length) throw new RangeError('ROC AUC requires both classes');
  let wins = 0;
  for (const positive of positives) for (const negative of negatives) {
    wins += positive > negative ? 1 : positive === negative ? 0.5 : 0;
  }
  return wins / (positives.length * negatives.length);
}

export function averagePrecision(labels, scores) {
  assertBinaryLabels(labels);
  assertPair(labels, scores, 'labels', 'scores');
  const positives = labels.reduce((sum, value) => sum + value, 0);
  if (!positives) throw new RangeError('average precision requires at least one positive');
  const ranked = labels.map((label, index) => ({ label, score: scores[index], index }))
    .sort((a, b) => b.score - a.score || a.index - b.index);
  let truePositives = 0, precisionSum = 0;
  ranked.forEach((item, index) => {
    if (item.label === 1) {
      truePositives++;
      precisionSum += truePositives / (index + 1);
    }
  });
  return precisionSum / positives;
}

export function brierScore(labels, probabilities) {
  assertBinaryLabels(labels);
  assertPair(labels, probabilities, 'labels', 'probabilities');
  if (probabilities.some(value => value < 0 || value > 1)) throw new RangeError('probabilities must be within [0, 1]');
  return probabilities.reduce((sum, value, index) => sum + (value - labels[index]) ** 2, 0) / labels.length;
}

export function mean(values) {
  assertVector(values, 'values');
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function sampleStandardDeviation(values) {
  assertVector(values, 'values');
  if (values.length < 2) throw new RangeError('sample standard deviation requires at least two values');
  const average = mean(values);
  return Math.sqrt(values.reduce((sum, value) => sum + (value - average) ** 2, 0) / (values.length - 1));
}

const T_975 = [null, 12.706, 4.303, 3.182, 2.776, 2.571, 2.447, 2.365, 2.306, 2.262,
  2.228, 2.201, 2.179, 2.160, 2.145, 2.131, 2.120, 2.110, 2.101, 2.093, 2.086, 2.080,
  2.074, 2.069, 2.064, 2.060, 2.056, 2.052, 2.048, 2.045];

export function meanConfidenceInterval(values) {
  assertVector(values, 'values');
  if (values.length < 3) throw new RangeError('95% mean confidence interval requires at least three values');
  const average = mean(values);
  const df = values.length - 1;
  const critical = df < T_975.length ? T_975[df] : 1.96;
  const margin = critical * sampleStandardDeviation(values) / Math.sqrt(values.length);
  return { mean: average, lower: average - margin, upper: average + margin, margin, critical };
}

export function pairedDifferenceConfidenceInterval(baseline, candidate) {
  assertPair(baseline, candidate, 'baseline', 'candidate');
  return meanConfidenceInterval(candidate.map((value, index) => value - baseline[index]));
}
