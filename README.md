# process_nn — ニューラルネットの「過程」と「内部構造」を観る

ニューラルネットが動く様子を、フレームワークに頼らず**素の JavaScript で実装して可視化**する教育用プロジェクト。学習の過程も、推論（生成）の内部構造も、ブラウザで 1 ステップずつ覗けます。

## 🔗 Live Demo

| ページ | 内容 |
|---|---|
| **https://lutelute.github.io/process_nn/** | MLP の関数近似が学習で当てはまっていく過程 |
| **https://lutelute.github.io/process_nn/viz/** | 信号が構造を流れて変換される順伝播アニメ（MLP・1 ステップずつ） |
| **https://lutelute.github.io/process_nn/gpt2/** | 本物の GPT-2 の生成過程と内部構造（attention・logit lens 等） |

ビルド・インストール不要、ブラウザで開くだけ。

---

## 構成

### ① `index.html` — MLP 関数近似の学習可視化（Pages トップ）

1 次元の関数近似を題材に、多層パーセプトロンが教師データへ近づく様子をリアルタイム描画する単体 HTML（外部依存ゼロ）。

- 3 パネル同時表示: 関数近似（真の関数・教師データ・予測）／ネットワーク図（重みを正負で色分け）／損失の対数推移
- 順伝播・誤差逆伝播・Adam / SGD を JavaScript で実装。入力 x を [-1,1]、教師 y を標準化、全バッチ勾配降下、出力層は線形
- 活性化（tanh・ReLU・sigmoid）／最適化（Adam・SGD）／学習率・層数・ユニット数・ノイズ・速度を対話的に変更
- ▶再生 / ⏭1 ステップ / ⏩50 ステップ / ↺リセット

### ② `gpt2/` — GPT-2 の生成過程と内部構造ビューア

本物の **GPT-2 small（124M）をブラウザで forward 実行**し、生成（自己回帰）を 1 トークンずつ進めながら内部を可視化する。`transformers.js` は logits しか返さず内部を取り出せないため、トークナイザと forward を自前実装している。

- `gpt2/index.html` — 可視化ビューア本体
  - **トークナイザ実演**（重み不要・即動作）: byte-level BPE でトークン分割・ID 化
  - **生成過程＋内部構造**（要・重み読み込み）: 次トークン確率（top-k）・**attention 行列**（層×ヘッド）・**logit lens**（層ごとの途中予測）・残差ストリームのノルム推移
- `gpt2/tools/tokenizer.mjs` — GPT-2 byte-level BPE（Node/ブラウザ共通、I/O なし）
- `gpt2/tools/gpt2.mjs` — safetensors パーサ＋ forward エンジン（中間表現キャプチャ対応、Node/ブラウザ共通）
- `gpt2/tools/safetensors.mjs` — Node 用 safetensors ローダー
- `gpt2/GPT_NOTES.md` — 実装リファレンス（構造・トークナイザ・forward・サンプリング）
- `gpt2/assets/` — `config.json` / `vocab.json` / `merges.txt`

> **重み本体 `model.safetensors`（約 523MB）はリポジトリに含めていません**（`.gitignore` で除外）。ビューアでは「ローカルファイルを選択」か「HuggingFace から取得」で読み込みます。CLI で取得する場合:
> ```bash
> curl -L -o gpt2/assets/model.safetensors \
>   https://huggingface.co/gpt2/resolve/main/model.safetensors
> ```

#### 正しさの検証

- **トークナイザ**: Node で `encode("Hello world") = [15496, 995]`（GPT-2 既知値）と、英語・日本語・絵文字・コード・特殊トークンの往復一致を確認済み
- **forward**: コンポーネント単体テスト＋本物の重みでの生成健全性で確認（PyTorch との厳密な数値照合は今後）

### ③ `viz/` — 信号フロー（順伝播）ビューア

入力ベクトルがネットワーク構造の上を流れ、各ニューロンが活性値で点灯し、結線を信号パルス（色＝寄与の符号 w·a、太さ＝その大きさ）が伝播して変換される様子をアニメーション表示。まず MLP で実装。CNN・Transformer へ同じ「信号の流れ」基盤を広げるための土台。

- 入力 x をスライダーで変更 → 出力がどう変わるかを観察
- ▶信号を流す / ⏭1 層ずつ / ↺リセット / 🎲重み再生成、活性化・層数・幅を対話変更

---

## ローカルで開く

`index.html` / `gpt2/index.html` は静的ファイルですが、ES Modules と fetch を使うため、ファイル直開きではなくローカルサーバ経由で開いてください。

```bash
git clone https://github.com/lutelute/process_nn.git
cd process_nn
python3 -m http.server 8000
# → http://localhost:8000/         (学習過程)
# → http://localhost:8000/gpt2/    (GPT-2 ビューア)
```

トップの `index.html` のみ外部依存ゼロの単体 HTML なので、直接ブラウザで開いても動きます。
