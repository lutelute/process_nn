# process_nn — 機械学習の「学習過程」と「内部構造」を観る

機械学習が学ぶ様子を、フレームワークに頼らず**素の JavaScript で実装して可視化**する教育用プロジェクト。
**学習の過程＝構造の可視化**と**リアルタイムのビジュアライゼーション**を主眼に、いろいろな学習パラダイムをブラウザで 1 ステップずつ覗けます。

入口は **https://lutelute.github.io/process_nn/** （**学習ロードマップ**）。ビルド・インストール不要、ブラウザで開くだけ。トップは横並びの一覧ではなく、**初学者が「いま何を学び／前提は何で／次にどこへ」進めるか**を辿れる学習の流れ（推奨順路の背骨＋カテゴリ別の依存順）として再構成されています。

## 共通フォーマット：整理版リッチ・インフォグラフ

全 25 ビューアは、1 手法を**そのページだけで完結して理解できる「動くインフォグラフ」**に統一されています。

- **単一ステージ・5 ステップ誘導** — 「次へ」で 問題 → 仕組み → 計算 → 学習/動作 → 結果 を 1 つずつ。一度に 1 焦点だけ提示し、認知負荷を抑える
- **操作バーは 1 本**（前へ／次へ／自動／最初から＋データ切替）。深掘り（数式の詳細・限界・関連手法）は折りたたみに収納
- **直感 → 数式（実数代入）→ フロー → 動作 → 結果 → 要点** を 1 画面で結び、人間がその手法を最後まで追えるよう設計

## 設計の 3 本柱（中身の質）

1. **実学習** — ランダムな重みではなく、その場で本当に学習する（中身が意味を持つ）
2. **実況解説** — 「今この瞬間に何が起きているか」を日本語で常時表示
3. **過程と結果の連動** — 学習で値・境界・構造が更新される様子、loss / 適応度などの推移を同時に見せる

各ビューアの数値ロジックは Node で 5 回検証（精度・収束）し、全ページの実描画を Playwright で確認（console エラー 0）しています。

---

## 🔗 ビューア一覧

### ① ニューラルネットの基礎
| ページ | 内容 |
|---|---|
| `index.html` | **学習ロードマップ**（推奨順路＋カテゴリ別の依存順）＋ **MLP 関数近似**デモ |
| `viz/index.html` | **信号の流れ** — 入力が層を流れ活性値で光る（合計の符号を実学習＋実況） |
| `viz/backprop.html` | **誤差逆伝播** — 順伝播→誤差→勾配の逆流→重み更新を 1 サイクル。結果の関数フィットも同時表示 |

### ② 教師あり学習 — 分類・認識
| ページ | 内容 |
|---|---|
| `viz/classify.html` | **決定境界** — 2 クラスを分ける境界が学習で形成（softmax+CE+Adam、データ 5 種） |
| `viz/digit.html` | **数字認識** — 描いた数字を認識し、判断の根拠（saliency）を実況 |
| `viz/cnn.html` | **CNN** — フィルタが画像を走査。🎓 で**フィルタを実学習**し特徴検出器を自力獲得 |
| `viz/rnn.html` | **RNN** — Elman+BPTT で時系列を 1 ステップ先予測、自由走行で波形再生 |
| `viz/dtree.html` | **決定木 (CART)** — 不純度が下がる軸で領域を再帰分割、木の成長＝特徴空間の分割（非NN） |
| `viz/knn.html` | **k近傍法 (kNN)** — 学習しない事例ベース。★をドラッグし近傍の多数決を観察 |
| `viz/svm.html` | **SVM** — 最大マージンの境界を学習、サポートベクトルを可視化 |
| `viz/naivebayes.html` | **ナイーブベイズ** — 各クラスをガウスで表しベイズ則で分類（生成モデル）。事後確率を観察 |

### ③ 言語モデル — Transformer から GPT へ
| ページ | 内容 |
|---|---|
| `viz/transformer.html` | **Transformer 学習** — 小型 GPT をブラウザで学習、loss 低下で attention・生成が変化 |
| `gpt2/` | **GPT-2 推論** — 本物の GPT-2 (124M) を forward 実行し、次トークン予測と内部を可視化 |

### ④ 教師なし学習 — 構造を見つける
| ページ | 内容 |
|---|---|
| `viz/kmeans.html` | **k-means** — 重心が収束しクラスタが現れる（Voronoi 背景・SSE 推移） |
| `viz/gmm.html` | **GMM（混合ガウス）** — EM 法でソフト割当、共分散楕円が収束、対数尤度が単調増加 |
| `viz/autoencoder.html` | **オートエンコーダ** — 入力をボトルネックに圧縮して復元、圧縮の限界も見える |
| `viz/pca.html` | **PCA** — 最大分散方向をべき乗反復で見つけ 1 次元へ圧縮 |
| `viz/tsne.html` | **t-SNE** — 高次元データを 2 次元へ、早期誇張でクラスタが浮かぶ |
| `viz/som.html` | **SOM（自己組織化マップ）** — 競合学習で格子がデータの形に広がり組織化 |
| `viz/hopfield.html` | **Hopfield ネットワーク** — パターンを記憶し、ノイズからエネルギー降下で想起（連想記憶） |

### ⑤ 強化学習・最適化
| ページ | 内容 |
|---|---|
| `viz/qlearning.html` | **Q学習** — 報酬から最短経路を学習、価値が伝播し方策が定まる |
| `viz/gradient.html` | **勾配降下** — 損失地形を SGD/Momentum/Adam が降下し比較 |
| `viz/ga.html` | **遺伝的アルゴリズム** — 勾配なしで最適化、集団が選択・交叉・突然変異で大域最適へ進化 |

### ⑥ 立体で見る — 3D 構造
| ページ | 内容 |
|---|---|
| `viz/mlp3d.html` | MLP を層シートの積層として立体表示（実学習対応） |
| `viz/cnn3d.html` | CNN の特徴マップを H×W×チャンネルのボリュームで立体表示 |
| `viz/rnn3d.html` | RNN を時間方向に展開、BPTT で系列予測を実学習 |
| `viz/attention3d.html` | 本物の attention を 3D 弧で、ヘッドを奥行きに分離（minigpt 実学習） |
| `viz/gpt3d.html` | GPT-2 の 12 層 × 12 ヘッド構造を 3D で俯瞰、ブロック内部を展開 |

> 3D はライブラリ不使用。`viz/lib3d.js` が回転・弱透視投影・ドラッグ操作を担う自前 3D エンジン。

---

## `gpt2/` — GPT-2 の生成過程と内部構造ビューア

本物の **GPT-2 small（124M）をブラウザで forward 実行**し、生成を 1 トークンずつ進めながら内部を可視化する。`transformers.js` は logits しか返さないため、トークナイザと forward を自前実装している。

- `gpt2/index.html` — 次トークン確率（top-k）・**attention 行列**（層×ヘッド）・**logit lens**（層ごとの途中予測）・残差ストリームのノルム推移・各ブロックの寄与・MLP 発火、そして次トークン予測の実況
- `gpt2/tools/tokenizer.mjs` — GPT-2 byte-level BPE（Node/ブラウザ共通）
- `gpt2/tools/gpt2.mjs` — safetensors パーサ＋ forward エンジン（中間表現キャプチャ対応）
- `gpt2/tools/minigpt.mjs` — 学習可能な小型 Transformer（`viz/transformer.html`・`viz/attention3d.html` が使用）
- `gpt2/GPT_NOTES.md` — 実装リファレンス

> **重み本体 `model.safetensors`（約 523MB）はリポジトリに含めていません**。ビューアで「ローカルファイルを選択」か「HuggingFace から取得」で読み込みます。CLI で取得する場合:
> ```bash
> curl -L -o gpt2/assets/model.safetensors \
>   https://huggingface.co/gpt2/resolve/main/model.safetensors
> ```

#### 正しさの検証
- **トークナイザ**: `encode("Hello world") = [15496, 995]`（GPT-2 既知値）と往復一致を確認
- **forward**: 本物の重みで意味的に正しい予測を確認（例: "Water is made of hydrogen and" → " oxygen"、"The opposite of hot is" → " cold"）

---

## ローカルで開く

ES Modules と fetch を使うため、ファイル直開きではなくローカルサーバ経由で開いてください。

```bash
git clone https://github.com/lutelute/process_nn.git
cd process_nn
python3 -m http.server 8000
# → http://localhost:8000/        学習の地図ハブ + 関数近似デモ
# → http://localhost:8000/viz/    各種ビューア（信号フロー/分類/CNN/RNN/Transformer/教師なし/強化/3D ほか）
# → http://localhost:8000/gpt2/   GPT-2 推論ビューア
```

トップの `index.html` のみ外部依存ゼロの単体 HTML なので、直接ブラウザで開いても動きます。
