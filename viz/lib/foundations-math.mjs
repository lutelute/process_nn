const assertVector = (v, name) => {
  if (!Array.isArray(v) || !v.length || v.some(x => !Number.isFinite(x))) throw new TypeError(`${name} must be a non-empty numeric vector`);
};

const assertMatrix = (m, name) => {
  if (!Array.isArray(m) || !m.length || !Array.isArray(m[0]) || !m[0].length) throw new TypeError(`${name} must be a non-empty matrix`);
  const cols = m[0].length;
  if (m.some(row => !Array.isArray(row) || row.length !== cols || row.some(x => !Number.isFinite(x)))) throw new TypeError(`${name} must be rectangular and numeric`);
};

const assertDistribution = (p, name) => {
  assertVector(p, name);
  if (p.some(x => x < 0 || x > 1) || Math.abs(p.reduce((a, b) => a + b, 0) - 1) > 1e-9) {
    throw new RangeError(`${name} must be a probability distribution summing to 1`);
  }
};

export function dot(a, b) {
  assertVector(a, 'a'); assertVector(b, 'b');
  if (a.length !== b.length) throw new RangeError('dot product requires equal lengths');
  return a.reduce((sum, value, i) => sum + value * b[i], 0);
}

export function matVec(matrix, vector, bias = null) {
  assertMatrix(matrix, 'matrix'); assertVector(vector, 'vector');
  if (matrix[0].length !== vector.length) throw new RangeError('matrix columns must match vector length');
  if (bias !== null) { assertVector(bias, 'bias'); if (bias.length !== matrix.length) throw new RangeError('bias length must match matrix rows'); }
  return matrix.map((row, i) => dot(row, vector) + (bias !== null ? bias[i] : 0));
}

export function matMul(a, b) {
  assertMatrix(a, 'a'); assertMatrix(b, 'b');
  if (a[0].length !== b.length) throw new RangeError('inner matrix dimensions must match');
  return a.map(row => Array.from({ length: b[0].length }, (_, col) =>
    row.reduce((sum, value, k) => sum + value * b[k][col], 0)));
}

export function softmax(logits) {
  assertVector(logits, 'logits');
  const max = Math.max(...logits);
  const weights = logits.map(x => Math.exp(x - max));
  const sum = weights.reduce((a, b) => a + b, 0);
  return weights.map(x => x / sum);
}

export function entropy(p) {
  assertDistribution(p, 'p');
  return -p.reduce((sum, value) => sum + (value > 0 ? value * Math.log(value) : 0), 0);
}

export function crossEntropy(q, p) {
  assertDistribution(q, 'q'); assertDistribution(p, 'p');
  if (q.length !== p.length) throw new RangeError('distributions must have equal lengths');
  return -q.reduce((sum, value, i) => sum + (value > 0 ? value * Math.log(p[i]) : 0), 0);
}

export function klDivergence(q, p) {
  return crossEntropy(q, p) - entropy(q);
}

export function chainRuleExample({ x, w = 1.5, b = -0.4, target = 0.8 }) {
  for (const value of [x, w, b, target]) if (!Number.isFinite(value)) throw new TypeError('chain-rule inputs must be finite');
  const z = w * x + b;
  const y = 1 / (1 + Math.exp(-z));
  const loss = 0.5 * (y - target) ** 2;
  const dLossDy = y - target;
  const dYdZ = y * (1 - y);
  const dZdW = x;
  const dLossDw = dLossDy * dYdZ * dZdW;
  return { z, y, loss, dLossDy, dYdZ, dZdW, dLossDw };
}
