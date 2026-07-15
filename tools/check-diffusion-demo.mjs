// 固定シードの拡散デモを最後まで動かし、待ち時間・学習・生成結果を確認する。
import { chromium } from 'playwright';

const base = 'http://localhost:' + (process.argv[2] || '8000');
const browser = await chromium.launch();
const context = await browser.newContext();
await context.route('https://fonts.googleapis.com/**', route => route.fulfill({ status: 200, contentType: 'text/css', body: '' }));
const page = await context.newPage();
const errors = [];
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
page.on('pageerror', error => errors.push(error.message));

const started = performance.now();
try {
  await page.goto(base + '/viz/diffusion.html', { waitUntil: 'domcontentloaded', timeout: 15000 });
  // 前進アニメーションのフレーム数で乱数列がずれないよう、学習スライドへ直接移動する。
  await page.locator('.stp[data-i="2"]').click();
  await page.waitForFunction(() => {
    const match = document.querySelector('#mini')?.textContent.match(/学習\s*(\d+)\s*\/\s*(\d+)/);
    return match && Number(match[1]) >= Number(match[2]);
  }, null, { timeout: 60000 });

  const trainedText = (await page.locator('#mini').innerText()).replace(/\n/g, ' ');
  const loss = Number(trainedText.match(/損失\s*([0-9.]+)/)?.[1]);
  await page.locator('.stp[data-i="4"]').click();
  const resultText = (await page.locator('#mini').innerText()).replace(/\n/g, ' ');
  const coverage = resultText.match(/分布カバー\s*(\d+)\s*\/\s*(\d+)/)?.slice(1).map(Number);
  const seconds = (performance.now() - started) / 1000;

  console.log(`  学習完走 ${seconds.toFixed(1)} 秒 / 最終損失 ${loss.toFixed(3)} / ${resultText}`);
  if (errors.length) throw new Error('ブラウザエラー: ' + errors.join(' | '));
  if (!Number.isFinite(loss) || loss >= 1.2) throw new Error('損失が期待範囲まで下がっていません');
  if (!coverage || coverage[0] < Math.max(1, coverage[1] - 1)) throw new Error('生成分布のカバー率が不足しています');
  console.log('✓ 拡散デモの完走・学習・生成品質を確認');
} finally {
  await browser.close();
}
