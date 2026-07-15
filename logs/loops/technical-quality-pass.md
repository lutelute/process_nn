# Technical quality pass — verification log

- Date: 2026-07-13–15 (Asia/Tokyo)
- Branch: `codex/technical-quality-pass`
- Scope: technical accuracy, reproducibility, browser responsiveness, representative visual review

## Automated verification

| Command | Result |
|---|---|
| `npm run verify` | PASS — tokenizer known values/round trips, math/evaluation/diffusion invariants, 112 term-note entries and all 77 note mappings, 80-HTML links and inline-JS syntax |
| `npm run test:browser -- 8766` | PASS — 80 HTML, no console error / uncaught exception / failed request |
| `npm run test:interactions -- 8766` | PASS — 80 HTML, 501 clicks; 3 expensive reduced-motion paths reached responsive `aria-busy` state |
| `npm run test:diffusion -- 8765` | PASS twice — final loss `0.608`, distribution coverage `8/8`; 3.6 s and 2.2 s on this machine |
| `git diff --check` | PASS |

The diffusion wall-clock time is machine-dependent. Loss and coverage are deterministic here because the smoke test enters the training step directly and the demo uses a fixed seed.

## Visual review

- RAG final step: retrieval scores, retrieved original text, constructed context, and the generator boundary are visible without implying that an LLM ran.
- Diffusion learning step: the compact network trains without blocking the page; the shared misconception block now wraps emphasis and links as normal inline text.
- Quality review: `quality-review.html` was checked at 1440 px and 390 px; no document-level horizontal overflow, with explicit horizontal-scroll guidance for dense tables.
- Math toolbox: all five numerical steps were checked at desktop and mobile widths; analytical/fixed-difference gradients and `CE = H + KL` agree with independent Node reference checks. Keyboard step selection, zero mobile overflow, and the non-animated reduced-motion path also passed.
- Model evaluation: all five steps were checked at desktop and mobile widths; MAE/RMSE/R², ROC AUC, average precision, Brier score, and t-based confidence intervals agree with independent Node reference checks. Keyboard and reduced-motion paths passed.
- Term-note Wiki: 112 entries render as a two-column desktop / one-column mobile index with zero document overflow. Search, category filter, fixed links, related-note links, the per-note drawer, Escape close, and the separate GPT-2 integration passed without browser errors.

Browser tests replace Google Fonts CSS with an empty response so CI exercises the declared local fallback fonts and does not depend on third-party font availability.

## Deliberately not claimed

- GPT-2 reference logits and real-weight generation were not verified because the 548 MB weight file is not stored in the repository.
- This pass does not constitute a full WCAG audit or convergence testing over every dataset/seed combination.
