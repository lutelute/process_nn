// tools/verify.mjs — 再現可能な最小検証。`node tools/verify.mjs` で実行（CI でも走る）。
//
// GPT-2 byte-level BPE トークナイザ（gpt2/tools/tokenizer.mjs）が
//   ① GPT-2 公式と一致する既知値を返すか
//   ② 任意テキストを無損失で往復（encode→decode）できるか
// を、リポジトリ同梱の vocab.json / merges.txt を使って実際に検証する。
// GPT-2 の重み（model.safetensors, 約523MB）は不要 — トークナイザのみで完結する。
import { GPT2Tokenizer } from '../gpt2/tools/tokenizer.mjs';
import { readFileSync } from 'node:fs';

const vocab = readFileSync(new URL('../gpt2/assets/vocab.json', import.meta.url), 'utf8');
const merges = readFileSync(new URL('../gpt2/assets/merges.txt', import.meta.url), 'utf8');
const tok = new GPT2Tokenizer(vocab, merges);

let fails = 0;
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function check(name, cond, got) {
  if (cond) { console.log('  ok   ' + name); }
  else { console.log('  FAIL ' + name + (got !== undefined ? '  → got ' + JSON.stringify(got) : '')); fails++; }
}

// ① 既知値（GPT-2 公式トークナイザと一致する外部正解）
check('encode("Hello world") = [15496, 995]', eq(tok.encode('Hello world'), [15496, 995]), tok.encode('Hello world'));
check('encode(" the") = [262]', eq(tok.encode(' the'), [262]), tok.encode(' the'));
check('encode("<|endoftext|>") = [50256]', eq(tok.encode('<|endoftext|>'), [50256]), tok.encode('<|endoftext|>'));

// ② 往復一致（byte-level なので日本語・絵文字・記号も無損失で戻る）
for (const s of ['Hello world', 'The opposite of hot is', ' oxygen', '日本語のテスト 123', '🤖 ✓ café']) {
  check('roundtrip ' + JSON.stringify(s), tok.decode(tok.encode(s)) === s, tok.decode(tok.encode(s)));
}

console.log(fails ? `\n✗ ${fails} 件失敗` : '\n✓ すべて合格');
process.exit(fails ? 1 : 0);
