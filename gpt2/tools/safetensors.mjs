// 最小 safetensors ローダー（F32/F16）。Node 用。
// フォーマット: [u64 LE header長][JSON header][生バイナリ]
import fs from 'node:fs';

export function openSafetensors(path) {
  const fd = fs.openSync(path, 'r');
  const head = Buffer.alloc(8);
  fs.readSync(fd, head, 0, 8, 0);
  const n = Number(head.readBigUInt64LE(0));
  const jbuf = Buffer.alloc(n);
  fs.readSync(fd, jbuf, 0, n, 8);
  const header = JSON.parse(jbuf.toString('utf8'));
  const base = 8 + n;
  const tensors = {};
  for (const [name, info] of Object.entries(header)) {
    if (name === '__metadata__') continue;
    const [s, e] = info.data_offsets;
    tensors[name] = { dtype: info.dtype, shape: info.shape, start: base + s, end: base + e };
  }
  return { fd, tensors, metadata: header.__metadata__ || null };
}

export function readTensorF32(fd, t) {
  const len = t.end - t.start;
  const buf = Buffer.alloc(len);
  fs.readSync(fd, buf, 0, len, t.start);
  if (t.dtype === 'F32') return new Float32Array(buf.buffer, buf.byteOffset, len / 4);
  if (t.dtype === 'F16') {
    const m = len / 2, out = new Float32Array(m);
    for (let i = 0; i < m; i++) out[i] = f16ToF32(buf.readUInt16LE(i * 2));
    return out;
  }
  throw new Error('unsupported dtype ' + t.dtype);
}
function f16ToF32(h) {
  const s = (h & 0x8000) >> 15, e = (h & 0x7c00) >> 10, f = h & 0x03ff;
  if (e === 0) return (s ? -1 : 1) * Math.pow(2, -14) * (f / 1024);
  if (e === 0x1f) return f ? NaN : (s ? -Infinity : Infinity);
  return (s ? -1 : 1) * Math.pow(2, e - 15) * (1 + f / 1024);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const path = new URL('../assets/model.safetensors', import.meta.url).pathname;
  const { fd, tensors } = openSafetensors(path);
  const names = Object.keys(tensors);
  console.log('テンソル数:', names.length);
  for (const n of ['wte.weight', 'wpe.weight', 'h.0.attn.c_attn.weight', 'h.0.mlp.c_proj.weight', 'ln_f.weight'])
    if (tensors[n]) console.log(' ', n, tensors[n].dtype, '[' + tensors[n].shape + ']');
  let maxL = -1; for (const n of names) { const m = n.match(/^h\.(\d+)\./); if (m) maxL = Math.max(maxL, +m[1]); }
  console.log('層数:', maxL + 1, ' lm_head有無:', !!tensors['lm_head.weight']);
  fs.closeSync(fd);
}
