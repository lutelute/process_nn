// tools/crawl-pages.mjs — 全ページを実ブラウザで開き、実行時の異常を検出する（ローカル用）。
//
// console error / pageerror（未捕捉例外）/ requestfailed を全ページで収集する。
// CI とリリース前・大きな変更後のローカル確認で使う。
//
// 使い方:
//   python3 -m http.server 8000   # リポジトリ直下で
//   npm ci
//   npx playwright install chromium          # 初回のみ
//   npm run test:browser -- [port]            # 既定 8000
import { readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';

const { chromium } = await import('playwright').catch(() => {
  console.error('playwright が見つかりません。`npm ci` を実行してください。');
  process.exit(2);
});

const root = resolve(dirname(new URL(import.meta.url).pathname), '..');
const base = 'http://localhost:' + (process.argv[2] || '8000');
const pages = ['/index.html', '/gpt2/index.html',
  ...readdirSync(join(root, 'viz')).filter(f => f.endsWith('.html')).map(f => '/viz/' + f)];

const browser = await chromium.launch();
const ctx = await browser.newContext();
let bad = 0;
for (const p of pages) {
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  pg.on('pageerror', e => errs.push('pageerror: ' + e.message));
  pg.on('requestfailed', r => errs.push('reqfail: ' + r.url() + ' ' + (r.failure()?.errorText || '')));
  try {
    await pg.goto(base + p, { waitUntil: 'networkidle', timeout: 15000 });
    await pg.waitForTimeout(1200);           // 初期アニメ・自動学習開始後のエラーも拾う
  } catch (e) { errs.push('nav: ' + e.message.split('\n')[0]); }
  if (errs.length) { bad++; console.log('NG ' + p); errs.slice(0, 4).forEach(e => console.log('   ' + e.slice(0, 180))); }
  await pg.close();
}
console.log(bad ? `\n✗ ${bad}/${pages.length} ページで実行時エラー` : `\n✓ 全 ${pages.length} ページ 実行時エラーなし`);
await browser.close();
process.exit(bad ? 1 : 0);
