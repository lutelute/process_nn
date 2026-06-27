# process_nn — ニューラルネットの「過程」と「内部構造」を観る

ニューラルネットが動く様子を、フレームワークに頼らず**素の JavaScript で実装して可視化**する教育用プロジェクト。学習の過程も、推論（生成）の内部構造も、ブラウザで 1 ステップずつ覗けます。

## 🔗 Live Demo

入口は **https://lutelute.github.io/process_nn/** （「学習の地図」ハブ）。各ビューア:

| ページ | 内容 | 種類 |
|---|---|---|
| `/` | 学習の地図ハブ＋ MLP 関数近似の学習過程 | 回帰 |
| `/viz/` | 信号の流れ（入力が層を流れ活性値で光り変換される） | 順伝播 |
| `/viz/classify.html` | 決定境界が学習で形成される | 教師あり・分類 |
| `/viz/cnn.html` | フィルタが画像を走査し特徴マップへ変換 | 畳み込み |
| `/viz/rnn.html` | 時系列を 1 ステップ先予測、隠れ状態の発展 | 系列・記憶 |
| `/viz/transformer.html` | 小型 GPT を学習、attention・生成が変化 | 言語モデル |
| `/viz/gradient.html` | 損失地形を SGD/Momentum/Adam が降下 | 最適化 |
| `/viz/kmeans.html` | ラベル無しで重心が収束しクラスタ形成 | 教師なし |
| `/gpt2/` | 本物の GPT-2 (124M) の生成過程と内部構造 | 言語モデル |

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

### ③ `viz/` — 学習・推論ビューア集（素の JS、外部依存ゼロ）

機械学習の代表的な手法を、それぞれ 1 ステップずつ動かして観察できる単体 HTML 群。トップの「学習の地図」から辿れる。

- `viz/index.html` — **信号の流れ**: 入力が層を流れ、各ニューロンが活性値で点灯、結線を信号パルス（色＝寄与 w·a の符号、太さ＝大きさ）が伝播（順伝播・MLP）
- `viz/classify.html` — **決定境界**: 2D 点群を 2 クラスに分ける MLP の境界が学習で形成（softmax + 交差エントロピー + Adam、データ 5 種）
- `viz/cnn.html` — **CNN**: 入力画像をフィルタが走査して特徴マップへ（conv→ReLU→maxpool、入力は描画可、フィルタ 7 種）
- `viz/rnn.html` — **RNN**: Elman RNN + BPTT で時系列を学習、1 ステップ予測・自由走行・隠れ状態の時間発展
- `viz/transformer.html` — **Transformer 学習**: 小型 decoder-only を学習し、loss 低下に伴い attention・logit lens・生成が変化（学習エンジン `gpt2/tools/minigpt.mjs` を接続）
- `viz/gradient.html` — **勾配降下**: 損失地形（ボウル/Rosenbrock/鞍点/Himmelblau）を SGD/Momentum/Adam が降下し比較
- `viz/kmeans.html` — **k-means**: 教師なしクラスタリング、割当→重心移動で収束（Voronoi 背景・慣性推移）

各ビューアの数値ロジックは Node で検証（loss/精度/収束）し、全ページの実描画を Playwright（ヘッドレス）で確認している。

---

## ローカルで開く

`index.html` / `gpt2/index.html` は静的ファイルですが、ES Modules と fetch を使うため、ファイル直開きではなくローカルサーバ経由で開いてください。

```bash
git clone https://github.com/lutelute/process_nn.git
cd process_nn
python3 -m http.server 8000
# → http://localhost:8000/         (学習の地図ハブ + 関数近似)
# → http://localhost:8000/viz/     (各種ビューア: 信号フロー/分類/CNN/RNN/Transformer/勾配降下/k-means)
# → http://localhost:8000/gpt2/    (GPT-2 ビューア)
```

トップの `index.html` のみ外部依存ゼロの単体 HTML なので、直接ブラウザで開いても動きます。
