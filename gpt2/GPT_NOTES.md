# GPT 技術ノート（実装リファレンス）

GPT-2 をブラウザで再実装し「生成過程」と「内部（attention・残差・活性化）」を可視化するための知識集。

> **凡例**
> - ✓**実測**: 本セッションで実際に重み/configをDLし、コードを走らせて確認した事項（信頼度高）。
> - （無印）: 一般知識（訓練由来）。確立された値だが、最終的には本家で裏取り推奨。

---

## 1. 本質
- **decoder-only Transformer** による**自己回帰言語モデル**。条件付き確率 `p(x_t | x_<t)` を学習し、繰り返してテキスト生成。
- オリジナルTransformer（2017, Vaswani et al.）の**デコーダ側のみ**を使う（encoder無し / cross-attention無し / causal self-attention のみ）。
- 事前学習（大量テキストで次トークン予測）→ 下流タスクへ転移、が基本思想。

## 2. 系譜（OpenAI）
| モデル | 年 | パラメータ | 層数 | 次元 | 特徴 |
|---|---|---|---|---|---|
| GPT-1 | 2018 | 117M | 12 | 768 | 事前学習+ファインチューン |
| GPT-2 | 2019 | 124M–1.5B | 12–48 | 768–1600 | zero-shot、WebText(40GB) |
| GPT-3 | 2020 | 175B | 96 | 12288 | few-shot / in-context学習 |
| InstructGPT/3.5 | 2022 | — | — | — | RLHF で指示追従 |
| GPT-4 | 2023 | 非公開 | — | — | マルチモーダル、詳細非公開 |

**GPT-2 の4サイズ**: small=124M / medium=355M(24層,1024次元) / large=774M(36層,1280次元) / xl=1558M(48層,1600次元)。

## 3. アーキテクチャ（GPT-2）✓実測で構造確定

```
tokens → [wte 埋め込み] + [wpe 位置埋め込み]
       → TransformerBlock × N
       → ln_f（最終LayerNorm）
       → lm_head = wteᵀ（重み共有）→ logits[語彙]
```

**TransformerBlock は Pre-LayerNorm 構成**（GPT-2の特徴。原Transformerは Post-LN）:
```
x = x + Attn( ln_1(x) )
x = x + MLP(  ln_2(x) )
```

**Causal Self-Attention（多頭）**:
- `c_attn` で Q,K,V を一括生成（768 → 2304 = 3×768）→ ヘッドに分割
- ✓実測: head数=12, head_dim = 768/12 = 64
- `Attn(Q,K,V) = softmax( QKᵀ/√d_k + M ) V`、`M` は因果マスク（未来 = -∞、下三角のみ有効）
- `c_proj` で出力射影（768 → 768）

**MLP（FFN）**:
- `c_fc`（768 → 3072 = 4×768）→ **gelu_new** → `c_proj`（3072 → 768）
- gelu_new（tanh近似GELU）: `0.5·x·(1 + tanh[ √(2/π)·(x + 0.044715·x³) ])`

**GPT-2 特有の実装ディテール** ✓実測:
- 線形層が `nn.Linear` ではなく **Conv1D**。重み形状は **`[in, out]`**（Linearの`[out,in]`と転置）→ forward は転置不要で `y = x @ W + b`
- **位置埋め込みは学習可能な絶対位置**（`wpe [1024,768]`）。RoPE/ALiBiではない。**最大文脈1024**
- LayerNorm の **ε = 1e-5**
- **lm_head と wte は重み共有**（tied、`lm_head.weight` は保存されない）

## 4. GPT-2 small の諸元 ✓全て実測
- 12層 / 12ヘッド / 768次元 / head_dim 64
- 語彙 **50257** / 文脈長 **1024** / 活性化 gelu_new / LN ε=1e-5
- 重み: **149テンソル, 全F32, safetensors 548MB**（fp16で半分、int8量子化で ~125MB）
- テンソル命名（`{i}` = 0..11）:
  ```
  wte.weight [50257,768]      wpe.weight [1024,768]
  h.{i}.ln_1.{weight,bias} [768]
  h.{i}.attn.c_attn.{weight[768,2304], bias[2304]}
  h.{i}.attn.c_proj.{weight[768,768],  bias[768]}
  h.{i}.ln_2.{weight,bias} [768]
  h.{i}.mlp.c_fc.{weight[768,3072],  bias[3072]}
  h.{i}.mlp.c_proj.{weight[3072,768], bias[768]}
  ln_f.{weight,bias} [768]
  ```

## 5. トークナイザ（byte-level BPE）✓検証済み
- **語彙50257** = 50000 BPEマージ + 256バイト + 1特殊トークン
- `<|endoftext|>` = **50256**（BOS/EOS/区切り兼用）
- **byte-level**: 全UTF-8バイトを256文字にマップ（`bytes_to_unicode`）→ **未知語が原理的に存在しない**（日本語・絵文字も可、✓実測）
- 手順: テキスト →(GPT-2正規表現で事前分割)→ 各片をバイト列 →(unicode化)→ BPEマージ →(vocabでID化)
- 資産: `vocab.json`(token→id, ~1MB), `merges.txt`(マージ規則, ~456KB)
- ✓検証: `"Hello world"` → `[15496, 995]`、`decode(encode(x))===x` 全成功
- 実装: `gpt2/tools/tokenizer.mjs`

## 6. forward 計算（1パスの全体）
```
h = wte[tokens] + wpe[0..T-1]              # [T,768]
for each block:
    a = ln_1(h)
    Q,K,V = split(a @ Wc_attn + bc_attn)   # 各 [T,12,64]
    for each head: A = softmax(QKᵀ/8 + causal); o = A·V   # √64 = 8
    h = h + (concat(o) @ Wc_proj + bc_proj)
    m = ln_2(h)
    h = h + (gelu(m @ Wc_fc + b) @ Wc_proj + b)
logits = ln_f(h[-1]) @ wteᵀ                # [50257]
```

## 7. 生成（自己回帰）とサンプリング
- ループ: `logits → 確率 → 1トークン選択 → 系列に追加 → 再forward`
- **temperature** `T`: `logits/T`。T<1 で尖鋭化（決定的）、T>1 で多様化
- **top-k**: 上位k個のみ残す / **top-p (nucleus)**: 累積確率pまで残す
- **greedy**(argmax) / **beam search**
- **KVキャッシュ**: 過去の K,V を保存し毎ステップの再計算を回避（生成高速化の要）

## 8. 可視化に使える内部表現（本プロジェクトの目的）
- **Attention行列**: 各層×各ヘッドの `softmax(QKᵀ/√d)` = `[T,T]`、因果マスクで下三角。「どのトークンがどこを見るか」← 最も教育的
- **残差ストリーム**: ブロックを貫く `h [T,768]` の推移
- **活性化**: MLP中間(3072次元)、attention出力など
- **logit lens**: 中間層の `h` に `ln_f`+`lm_head` を適用し「途中の予測」を覗く
- **次トークン確率**: 最終 `softmax(logits)`

## 9. ブラウザ実装の勘所
- **`transformers.js` は logits しか出さず attention/活性化を取り出せない** → 内部可視化には**重みロード＋forward自前実装**が必須（既存 `index.html` の MLP 自前forward と同じ思想）
- safetensors形式: `[u64 LE ヘッダ長][JSON ヘッダ][生バイナリ]`、`data_offsets` でテンソル位置。ローダー: `gpt2/tools/safetensors.mjs`
- naive JS は遅い → **WebGPU** 推奨。教育用「1トークンずつ観察」なら遅くても可
- ⚠️ **`transformers`(Python) は Python 3.14 では現状 pip 不可**（本セッションで確認）。基準照合する環境は Python 3.11〜3.12 推奨。なお `safetensors`(Python) と `torch` は 3.14 でも入る

---

## 10. 本リポジトリでの現在地

- `gpt2/tools/tokenizer.mjs` — byte-level BPE 自前実装。既知値と往復一致の自動テストあり。
- `gpt2/tools/safetensors.mjs` — F32/F16 safetensors ローダー。
- `gpt2/tools/gpt2.mjs` — GPT-2 small の素の JavaScript forward、生成、attention / 残差 / MLP / logit lens capture を実装済み。
- `gpt2/index.html` — ローカル重みまたは HuggingFace 取得からブラウザ内 forward を実行。
- `gpt2/assets/` — config.json / vocab.json / merges.txt。重み本体は `.gitignore` で除外。

### 検証済みと未検証の境界

- **自動検証済み**: tokenizer の既知値 `encode("Hello world") = [15496, 995]` と UTF-8 往復。
- **リポジトリ内で未整備**: 参照実装と比較する層別テンソル / logits の数値許容差テスト、本物重みを使う生成 smoke test、ブラウザ別の速度・最大メモリ。
- **性能上の制約**: WebGPU と KV cache がなく、生成ごとに全文脈を再計算する。全層 attention の capture は O(LHT²) メモリなので、教育用 UI は合計 64 トークンで停止する。

次に必要なのは、新機能よりも固定 prompt の参照 logits と中間 checksum を保存し、Python / PyTorch 参照実装との誤差を自動判定すること。その後に KV cache または高速バックエンドを検討する。
