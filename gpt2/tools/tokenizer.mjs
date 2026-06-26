// GPT-2 byte-level BPE トークナイザ（環境非依存・I/O なし）
//
// Node / ブラウザ共通。vocab.json と merges.txt の「中身（文字列）」を渡して構築する。
// ファイル/ネットワークの読み込みは呼び出し側の責務（Node は fs、ブラウザは fetch）。
//
//   import { GPT2Tokenizer } from './tokenizer.mjs'
//   const tok = new GPT2Tokenizer(vocabJsonText, mergesTxtText)
//   tok.encode('Hello world')   // → [15496, 995]
//   tok.decode([15496, 995])    // → 'Hello world'
//
// 参照: gpt2/GPT_NOTES.md §5（byte-level BPE）

const ENDOFTEXT = '<|endoftext|>';
const ENDOFTEXT_ID = 50256;

// GPT-2 の事前分割正規表現（縮約形・語・数字・記号・空白）。\p{L}/\p{N} のため u フラグ。
const PAT =
  /'s|'t|'re|'ve|'m|'ll|'d| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+/gu;

// 0..255 の各バイトを「印字可能な Unicode 1 文字」に可逆対応させる（bytes_to_unicode）。
// 制御文字・空白などを見える文字に退避させることで、BPE を純粋な文字列処理にできる。
function bytesToUnicode() {
  const bs = [];
  const add = (from, to) => { for (let i = from; i <= to; i++) bs.push(i); };
  add('!'.charCodeAt(0), '~'.charCodeAt(0));   // 0x21..0x7E
  add('¡'.charCodeAt(0), '¬'.charCodeAt(0));   // 0xA1..0xAC
  add('®'.charCodeAt(0), 'ÿ'.charCodeAt(0));   // 0xAE..0xFF
  const cs = bs.slice();
  let n = 0;
  for (let b = 0; b < 256; b++) {
    if (!bs.includes(b)) { bs.push(b); cs.push(256 + n); n++; }
  }
  const byteEncoder = new Map();  // byte(0..255) → char
  const byteDecoder = new Map();  // char → byte
  for (let i = 0; i < bs.length; i++) {
    const ch = String.fromCharCode(cs[i]);
    byteEncoder.set(bs[i], ch);
    byteDecoder.set(ch, bs[i]);
  }
  return { byteEncoder, byteDecoder };
}

// 文字配列の隣接ペアを列挙（重複可・順序保持）。
function getPairs(word) {
  const pairs = [];
  for (let i = 0; i < word.length - 1; i++) pairs.push([word[i], word[i + 1]]);
  return pairs;
}

export class GPT2Tokenizer {
  constructor(vocabJsonText, mergesTxtText) {
    const vocab = JSON.parse(vocabJsonText);
    this.encoder = new Map(Object.entries(vocab));      // token文字列 → id
    this.decoder = new Map();                            // id → token文字列
    for (const [tok, id] of this.encoder) this.decoder.set(id, tok);

    // merges.txt: 先頭の "#version" 行を除き、各行 "tokA tokB" を rank 付きで登録。
    const lines = mergesTxtText.split('\n');
    const start = lines[0].startsWith('#') ? 1 : 0;
    this.bpeRanks = new Map();
    let rank = 0;
    for (let i = start; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const sp = line.split(/\s+/);
      if (sp.length !== 2) continue;
      this.bpeRanks.set(sp[0] + ' ' + sp[1], rank++);
    }

    const { byteEncoder, byteDecoder } = bytesToUnicode();
    this.byteEncoder = byteEncoder;
    this.byteDecoder = byteDecoder;
    this.utf8Encoder = new TextEncoder();
    this.utf8Decoder = new TextDecoder('utf-8');
    this.cache = new Map();
  }

  // 1 つの「Unicode 退避済み文字列」に貪欲 BPE を適用し、空白区切りのサブワード列を返す。
  bpe(token) {
    if (this.cache.has(token)) return this.cache.get(token);
    let word = Array.from(token);
    let pairs = getPairs(word);
    if (pairs.length === 0) return token;

    while (true) {
      // 最小 rank のペア（=最優先のマージ）を選ぶ。
      let bigram = null, minRank = Infinity;
      for (const [a, b] of pairs) {
        const r = this.bpeRanks.get(a + ' ' + b);
        if (r !== undefined && r < minRank) { minRank = r; bigram = [a, b]; }
      }
      if (!bigram) break;
      const [first, second] = bigram;
      const newWord = [];
      let i = 0;
      while (i < word.length) {
        const j = word.indexOf(first, i);
        if (j === -1) { for (let k = i; k < word.length; k++) newWord.push(word[k]); break; }
        for (let k = i; k < j; k++) newWord.push(word[k]);
        if (j < word.length - 1 && word[j + 1] === second) { newWord.push(first + second); i = j + 2; }
        else { newWord.push(word[j]); i = j + 1; }
      }
      word = newWord;
      if (word.length === 1) break;
      pairs = getPairs(word);
    }
    const out = word.join(' ');
    this.cache.set(token, out);
    return out;
  }

  // テキスト → トークン id 配列。<|endoftext|> はそのまま 50256 にする。
  encode(text) {
    const ids = [];
    for (const segment of text.split(ENDOFTEXT)) {
      this._encodeOrdinary(segment, ids);
      ids.push(ENDOFTEXT_ID);            // セグメント境界＝区切りトークン
    }
    ids.pop();                            // 末尾の余分な区切りを除去
    return ids;
  }

  _encodeOrdinary(text, ids) {
    const matches = text.match(PAT);
    if (!matches) return;
    for (const piece of matches) {
      const bytes = this.utf8Encoder.encode(piece);
      let mapped = '';
      for (const b of bytes) mapped += this.byteEncoder.get(b);
      for (const sub of this.bpe(mapped).split(' ')) {
        const id = this.encoder.get(sub);
        if (id !== undefined) ids.push(id);
      }
    }
  }

  // 詳細表示用: 各サブワードの { id, token(表示用), bytes(元テキスト断片) } を返す。
  encodeDetailed(text) {
    const out = [];
    for (const segment of splitKeep(text, ENDOFTEXT)) {
      if (segment === ENDOFTEXT) { out.push({ id: ENDOFTEXT_ID, token: ENDOFTEXT, text: ENDOFTEXT, special: true }); continue; }
      const matches = segment.match(PAT);
      if (!matches) continue;
      for (const piece of matches) {
        const bytes = this.utf8Encoder.encode(piece);
        let mapped = '';
        for (const b of bytes) mapped += this.byteEncoder.get(b);
        for (const sub of this.bpe(mapped).split(' ')) {
          const id = this.encoder.get(sub);
          if (id === undefined) continue;
          out.push({ id, token: sub, text: this._tokenToText(sub), special: false });
        }
      }
    }
    return out;
  }

  // id 配列 → テキスト。特殊トークンは区切って復元する。
  decode(ids) {
    let text = '';
    let buf = '';
    const flush = () => {
      if (!buf) return;
      const bytes = new Uint8Array(Array.from(buf).map((ch) => this.byteDecoder.get(ch) ?? 0));
      text += this.utf8Decoder.decode(bytes);
      buf = '';
    };
    for (const id of ids) {
      if (id === ENDOFTEXT_ID) { flush(); text += ENDOFTEXT; continue; }
      buf += this.decoder.get(id) ?? '';
    }
    flush();
    return text;
  }

  // 単一トークン（Unicode退避済み）を元の文字列に戻す（表示用、不完全バイト列は � になりうる）。
  _tokenToText(token) {
    const bytes = new Uint8Array(Array.from(token).map((ch) => this.byteDecoder.get(ch) ?? 0));
    return this.utf8Decoder.decode(bytes);
  }
}

// セパレータを残しつつ分割（["a", sep, "b", ...]）。
function splitKeep(text, sep) {
  const out = [];
  let i = 0;
  while (true) {
    const j = text.indexOf(sep, i);
    if (j === -1) { out.push(text.slice(i)); break; }
    out.push(text.slice(i, j));
    out.push(sep);
    i = j + sep.length;
  }
  return out;
}
