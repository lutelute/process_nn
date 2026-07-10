// tools/crawl-one.mjs — 1 ページ版の実行時検証（ローカル用）。
// 使い方: python3 -m http.server 8000 を立てた上で
//   node tools/crawl-one.mjs viz/bandit.html [port]
// ページを実ブラウザで開き、全スライドを「次へ ▶」で通しクリックしながら
// console error / pageerror / requestfailed を検出する。教材 1 本の開発ループ用
// （全ページ一括は tools/crawl-pages.mjs）。
import { chromium } from 'playwright';

const page = process.argv[2];
const port = process.argv[3] || '8000';
if (!page) { console.error('usage: node tools/crawl-one.mjs viz/<slug>.html [port]'); process.exit(2); }

const browser = await chromium.launch();
const pg = await (await browser.newContext()).newPage();
const errs = [];
pg.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
pg.on('pageerror', e => errs.push('pageerror: ' + e.message));
pg.on('requestfailed', r => errs.push('reqfail: ' + r.url() + ' ' + (r.failure()?.errorText || '')));

await pg.goto(`http://localhost:${port}/${page}`, { waitUntil: 'networkidle', timeout: 15000 })
  .catch(e => errs.push('nav: ' + e.message.split('\n')[0]));
await pg.waitForTimeout(1500);                    // 初期描画・自動学習開始後のエラーも拾う

for (let i = 0; i < 22; i++) {                    // 全スライド通し（15 枚＋余裕）
  const btn = await pg.$('#nextBtn');
  if (!btn) break;
  const disabled = await btn.isDisabled().catch(() => true);
  if (disabled) break;
  await btn.click().catch(() => {});
  await pg.waitForTimeout(250);                   // 各 draw() を実行させる
}
await pg.waitForTimeout(800);

if (errs.length) { console.log('NG ' + page); errs.slice(0, 8).forEach(e => console.log('  ' + e.slice(0, 200))); }
else console.log('OK ' + page + ' — console/pageerror 0 件（全スライド通し）');
await browser.close();
process.exit(errs.length ? 1 : 0);
