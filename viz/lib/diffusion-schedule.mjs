// Short-step cosine noise schedule from Nichol & Dhariwal (ICML 2021), Eq. 16.
// https://proceedings.mlr.press/v139/nichol21a.html
//
// The original DDPM linear beta endpoints assume about 1000 steps. Reusing them
// unchanged for 20--80 steps leaves substantial data signal at the terminal
// state. The cosine schedule defines alpha_bar first and then derives beta, so
// the terminal state stays close to N(0, I) even in this compact teaching demo.
export function cosineDiffusionSchedule(steps, { offset = 0.008, maxBeta = 0.999 } = {}) {
  if (!Number.isInteger(steps) || steps < 2) throw new RangeError('steps must be an integer >= 2');
  if (!(offset >= 0)) throw new RangeError('offset must be >= 0');
  if (!(maxBeta > 0 && maxBeta < 1)) throw new RangeError('maxBeta must be between 0 and 1');

  const signal = t => {
    const phase = ((t / steps) + offset) / (1 + offset) * Math.PI / 2;
    return Math.cos(phase) ** 2;
  };
  const initialSignal = signal(0);
  const beta = [];
  const alpha = [];
  const alphaBar = [];
  let cumulative = 1;

  for (let t = 0; t < steps; t++) {
    const current = signal(t) / initialSignal;
    const next = signal(t + 1) / initialSignal;
    const variance = Math.min(maxBeta, Math.max(1e-8, 1 - next / current));
    beta.push(variance);
    alpha.push(1 - variance);
    cumulative *= 1 - variance;
    alphaBar.push(cumulative);
  }

  return { beta, alpha, alphaBar };
}
