// 全教材の「次へ」を reduced-motion 環境で進め、同期処理によるUI停止と実行時エラーを検出する。
// 重い学習を非同期チャンクで続けて aria-busy になるページは、イベントループが応答した時点で合格とする。
import { readdirSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';

const { chromium } = await import('playwright').catch(() => {
  console.error('playwright が見つかりません。`npm ci` を実行してください。');
  process.exit(2);
});

const root = resolve(dirname(new URL(import.meta.url).pathname), '..');
const base = 'http://localhost:' + (process.argv[2] || '8000');
const pages = ['/index.html', '/gpt2/index.html',
  ...readdirSync(join(root, 'viz')).filter(f => f.endsWith('.html')).map(f => '/viz/' + f)];

const browser = await chromium.launch();
const context = await browser.newContext({ reducedMotion: 'reduce' });
let failed = 0, deferred = 0, clicks = 0;

for (const path of pages) {
  const page = await context.newPage();
  const errors = [];
  page.on('console', message => { if (message.type() === 'error') errors.push('console: ' + message.text()); });
  page.on('pageerror', error => errors.push('pageerror: ' + error.message));
  page.on('requestfailed', request => errors.push('reqfail: ' + request.url()));

  try {
    await page.goto(base + path, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(100);
    const next = page.locator('#nextBtn');
    if (await next.count()) {
      for (let step = 0; step < 24; step++) {
        if (await next.isDisabled().catch(() => true)) {
          if (await page.locator('#stepper[aria-busy="true"]').count()) deferred++;
          break;
        }
        await next.click({ timeout: 2500 });
        clicks++;
        await page.waitForTimeout(60);
      }
    }
  } catch (error) {
    errors.push('interaction: ' + error.message.split('\n')[0]);
  }

  if (errors.length) {
    failed++;
    console.log('NG ' + path);
    errors.slice(0, 5).forEach(error => console.log('   ' + error.slice(0, 220)));
  }
  await page.close();
}

console.log(failed
  ? `\n✗ ${failed}/${pages.length} ページで操作エラー（${clicks} clicks）`
  : `\n✓ 全 ${pages.length} ページの操作が応答（${clicks} clicks、重い非同期処理 ${deferred} ページは busy 状態まで確認）`);
await browser.close();
process.exit(failed ? 1 : 0);
