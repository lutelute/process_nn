// tools/check-pages.mjs — 全ページの静的健全性チェック。`node tools/check-pages.mjs` で実行（CI でも走る）。
//
// 対象: index.html / viz/*.html / gpt2/index.html（全 75 ページ）
//   ① リンク切れ — href / src が指すローカルファイルが実在するか
//   ② インライン <script> の JS 構文 — node --check で構文エラーを検出
//      （<script type="module"> は module として、HTML コメント内の偽 <script> は除去して判定）
// 依存パッケージなし・Node 標準のみ。実ブラウザでの実行時エラー確認は tools/crawl-pages.mjs（ローカル用）。
import { readFileSync, readdirSync, existsSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const root = resolve(dirname(new URL(import.meta.url).pathname), '..');
const pages = [
  'index.html',
  'gpt2/index.html',
  ...readdirSync(join(root, 'viz')).filter(f => f.endsWith('.html')).map(f => 'viz/' + f),
];

let fails = 0;
const fail = msg => { console.log('  FAIL ' + msg); fails++; };

// ① リンク切れ（href / src のローカル参照が実在するか）
for (const page of pages) {
  const html = readFileSync(join(root, page), 'utf8');
  const dir = dirname(join(root, page));
  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const url = m[1];
    if (/^(https?:|#|data:|mailto:|javascript:)/.test(url)) continue;
    const clean = url.split(/[?#]/)[0];
    if (clean === '' || clean.endsWith('/')) {           // ディレクトリ参照は index.html を確認
      if (!existsSync(join(dir, clean, 'index.html'))) fail(`${page} → ${url} (ディレクトリに index.html なし)`);
      continue;
    }
    if (!existsSync(join(dir, clean))) fail(`${page} → ${url} (ファイルなし)`);
  }
}
console.log(`  ok   リンク整合性 — ${pages.length} ページ走査`);

// ② インライン <script> の構文（HTML コメントを除去してから抽出）
const tmp = mkdtempSync(join(tmpdir(), 'check-pages-'));
let scriptCount = 0;
for (const page of pages) {
  const html = readFileSync(join(root, page), 'utf8').replace(/<!--[\s\S]*?-->/g, '');
  const re = /<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g;
  let m, i = 0;
  while ((m = re.exec(html))) {
    const isModule = /type=["']module["']/.test(m[1]);
    const file = join(tmp, 'chk' + (isModule ? '.mjs' : '.js'));
    writeFileSync(file, m[2]);
    const r = spawnSync('node', ['--check', file], { encoding: 'utf8' });
    if (r.status !== 0) fail(`${page} script#${i} 構文エラー: ${r.stderr.trim().split('\n')[1] || r.stderr.trim().split('\n')[0]}`);
    i++; scriptCount++;
  }
}
rmSync(tmp, { recursive: true, force: true });
console.log(`  ok   JS 構文 — インライン script ${scriptCount} 本を node --check`);

console.log(fails ? `\n✗ ${fails} 件失敗` : `\n✓ 全 ${pages.length} ページ合格（リンク・構文）`);
process.exit(fails ? 1 : 0);
