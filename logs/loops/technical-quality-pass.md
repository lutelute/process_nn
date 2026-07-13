# Technical quality pass — verification log

- Date: 2026-07-13–14 (Asia/Tokyo)
- Branch: `codex/technical-quality-pass`
- Scope: technical accuracy, reproducibility, browser responsiveness, representative visual review

## Automated verification

| Command | Result |
|---|---|
| `npm run verify` | PASS — tokenizer known values/round trips, math/diffusion content invariants, 78-HTML links and inline-JS syntax |
| `npm run test:browser -- 8765` | PASS — 78 HTML, no console error / uncaught exception / failed request |
| `npm run test:interactions -- 8765` | PASS — 78 HTML, 497 clicks; 3 expensive reduced-motion paths reached responsive `aria-busy` state |
| `npm run test:diffusion -- 8765` | PASS twice — final loss `0.608`, distribution coverage `8/8`; 3.6 s and 2.2 s on this machine |
| `git diff --check` | PASS |

The diffusion wall-clock time is machine-dependent. Loss and coverage are deterministic here because the smoke test enters the training step directly and the demo uses a fixed seed.

## Visual review

- RAG final step: retrieval scores, retrieved original text, constructed context, and the generator boundary are visible without implying that an LLM ran.
- Diffusion learning step: the compact network trains without blocking the page; the shared misconception block now wraps emphasis and links as normal inline text.
- Quality review: `quality-review.html` was checked at 1440 px and 390 px; no document-level horizontal overflow, with explicit horizontal-scroll guidance for dense tables.
- Math toolbox: all five numerical steps were checked at desktop and mobile widths; analytical/fixed-difference gradients and `CE = H + KL` agree with independent Node reference checks. Keyboard step selection, zero mobile overflow, and the non-animated reduced-motion path also passed.

Browser tests replace Google Fonts CSS with an empty response so CI exercises the declared local fallback fonts and does not depend on third-party font availability.

## Deliberately not claimed

- GPT-2 reference logits and real-weight generation were not verified because the 548 MB weight file is not stored in the repository.
- This pass does not constitute a full WCAG audit or convergence testing over every dataset/seed combination.
