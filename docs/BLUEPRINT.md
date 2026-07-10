# 新規教材 20 本 — 不足手法リストとブループリント仕様

process_nn の既存 52 ページを調査し、**機械学習・強化学習・深層学習・XAI・確率モデル・評価**の重要手法の欠落を洗い出した。
本書は (1) 追加する 20 素材のリスト、(2) 全素材が従うページ構造仕様（ブループリント）、(3) 各素材を仕上げる**充実ループ 7 回＋検証ループ 7 回**のプロトコル、を定める。

---

## 1. 不足手法リスト（新規 20 素材）

### 説明可能 AI（XAI）— 新ジャンル・現状 0 ページ
| slug | タイトル | 1 枚で言う核心 | 実計算・A/B 対比 |
|---|---|---|---|
| `xai.html` | XAI 入門 — NN はどこを見たか | 答えだけでなく根拠を測る。入力を少し変えると出力がどう変わるか＝勾配（saliency）と遮蔽（occlusion） | 小さな図形分類 NN を実学習し saliency / occlusion を実計算。**A/B: 形で当てるモデル vs 隅のショートカットで当てるモデル**（バイアス混入データ）— 精度は同じでも根拠が違うのを見抜く |
| `lime.html` | LIME — 局所で線形に写す | ブラックボックスの決定を、その 1 点の近所だけ単純な線形モデルで説明する | 非線形モデル（小 NN 実学習）の 1 点★をドラッグ→周辺サンプル生成→距離重み付き線形回帰→係数の棒グラフ。**A/B: 場所が違えば説明が変わる（局所性）** |
| `shap.html` | SHAP — 貢献の公平な山分け | 特徴の貢献を協力ゲームの Shapley 値で配る。全ての参加順を平均するから公平 | 3〜4 特徴のおもちゃ審査モデルで**厳密 Shapley を全部分集合列挙で実計算**、ウォーターフォール図。加法性（貢献の和＝予測−基準）を実数で確認。**A/B: 「重み×値」の素朴な帰属とのズレ（相互作用）** |

### 強化学習 — 現状 2 ページ（Q学習・DQN）のみ
| slug | タイトル | 核心 | 実計算・A/B |
|---|---|---|---|
| `bandit.html` | 多腕バンディット | 探索と活用のジレンマの最小形。試すか、儲けるか | 5 台スロットで ε-greedy / UCB / Thompson を実走、regret 曲線。**A/B: 欲張りのみ＝後悔が直線、UCB＝対数** |
| `policygrad.html` | 方策勾配（REINFORCE） | 価値を経由せず、良かった行動の確率を直接太らせる | グリッド環境で softmax 方策を REINFORCE 実学習、方策の矢印が偏る様子。**A/B: ベースライン有無で分散・安定性** |
| `actorcritic.html` | Actor-Critic | 動く人（方策）と批評家（価値）の分業。TD 誤差が共通の学習信号 | 同環境で A2C 実学習、方策矢印＋価値ヒートマップが同時に育つ。**A/B: REINFORCE（エピソード末まで待つ）vs TD（毎歩学ぶ）** |
| `mcts.html` | モンテカルロ木探索 | 先読み＝木を選択的に伸ばす。有望な枝ほど深く（UCB） | 三目並べで本物の MCTS（選択→展開→ロールアウト→逆伝播）、訪問回数＝枝の太さ。**A/B: ランダム打ち vs MCTS の対戦成績**。AlphaGo＝MCTS+NN |
| `rlhf.html` | RLHF | 人の好み（比較）から報酬モデルを学び、その報酬で方策を磨く。KL で元の言葉から離れすぎない | おもちゃ文生成＋ルール由来のペア比較→Bradley-Terry 報酬モデル実学習→方策改善。**A/B: KL 罰なし＝報酬ハッキング（変な文）vs あり＝自然** |

### 古典 ML・確率モデル・状態推定
| slug | タイトル | 核心 | 実計算・A/B |
|---|---|---|---|
| `gp.html` | ガウス過程回帰 | 「関数の上の確率分布」。観測に条件付けると平均と不確かさが出る。遠いほど不確かさが太る | RBF カーネルで事後分布・サンプルパスを実計算、カーネル幅スライダ。**A/B: 幅狭＝ぐにゃぐにゃ vs 広＝なめらか**。surrogate① の中身の単独解説 |
| `hmm.html` | 隠れマルコフモデル | 見えない状態が確率で遷移し、見える出力だけ手に入る。観測列から裏を推理 | 天気×行動のおもちゃで forward（尤度）と Viterbi（最尤経路）をトレリス図で実計算。**A/B: その時点だけ見る推定 vs 文脈で覆る Viterbi** |
| `kalman.html` | カルマンフィルタ | 予測（モデル）と観測（センサ）を不確かさで重み付けして混ぜる。混ぜると両方より良い | 等速運動＋ノイズ観測で KF 実装、共分散楕円。**A/B/C: 観測だけ（ガタガタ）/ モデルだけ（ドリフト）/ KF（追従）**。ゲイン＝信頼の配分 |
| `hierarchical.html` | 階層的クラスタリング | 1 点ずつから近い塊を順に併合＝デンドログラム。切る高さがクラスタ数 | 凝集型を実計算、デンドログラムが下から育つ、切断線ドラッグ。**A/B: 単連結＝鎖状 vs 完全連結＝丸く**。k-means（k を先に決める）と対比 |
| `anomaly.html` | 異常検知（Isolation Forest） | 異常は珍しく孤立→ランダム分割で早く一人になる（浅い深さで隔離） | 分割木を実構築、平均隔離深さ→スコア等高線。**A/B: 距離ベースで拾えない局所異常を隔離ベースが拾う** |
| `recommend.html` | 協調フィルタリング | 評価行列を「ユーザー因子×アイテム因子」の積で埋める。好みは低次元 | 8×8 評価行列（欠損あり）を行列分解 SGD で実学習、行列が埋まる様子＋因子空間にアイテムが並ぶ。**A/B: 平均埋め vs 行列分解**。word2vec の親戚（埋め込み） |

### 深層学習の欠け
| slug | タイトル | 核心 | 実計算・A/B |
|---|---|---|---|
| `resnet.html` | 残差接続（ResNet） | 学ぶのは変換でなく差分。近道（skip）を勾配が素通りし、深くしても壊れない | plain 網 vs skip 網を同条件で実学習、**層別勾配ノルムの実測**＋loss 比較。vanishing.html の解答編 |
| `transfer.html` | 転移学習・ファインチューニング | 前の課題で学んだ特徴は次でも使える。土台を凍らせて頭だけ替える | タスク A で特徴学習→少データ B を **(a)ゼロから (b)凍結+頭 (c)全体微調整** の 3 面実学習で対比。LoRA は details で言及 |
| `distill.html` | 知識蒸留 | 先生の確率分布（ソフトラベル）は正解ラベルより情報が濃い。温度で軟らかくして生徒に | 大 NN（先生）→小 NN（生徒）へ蒸留。**A/B: 正解ラベルのみ vs ソフトラベル**、境界の写り方。surrogate②（写し取り）の親戚 |
| `moe.html` | Mixture of Experts | 巨大な一つの脳でなく、専門家の集団＋受付（ルーター）。呼ぶのは毎回 1〜2 人＝巨大でも計算は薄い | 区分的な関数を **(a)単一 MLP vs (b)MoE（ゲート+4 専門家）** で実学習、ゲートの専門分化を色分け。GPT-4/Mixtral の文脈 |
| `pinn.html` | 物理情報 NN（PINN） | データが少なくても、物理法則（微分方程式）を損失に足せば法則側から縛れる | 単振り子（または熱伝導）で少数観測のみ。**A/B: 普通の NN＝観測の間ででたらめ vs PINN＝物理で縛られ正しく内挿**。微分は有限差分で実装。gnnflow の予告の回収 |

### 評価・実務の作法
| slug | タイトル | 核心 | 実計算・A/B |
|---|---|---|---|
| `crossval.html` | 交差検証とデータの使い方 | 解いた問題で実力を測ってはいけない。畳んで回せば全員が一度は試験官 | 多項式次数選択で **A/B: 1 回の holdout＝分割運ゲー vs 5-fold CV＝安定**。リークの罠（前処理を全体でやる）も実演。reg / metrics の続き |

### 見送り（理由付き）
- **UMAP** — t-SNE と教材上の役割が重複。**正規化フロー** — 生成 3 兄弟（VAE/GAN/拡散）で現代的地位はカバー済み。**Neural ODE / メタ学習 / 因果推論** — 企画軸（学習過程の可視化）から半歩外・ニッチ。**連合学習** — 分散システムの話が主で「学習の中身」の可視化になりにくい。**スペクトラルクラスタリング / PSO** — 既存（DBSCAN/GA）と役割重複。

---

## 2. ページ構造仕様（ブループリント）

**参照実装**: 標準部品と文体は `viz/boosting.html`、最終形（章立て＋15 枚スライド）は `viz/gnnflow.html`。**必ず両方を読んでから書くこと。**

### 2.1 ページ骨格（順序固定）
```
<!DOCTYPE html><html lang="ja"><head>
  <meta charset><meta viewport><title>◯◯ — 動くインフォグラフ</title>
  <style> …boosting.html / gnnflow.html の inline style をコピーして流用… </style>
  <link rel="stylesheet" href="theme.css">   ← inline style の後
</head><body><div class="wrap">
  <div class="nav"></div>                    ← 中身は nav.js が注入
  <h1>タイトル</h1>
  <div class="lead">導入 2〜3 文（<b>強調</b>・関連ページへ <a>）</div>
  <div class="purpose">                       ← 3 行固定
    なぜ学ぶ? / 一言で言うと / どこで使われる?
  <div class="stage">
    <div class="stepper" id="stepper"></div>  ← 章タブ（3〜4 章）
    <div class="body">
      <div class="vis"><canvas id="cv" width="360" height="430"></canvas>
        <div class="mini" id="mini"></div><div class="legend" id="legend"></div></div>
      <div class="explain" id="explain"></div>
    </div>
    <div class="bar"> 前へ/次へ(primary)/自動/最初から + spacer + ページ固有操作(🎲等) </div>
  </div>
  <div class="aha">💡 見方が変わる一文（1 文）</div>
  <div class="myth">⚠ よくある誤解（✗→✓ を 2 組）</div>
  <details><summary>もっと詳しく：…</summary><div class="det">…</div></details>
</div>
<script> "use strict"; … 本体 … </script>
<script src="nav.js"></script>
</body></html>
```

### 2.2 スライドエンジン（gnnflow.html 方式）
- `const CHAPTERS=[{t:'Ⅰ …',c:'var(--neg)',start:0},…]` — 3〜4 章。ステッパーは章を表示。
- `const SLIDES=[{title,legend,html(),draw(),dice?},…]` — **最終形は 13〜16 枚**。
- `html()` は `<h3>` ＋ `.eq.curr`（数式）＋ `.desc`（本文）を返す。ライブ値（学習中の loss 等）を文中に埋め込む。
- `draw()` は canvas に描く。`renderAll()`/`goSlide()`/`autoTick()` は gnnflow.html の制御をそのまま流用。
- 初期表示は**静止**（1 枚目）。「次へ ▶」で誘導する設計（ハブと違い自動再生にしない）。

### 2.3 実装規約
- **実学習・実計算necessity**: ランダムな見せかけ禁止。その場で本当に学習・計算する（例: Adam/SGD 実装、厳密 Shapley、実 MCTS）。
- **乱数**: `Math.random()` 禁止。既存と同じシード付き `rng()`（mulberry32 系）を使う。「🎲」等の再抽選は seed を進めて再計算。
- **色**: CSS 変数経由 `getCSS('--accent')` 等。canvas 背景は `#fffdf6` 系。テーマ色以外を発明しない。
- **数式**: `.eq` 内は `<i>変数</i>`・`<sub>`・`.frac`（分数）を使い、**必ず `<span class="read">読み：…</span>` の読み下し行**を付ける（nav.js が整形を注入）。
- **アクセシビリティ**: `window.__prefersReducedMotion` が真ならアニメをスキップして最終状態を描く。
- **外部依存ゼロ**: ライブラリ・画像・fetch 禁止。theme.css / nav.js のみ参照。
- **文体**: です・ます調。専門名には平易な言い換えを添える（例: 「regret（機会損失）」）。**1 枚 1 核心**。盛らない。
- **A/B 対比**: 平均的な見せ方より「条件 A vs B の対比」で本質を見せる（リスト表の A/B を必ず実装）。
- **相互リンク**: 関連既存ページへ `<a href="…">` を lead / desc / details に張る（例: gp → surrogate.html）。

### 2.4 登録 4 面（中央で一括実施 — 素材エージェントは触らない）
1. `viz/nav.js` の `cats`、2. トップ `index.html` の STEP カード、3. `README.md` の一覧表、4. `viz/map.html` の `M` 配列（既存モチーフ再利用）。
- 配置: gp→基礎 / resnet・transfer・distill→訓練・正則化 / crossval→分類 / anomaly・hierarchical→クラスタ / hmm・kalman・pinn→画像・系列 / moe→言語 / recommend→次元・生成 / bandit・policygrad・actorcritic・mcts・rlhf→強化 / xai・lime・shap→**新カテゴリ「説明AI」**（トップは STEP 9 として新設）。

---

## 3. 充実ループ 7 回＋検証ループ 7 回のプロトコル

初版（章立て＋6〜8 枚で動く版）を作った後、**L1→V1→L2→V2→…→L7→V7** の順で交互に回す。
各ループの実施内容と結果を `logs/loops/<slug>.md` に 1 ループ 3〜6 行で記録する。

| # | 充実ループ L（内容を育てる） | 検証ループ V（正しさを確かめる） |
|---|---|---|
| 1 | スライドを 13〜16 枚構成に拡張（章 3〜4、各枚の焦点を 1 つに定める） | `node --check`（scratch に script 抽出）＋ `node tools/check-pages.mjs` |
| 2 | 全スライドに数式 `.eq`＋`.read` 読み下しを配備 | 数式の記号・次元・符号・添字を 1 本ずつ点検（教科書と突き合わせ） |
| 3 | 実学習/実計算コアの質（収束・数値が意味を持つ・ライブ更新の実況） | **コアロジックを scratch .mjs に抽出し Node で実行**、収束数値をログに記録 |
| 4 | canvas 描画の質（各枚の図が核心を示すか・A/B 対比・アニメ） | Playwright で該当ページを開き console error / pageerror 0 件（下記コマンド） |
| 5 | 実例・物語（「どこで出会うか」の実例スライド・現実の数字） | ページ内リンク先の実在＋関連ページとの相互リンク確認 |
| 6 | purpose / aha / myth(2 組) / details / legend / mini の磨き込み | reduced-motion 対応・キーボード操作・コントラストの点検 |
| 7 | 全文推敲（1 枚 1 核心・冗長削除・用語の平易化・誤字） | 最終通し: check-pages ＋ Playwright ＋ 15 枚を通し読みして論理の飛びが無いか |

**単ページの Playwright 検証**（リポジトリ直下で `python3 -m http.server 8000` を立てた上で）:
```js
// scratch/crawl-one.mjs 相当 — tools/crawl-pages.mjs の 1 ページ版を書いて使う
import { chromium } from 'playwright';
const b = await chromium.launch(); const p = await (await b.newContext()).newPage();
const errs=[]; p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8000/viz/<slug>.html',{waitUntil:'networkidle'});
await p.waitForTimeout(1500);
// 全スライドを通しでクリックして各 draw() を実行させる
for(let i=0;i<20;i++){ await p.click('#nextBtn').catch(()=>{}); await p.waitForTimeout(150); }
console.log(errs.length?('NG\n'+errs.join('\n')):'OK'); await b.close();
```
