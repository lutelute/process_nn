// 全ノート共通の注釈データ。
// 「語源」は歴史的初出の断定ではなく、まず原語を分解して名前から発想を復元する。
// 歴史に触れる項目だけ source に原論文を持たせ、理解用の比喩と検証可能な由来をデータ上で区別する。
//
// 各語は 5 欄で書く（表示順もこの通り）:
//   parts  … 原語の分解（T() の第 5 引数、'語=意味|語=意味' 形式）
//   naming … なぜその名前なのか＝命名の由来（下の TERM_NAMING に 1 行足すだけ。省略可）
//   plain  … 人間の感覚でいうと
//   why    … なぜこの考え方？
//   coffee … COFFEE BREAK（小話・注意点。naming と内容が重ならないようにする）

const T = (id, term, en, category, parts, plain, why, coffee, source = null) => ({
  id, term, en, category,
  parts: parts.split('|').map(part => {
    const at = part.indexOf('=');
    return { word: part.slice(0, at), meaning: part.slice(at + 1) };
  }),
  plain, why, coffee,
  source: source ? { label: source[0], url: source[1] } : null,
});

export const TERM_CATEGORIES = [
  '学習の基本語', '数学・確率', 'ニューラルネット', '評価・実験', '古典・クラスタ',
  '画像・系列・グラフ', '言語モデル', '生成・表現学習', '強化学習', '説明可能AI',
];

export const TERM_NOTES = [
  // ── 学習の基本語 ──────────────────────────────────────────
  T('machine-learning','機械学習','Machine Learning','学習の基本語','machine=機械|learning=経験から規則を得ること','例から規則を調整し、未見の入力にも予測や判断を返す仕組み。','人が全ルールを書く代わりに、調整の基準と例を与えるため。','「学習」は理解や意識を意味しない。多くの場合は数値パラメータの最適化である。'),
  T('supervised-learning','教師あり学習','Supervised Learning','学習の基本語','supervised=答えを監督される|learning=例から学ぶ','入力と正解ラベルの組を使って、入力から答えへの写像を学ぶ。','正解との差を損失として直接測れるから。','教師は人間とは限らない。センサー値や将来の実測値も教師になれる。'),
  T('unsupervised-learning','教師なし学習','Unsupervised Learning','学習の基本語','un-=〜なし|supervised=正解による監督','正解ラベルを置かず、似たもの・圧縮軸・分布などデータ内部の構造を探す。','答えを用意しにくい大量データから形を見つけるため。','「教師なし」でも目的関数はある。何も指示せず自由に発見するわけではない。'),
  T('reinforcement-learning','強化学習','Reinforcement Learning','強化学習','reinforce=行動を強める|learning=経験から学ぶ','行動の結果として得る報酬を手掛かりに、長期的に良い行動方策を学ぶ。','その場の正解行動ではなく、遅れて返る結果しか分からない問題を扱うため。','心理学の「強化」と同じく、良い結果を生んだ行動が起こりやすくなるイメージ。'),
  T('generative-model','生成モデル','Generative Model','生成・表現学習','generative=生み出す|model=仕組みの模型','データが生まれる分布を表し、そこから新しい標本を作れるモデル。','分類の境界だけでなく、データそのものの成り立ちを扱いたいから。','「新しい」は学習分布と無関係という意味ではない。学習した規則の再結合である。'),
  T('model','モデル','Model','学習の基本語','model=模型・ひな型|mathematical model=数式で作る模型','入力から出力を作る規則を、関数や確率分布として表したもの。','現実を丸ごと扱わず、目的に必要な性質だけ計算可能にするため。','地図が土地そのものではないように、モデルも現実そのものではない。'),
  T('feature','特徴量','Feature','学習の基本語','feature=目立つ特徴|quantity=測れる量','モデルへ渡す、対象を説明する測定値や表現。','生の対象を比較・計算できる数に変えるため。','良い特徴は答えを丸写ししない。未来情報が混ざるとデータリークになる。'),
  T('label','ラベル','Label','学習の基本語','label=札・分類名|target=予測したい標的','教師あり学習で予測したい正解値やクラス。','入力と望む出力を結び付けて誤差を測るため。','回帰の連続値も広い意味ではラベル／ターゲットである。'),
  T('parameter','パラメータ','Parameter','学習の基本語','para=そばに・補助的に|meter=測るもの','学習によってデータから調整される重みやバイアスなどの数値。','同じ計算骨格を、データに合う関数へ変形するつまみになる。','学習後の巨大モデルは、ほとんどがこの数値の集まりである。'),
  T('hyperparameter','ハイパーパラメータ','Hyperparameter','学習の基本語','hyper=一段上の|parameter=調整値','学習率、層数、正則化強度など、通常は学習の外側で決める設定。','パラメータをどう学ばせるか自体を制御するため。','「ハイパー」は派手という意味ではなく、パラメータより外側の階層という意味。'),
  T('training','訓練','Training','学習の基本語','train=訓練する|training data=訓練に使う例','損失を手掛かりにパラメータを繰り返し更新する工程。','一度の計算ではなく、誤りから少しずつ規則を合わせるため。','学習と訓練はほぼ同義で使われるが、評価データで更新してはいけない。'),
  T('inference','推論','Inference','学習の基本語','infer=手掛かりから導く|-ence=過程','学習済みモデルへ入力を渡し、予測や生成を得る工程。','訓練と本番利用を分けると、計算量や挙動を整理しやすい。','統計学の推論と、ニューラルネットの「forward実行」は文脈により意味の幅が違う。'),
  T('loss-function','損失関数','Loss Function','学習の基本語','loss=失った価値・誤差|function=入力を値へ写す規則','予測が望ましい答えからどれだけ外れたかを一つの数で表す関数。','学習方向を決めるには「良さ」を計算可能な量へ翻訳する必要がある。','モデルは損失を下げるだけ。人の本当の目的と損失がずれると、賢く間違える。'),
  T('optimizer','最適化手法','Optimizer','学習の基本語','optimal=最もよい|-izer=そうする仕組み','損失を小さくするよう、勾配などからパラメータ更新量を決める方法。','同じ損失でも、地形をどう歩くかで速さと到達点が変わるため。','Adamも魔法ではない。学習率や問題の形によってSGDが勝つこともある。'),
  T('epoch','エポック','Epoch','学習の基本語','epoch=一つの時代・区切り|one epoch=全訓練例を一巡','訓練データ全体を一回使い切る学習上の区切り。','データ量が違っても、全体を何巡したかで進行を比較しやすい。','同じ1 epochでもバッチサイズにより更新回数は変わる。'),
  T('batch','バッチ','Batch','学習の基本語','batch=ひとまとめ|mini-batch=小分けの束','一回の勾配計算でまとめて処理する複数の訓練例。','一例のノイズと全件計算の重さの中間を取るため。','料理の「一仕込み分」と同じ語。GPUは束ねるほど並列計算しやすい。'),
  T('seed','乱数シード','Random Seed','評価・実験','seed=種|random seed=乱数列の出発点','疑似乱数列の開始状態を決め、同じ実験を再現するための値。','初期値やデータ順の偶然を固定・比較できるから。','同じseedは同じ運を再演する合言葉。別seed複数本で運依存も測る。'),
  T('overfitting','過学習','Overfitting','学習の基本語','over=過度に|fit=合わせる','訓練例には合うが、未見データでは性能が落ちる状態。','例そのものの癖まで暗記すると、本質的な規則から離れるため。','テスト問題の答えを暗記したのに似ている。訓練点の高得点だけでは見抜けない。'),
  T('generalization','汎化','Generalization','学習の基本語','general=一般の|-ization=そうすること','学習で見ていないデータにも規則を適用できる性質。','本番で出会うのは訓練例そのものではないから。','機械学習の本当の試験は訓練後に始まる。未知データで測って初めて分かる。'),
  T('train-valid-test','訓練・検証・テスト分割','Train / Validation / Test Split','評価・実験','train=学ぶ|validation=選ぶ|test=最後に測る','学習用、設定選択用、最終評価用にデータの役割を分ける。','評価結果を見て設定を変える行為も学習なので、最後の物差しを隔離するため。','テストを何度ものぞくと、それは検証データへ変わってしまう。'),
  T('bias-variance','バイアスと分散','Bias–Variance','評価・実験','bias=系統的な偏り|variance=標本で揺れる度合い','単純すぎる誤差と、データの偶然に敏感な誤差を分けて考える見方。','複雑さを増やせば常に良いわけではない理由を整理できる。','的の中心から毎回同じ方向に外すのがbias、ばらばらに外すのがvariance。'),
  T('distribution-shift','分布シフト','Distribution Shift','評価・実験','distribution=データの分布|shift=ずれ・移動','訓練時と本番時で、入力や答えの生まれ方が変わること。','未知環境で急に性能が落ちる原因を、単なるノイズと分けて考えるため。','晴天写真だけで学んだモデルに夜景を見せると、同じ物体でも世界が変わる。'),

  // ── 数学・確率 ────────────────────────────────────────────
  T('tensor','テンソル','Tensor','数学・確率','tensor=張るもの|shape=各軸の長さ','数やベクトル、行列を多次元へ一般化した数値の箱。','画像・系列・バッチを、軸の意味を保ったまま同じ計算で扱うため。','難しい名前だが、実装では「shapeを持つ多次元配列」と考えるのが第一歩。'),
  T('gradient','勾配','Gradient','数学・確率','grade=段差・傾き|-ient=性質を持つ','多変数関数が最も急に増える方向と傾きを並べたベクトル。','損失を下げるには、その反対向きへ動けばよいから。','山道の足元で測った「最急上り矢印」。地図全体を知らなくても一歩を決められる。'),
  T('gradient-descent','勾配降下法','Gradient Descent','学習の基本語','gradient=傾き|descent=降下','損失の勾配と反対方向へ、パラメータを少しずつ動かす最適化法。','局所的な坂の情報だけで高次元の谷を探せるため。','霧の山で足元の下り坂だけを頼りに谷へ降りる比喩が、そのまま名前になっている。'),
  T('sgd','確率的勾配降下法','Stochastic Gradient Descent','学習の基本語','stochastic=確率的|gradient descent=勾配で降りる','全データではなく、ランダムな例やミニバッチで勾配を近似する方法。','一歩を安くし、少しの揺らぎで学習を高速に進めるため。','日本語の「確率的」は、結果をでたらめにするのでなく勾配の見積もりに標本を使う意味。'),
  T('genetic-algorithm','遺伝的アルゴリズム','Genetic Algorithm','学習の基本語','genetic=遺伝の仕組みを借りた|algorithm=計算手順','候補解の集団へ選択・交叉・突然変異を繰り返し、良い解を探索する最適化法。','勾配がない、途切れる、多峰性が強い問題でも候補の比較だけで探索するため。','生物進化の忠実な再現ではなく、進化の語彙を借りた探索法。集団の多様性を失うと早熟する。'),
  T('probability-distribution','確率分布','Probability Distribution','数学・確率','probability=起こりやすさ|distribution=配り方','起こり得る値それぞれに、どれくらい起こりやすいかを割り当てたもの。','一つの予測値だけでなく、不確かさや複数の可能性を表すため。','合計1の「可能性の予算」を候補へ配ると考えるとよい。'),
  T('likelihood','尤度','Likelihood','数学・確率','likely=ありそう|-hood=度合い','観測済みデータを、あるパラメータがどれだけ自然に説明するかの値。','データを固定し、もっとも説明力のあるモデル設定を探すため。','確率と同じ式でも視点が逆。確率はモデルからデータ、尤度はデータからモデルを見る。'),
  T('posterior','事後分布','Posterior Distribution','数学・確率','post=後|prior=前','観測前の信念にデータを反映した後の、未知量についての確率分布。','新しい証拠で不確かさを更新する形を明示できるため。','ベイズ更新は「前の地図」を捨てず、観測を重ねて描き直す作業。'),
  T('entropy','エントロピー','Entropy','数学・確率','en=内側|trope=変化・向き','確率分布の不確かさ、または結果を符号化する平均情報量。','予測が一点に確信しているか、広く迷っているかを数にするため。','熱力学から情報理論へ借りられた語。共通する直感は「散らばり」である。'),
  T('cross-entropy','交差エントロピー','Cross-Entropy','数学・確率','cross=二つをまたぐ|entropy=情報量','真の分布を、予測分布の符号で表したときの平均的な驚き。','正解へ高い確率を置くほど小さくなり、確率分類の学習に向くため。','自信満々の誤答を強く罰する。確率0に近い正解は非常に「驚く」からである。'),
  T('kl-divergence','KLダイバージェンス','Kullback–Leibler Divergence','数学・確率','Kullback / Leibler=提案者名|divergence=隔たり','二つの確率分布を取り違えたときに余分に必要な情報量。','分布同士の違いを、学習可能な目的関数へ変えるため。','距離に似るが左右非対称で三角不等式も満たさない。だからdistanceではなくdivergence。'),
  T('softmax','ソフトマックス','Softmax','数学・確率','soft=滑らかな|max=最大を選ぶ','複数のスコアを、合計1の滑らかな確率へ変える関数。','最大だけを選ぶ操作を微分可能にし、候補間の相対差も残すため。','温度を下げるとhard maxに近づき、上げると候補の差が柔らかくなる。'),
  T('kernel','カーネル','Kernel','数学・確率','kernel=核・中心部|kernel function=二点の近さを測る核','二つの入力の似ている度合いや相関を返す関数。','明示的に高次元座標を作らず、近さだけで非線形構造を扱えるため。','同じ語がOSや畳み込みにも出る。共通イメージは「計算の中心となる小さな規則」。'),
  T('covariance','共分散','Covariance','数学・確率','co-=ともに|variance=変動','二つの量が平均から同じ向きに動くか、逆向きに動くかを表す量。','変数を別々でなく、連動の仕方まで確率モデルに入れるため。','単位に依存する。標準化した共分散が相関係数である。'),
  T('latent-space','潜在空間','Latent Space','生成・表現学習','latent=隠れている|space=座標空間','観測データを説明する、直接は見えない少数の座標の空間。','複雑なデータを意味のある軸へ圧縮・操作するため。','潜在軸に人が読める意味が必ず一つずつ対応するとは限らない。'),
  T('embedding','埋め込み','Embedding','言語モデル','embed=中へはめ込む|-ing=変換','単語や対象を、関係が距離に表れる連続ベクトルへ写すこと。','記号をニューラルネットが計算でき、似た対象を近く置ける形にするため。','地図に都市を置くように、対象を座標へ「埋め込む」。地図の軸自体に名前がないことも多い。'),

  // ── ニューラルネット ───────────────────────────────────────
  T('forward-propagation','順伝播','Forward Propagation','ニューラルネット','forward=前へ|propagate=伝える','入力から各層の計算を順に通し、予測を作る流れ。','複雑な関数を小さな変換の合成として計算するため。','学習時も推論時も順伝播は行う。逆伝播は訓練時に勾配を求める側。'),
  T('activation-function','活性化関数','Activation Function','ニューラルネット','activate=活動させる|function=変換規則','ニューロンの加重和を非線形に変換する関数。','線形変換を何層重ねても一つの線形変換にしかならない限界を破るため。','ReLUは負を0にするだけ。それでも深いネットの表現力を生む重要な折れ目になる。'),
  T('mlp','多層パーセプトロン','Multilayer Perceptron','ニューラルネット','multi=複数|layer=層|perceptron=知覚器','全結合層と活性化を積み重ねた基本的なニューラルネット。','非線形な関数を、層ごとの変換の合成として近似するため。','名前にperceptronとあるが、現代のMLPは単純パーセプトロン則ではなく逆伝播で学ぶのが普通。'),
  T('perceptron','パーセプトロン','Perceptron','ニューラルネット','perceive=知覚する|-tron=装置を思わせる接尾辞','入力の重み付き和で二値判定し、誤分類したとき境界を修正する線形分類器。','学習する人工ニューロンという最小構成を示すため。','線形分離できないXORは解けない。この限界が多層化への重要な動機になった。'),
  T('linear-regression','線形回帰','Linear Regression','学習の基本語','linear=直線・線形|regression=回帰','入力の線形結合で連続値を予測し、通常は二乗誤差を小さくする方法。','係数の意味を読みやすく、予測と推定の基準線になるため。','regressionは「平均への回帰」を観察した歴史的表現に由来するが、現在は広く連続値予測を指す。'),
  T('backpropagation','誤差逆伝播','Backpropagation','ニューラルネット','back=後ろへ|propagation=伝播','連鎖律を使い、出力側の損失から各パラメータの勾配を逆向きに計算する方法。','中間計算を再利用し、巨大な合成関数の全微分を効率よく得るため。','「誤差そのもの」より正確には、損失の微分情報を後ろへ送る。', ['Rumelhart, Hinton & Williams (1986)','https://www.nature.com/articles/323533a0']),
  T('regularization','正則化','Regularization','ニューラルネット','regular=規則的・滑らか|-ization=そうすること','損失へ制約や罰則を加え、複雑すぎる解を選びにくくする考え方。','訓練データへの過剰適合を抑え、汎化しやすい解へ偏らせるため。','L2、dropout、データ拡張、早期終了は形は違っても「自由すぎる学習を抑える」仲間。'),
  T('dropout','ドロップアウト','Dropout','ニューラルネット','drop=落とす|out=外へ','訓練中だけ一部のニューロン出力をランダムに0へ落とす正則化。','特定の経路だけに頼る共適応を減らし、複数の部分ネットを共有して学ばせるため。','推論時は通常落とさない。訓練時との期待値を合わせるスケーリングが要る。'),
  T('vanishing-gradient','勾配消失','Vanishing Gradient','ニューラルネット','vanish=消える|gradient=勾配','深い層へ逆伝播する途中で、微分の積が極端に小さくなる問題。','手前の層がほとんど更新されず、長い依存や深い表現を学べなくなるため問題になる。','小さい数を何度も掛けるだけで起こる。LSTMや残差接続は別の道で流れを保つ。'),
  T('batch-normalization','バッチ正規化','Batch Normalization','ニューラルネット','batch=例の束|normalization=尺度を整える','ミニバッチの統計で中間活性を正規化し、学習可能な拡大・移動を加える層。','活性の尺度を扱いやすくし、最適化を安定させるため。','訓練時のバッチ統計と推論時の移動統計が違う点は、実装上の重要な境界。'),
  T('residual-connection','残差接続','Residual Connection / ResNet','ニューラルネット','residual=差し引いて残る差|connection=接続','入力を変換結果へ直接足し、層には必要な差分だけを学ばせる接続。','情報と勾配の近道を作り、深いネットを最適化しやすくするため。','「何もしない」が必要なら変換を0にすればよい。恒等写像を学ぶ負担が小さくなる。', ['He et al., Deep Residual Learning (2015)','https://arxiv.org/abs/1512.03385']),
  T('transfer-learning','転移学習','Transfer Learning','ニューラルネット','transfer=移す|learning=学習','ある課題で得た表現や重みを、別の関連課題の出発点に使う方法。','少ないデータと計算で、新しい課題へ既存知識を再利用するため。','凍結は完全保存、fine-tuningは少し作り替える。データ量で適切な度合いが変わる。'),
  T('knowledge-distillation','知識蒸留','Knowledge Distillation','ニューラルネット','knowledge=知識|distillation=蒸留・成分を移す','大きな教師モデルの確率分布を、小さな生徒モデルの学習信号にする圧縮法。','正解ラベルだけでなく、似た誤答への相対的な自信も移せるため。','液体の蒸留の比喩どおり、重い器をコピーせず振る舞いの「エッセンス」を移す。', ['Hinton, Vinyals & Dean (2015)','https://arxiv.org/abs/1503.02531']),
  T('convolution','畳み込み','Convolution','画像・系列・グラフ','convolve=巻き合わせる|filter=小さな検出器','小さなフィルタを位置ごとに滑らせ、局所パターンへの反応を作る演算。','同じ検出器を場所をまたいで共有し、画像の局所性を効率よく使うため。','日本語の「畳み込み」は二つの関数をずらしながら重ねて足す姿をよく表す。'),

  // ── 評価・実験 ────────────────────────────────────────────
  T('confusion-matrix','混同行列','Confusion Matrix','評価・実験','confusion=取り違え|matrix=行列','真のクラスと予測クラスの組を表にし、正解と誤りの種類を数えたもの。','同じ正解率でも、見逃しと誤報の違いを分解するため。','モデルが何と何を「混同」したかを見る表なので、この名前が直感的。'),
  T('precision-recall','適合率と再現率','Precision and Recall','評価・実験','precision=陽性予測の精密さ|recall=本物陽性の回収','適合率は陽性予測の純度、再現率は実際の陽性を拾えた割合。','誤報と見逃しのどちらを重く見るかを分けて評価するため。','検索ではprecisionが検索結果の純度、recallが関連文書の取りこぼしの少なさだった。'),
  T('roc-auc','ROC AUC','Receiver Operating Characteristic / Area Under Curve','評価・実験','receiver=信号受信機|operating characteristic=動作特性|AUC=曲線下面積','しきい値を動かした偽陽性率と真陽性率の曲線、およびその面積。','一つのしきい値に固定せず、正例を負例より上位へ置く能力を測るため。','ROCという名はレーダー受信機の信号検出研究から来た。希少陽性ではPR曲線も併記したい。'),
  T('cross-validation','交差検証','Cross-Validation','評価・実験','cross=分割を交差させる|validation=妥当性の確認','データを複数分割し、検証役を交代させて性能を見積もる方法。','一回の偶然な分割に評価が左右されるのを減らすため。','各点は学習にも検証にも登場するが、同じfold内で両方には使わない。'),
  T('model-evaluation','モデル評価','Model Evaluation','評価・実験','model=予測の模型|evaluation=価値を測る','目的に合う指標と未見データで、モデルの性能と限界を測る工程。','学習損失が小さいことと、現場で役立つことは同じではないため。','物差しを選ぶこと自体が設計。医療の見逃しと広告の誤配信では同じ指標を重視しない。'),
  T('calibration','確率校正','Probability Calibration','評価・実験','calibrate=目盛りを合わせる|probability=確率','予測確率0.8の集団で実際にも約80%起きる、という確率と頻度の整合。','順位が正しくても、自信の数値が信用できるとは限らないから。','天気予報の「降水確率70%」を長く集め、約70%雨なら校正されている。'),
  T('confidence-interval','信頼区間','Confidence Interval','評価・実験','confidence=手続きへの信頼|interval=区間','同じ標本抽出を繰り返したとき、所定割合で真値を含むよう作る区間推定手続き。','点推定だけでは見えない標本変動の大きさを示すため。','95%区間は「この一つの区間に真値が95%で入る」という事後確率とは別の概念。'),
  T('ablation','アブレーション','Ablation Study','評価・実験','ablate=切り取る|study=調査','構成要素を一つずつ除き、性能差からその寄与を調べる実験。','全部入りモデルの改善だけでは、どの工夫が効いたか分からないため。','医学の除去実験から借りた語。機械学習では部品を「外して確かめる」。'),

  // ── 古典・クラスタ ─────────────────────────────────────────
  T('logistic-regression','ロジスティック回帰','Logistic Regression','古典・クラスタ','logistic=ロジスティック関数|regression=係数を当てはめる','線形スコアをシグモイドで0〜1へ変え、クラス確率を推定する分類法。','決定境界は単純に保ちつつ、確率として学習できるため。','名前に回帰とあるが主用途は分類。回帰しているのは対数オッズの線形関係。'),
  T('decision-boundary','決定境界','Decision Boundary','古典・クラスタ','decision=判定|boundary=境目','予測クラスが切り替わる入力空間上の境界。','分類器の判断規則を幾何学として見える形にするため。','精度が同じ二モデルでも、境界の形を見ると未知点への振る舞いが違うことがある。'),
  T('decision-tree','決定木','Decision Tree','古典・クラスタ','decision=判断|tree=枝分かれ構造','特徴への質問でデータを再帰的に分け、葉で予測するモデル。','if–then規則として読みやすく、非線形な領域分割を作れるため。','根から質問をたどり葉へ着く姿が木に似る。深すぎる木は訓練例を暗記しやすい。'),
  T('random-forest','ランダムフォレスト','Random Forest','古典・クラスタ','random=データや特徴を乱択|forest=多数の木','異なるランダム性で育てた決定木を多数決・平均でまとめるアンサンブル。','相関しすぎない複数の木を平均し、単独木の不安定さを減らすため。','一本ではなく森。各分岐で候補特徴もランダムに絞るのが重要な多様性源。', ['Breiman, Random Forests (2001)','https://doi.org/10.1023/A:1010933404324']),
  T('gradient-boosting','勾配ブースティング','Gradient Boosting','古典・クラスタ','gradient=損失を下げる方向|boosting=弱いものを強める','前のモデルの誤りを補う弱学習器を、損失の勾配方向へ順に足す方法。','単純な木を積み重ね、全体として強い非線形モデルを作るため。','forestが木を並列に育てるのに対し、boostingは前の反省を受けて直列に育てる。'),
  T('knn','k近傍法','k-Nearest Neighbors','古典・クラスタ','k=見る隣人の数|nearest neighbors=最も近い近所','予測したい点に近いk個の訓練例を探し、多数決や平均で答える方法。','明示的な関数を学ばず、似た事例をそのまま再利用できるため。','訓練はほぼ保存だけだが、推論時に全近所を探すので計算の支払いが後に来る。'),
  T('svm','サポートベクターマシン','Support Vector Machine','古典・クラスタ','support vectors=境界を支える点|machine=判定機構','クラス間の余白を最大にする境界を、境界近くの点から決める分類器。','余白を広くすると小さな入力変化へ頑健な境界を選びやすいため。','遠い点を動かしても境界は変わらないことが多い。支えている少数点がsupport vectors。'),
  T('naive-bayes','ナイーブベイズ','Naive Bayes','古典・クラスタ','naive=素朴な独立仮定|Bayes=ベイズ則','クラスが分かれば各特徴は独立と仮定し、ベイズ則でクラス確率を比べる方法。','強い単純化で少量データでも高速に確率分類できるため。','仮定は「ナイーブ」でも予測が弱いとは限らない。文章分類では意外に強い基準になる。'),
  T('k-means','k-means','k-means Clustering','古典・クラスタ','k=塊の数|means=平均・重心','各点を近い重心へ割り当て、重心を平均で更新する反復クラスタリング。','距離だけで、代表点とグループを交互に改善できるため。','初期重心で結果が変わる。複数seedやk-means++が必要になる理由。'),
  T('gmm','混合ガウスモデル','Gaussian Mixture Model','古典・クラスタ','Gaussian=正規分布|mixture=混ぜ合わせ|model=模型','複数のガウス分布を混ぜ、各点がどの成分由来かを確率で表すモデル。','楕円形のクラスタと、境界での曖昧な所属を表すため。','k-meansの硬い所属を柔らかくし、各塊に大きさと向きも持たせた親戚と見られる。'),
  T('dbscan','DBSCAN','Density-Based Spatial Clustering of Applications with Noise','古典・クラスタ','density-based=密度に基づく|spatial clustering=空間の群分け|noise=外れ点','十分密な点を連結して任意形状のクラスタを作り、疎な点をノイズとする方法。','クラスタ数を先に決めず、三日月形や外れ値を扱うため。','長い正式名が設計をほぼ説明している。中心点・境界点・ノイズの三役で見る。'),
  T('hierarchical-clustering','階層的クラスタリング','Hierarchical Clustering','古典・クラスタ','hierarchy=階層・家系|clustering=群分け','近いクラスタを順に併合、または大きな塊を分割し、入れ子構造を作る方法。','クラスタ数を後から木の切断位置で選べるため。','結果のデンドログラムは分類の家系図。距離だけでなく「塊間の距離」の定義が性格を決める。'),
  T('som','自己組織化マップ','Self-Organizing Map','古典・クラスタ','self-organizing=自ら配置を整える|map=地図','格子上の代表ベクトルを競合学習させ、データの近さを保つ二次元地図を作る方法。','高次元データの近隣関係を、眺められる配置へ写すため。','勝者だけでなく近所も一緒に動くので、格子がちぎれずデータ形状へ広がる。'),
  T('hopfield-network','Hopfieldネットワーク','Hopfield Network','古典・クラスタ','Hopfield=提案者名|network=相互接続網','対称な結合とエネルギー関数を持ち、状態更新で記憶パターンへ落ち着く再帰ネット。','ノイズを含む手掛かりから全体パターンを想起する連想記憶を作るため。','ボールが近い谷底へ転がる比喩で、記憶をエネルギー地形の谷として考えられる。'),
  T('anomaly-detection','異常検知','Anomaly Detection','古典・クラスタ','anomaly=通常則からの外れ|detection=見つけること','多数派の正常パターンと異なる観測を見つける課題。','故障・不正・未知事象のように、異常ラベルが少ない状況を扱うため。','異常は文脈依存。真夏の30℃は普通でも、冷凍庫の30℃は大事件。'),
  T('pca','主成分分析','Principal Component Analysis','古典・クラスタ','principal=主要な|component=成分|analysis=分析','データの分散が最大になる直交軸を見つけ、少数次元へ射影する方法。','変動を多く残しながら圧縮・可視化するため。','軸の符号は反転しても同じ主成分。左右が逆でも計算結果として矛盾しない。'),
  T('tsne','t-SNE','t-distributed Stochastic Neighbor Embedding','古典・クラスタ','t-distributed=t分布を使う|stochastic neighbor=確率的な近所|embedding=埋め込み','高次元で近い点を、低次元でも近く置くことを重視した可視化法。','局所的な群構造を二次元で見つけやすくするため。','クラスタ間の遠さや大きさはそのまま読めない。美しい島の配置を定量地図と誤解しない。', ['van der Maaten & Hinton (2008)','https://www.jmlr.org/papers/v9/vandermaaten08a.html']),

  // ── 画像・系列・グラフ ─────────────────────────────────────
  T('rnn','再帰型ニューラルネット','Recurrent Neural Network','画像・系列・グラフ','recurrent=繰り返し戻る|neural network=神経回路網','前時刻の隠れ状態を次時刻へ再利用し、系列を順に処理するネット。','可変長の履歴を同じ重みで読み、過去の要約を持ち回るため。','図の輪がrecurrentの由来。時間方向に展開すると同じセルが横一列に並ぶ。'),
  T('lstm','LSTM','Long Short-Term Memory','画像・系列・グラフ','long=長期|short-term memory=短期記憶','セル状態とゲートで、必要な情報を長く保持・更新するRNN。','単純RNNで消えやすい長期依存と勾配の通り道を作るため。','一見矛盾した「長い短期記憶」という名は、短期記憶の仕組みを長持ちさせる狙いを表す。'),
  T('hmm','隠れマルコフモデル','Hidden Markov Model','画像・系列・グラフ','hidden=直接見えない|Markov=次は現在状態に依存|model=模型','見えない状態が遷移し、状態ごとに観測を生む確率的系列モデル。','観測列から背後の状態列や次の観測を推理するため。','天気は隠れ状態、傘は観測、と置くと「傘の列から天気を読む」構図になる。'),
  T('kalman-filter','カルマンフィルタ','Kalman Filter','画像・系列・グラフ','Kalman=提案者名|filter=雑音から信号を取り出す','モデルによる予測と観測を、それぞれの不確かさに応じて融合する状態推定法。','雑音のあるセンサーから、時々刻々の見えない状態を追うため。','信用できる観測なら観測へ寄り、荒い観測ならモデルを信じる。ゲインはその配合率。'),
  T('gnn','グラフニューラルネット','Graph Neural Network','画像・系列・グラフ','graph=点と辺の関係|neural network=学習する変換','各ノードが近隣から情報を集め、関係構造を保って表現を更新するネット。','格子に限らない分子・道路・SNSなどの接続データを扱うため。','一層で一つ隣、二層で二つ隣。層数は情報が届く距離にもなる。'),
  T('power-flow','潮流計算','Power Flow','画像・系列・グラフ','power=電力|flow=流れ','電力網で各バスの電圧・位相と送電線の電力の流れを求める計算。','需要と発電の条件から、過負荷や運用可能性を評価するため。','水の流れに似た名前だが、交流系統では位相差とインピーダンスが流れを決める。'),
  T('pinn','物理情報ニューラルネット','Physics-Informed Neural Network','画像・系列・グラフ','physics-informed=物理法則を教え込む|neural network=関数近似器','観測誤差に加え、微分方程式や境界条件の残差も損失にするネット。','データが少ない場所でも、既知の物理法則を制約として使うため。','物理を自動発見するとは限らない。通常は人が知る方程式を損失へ書く。'),

  // ── 言語モデル ────────────────────────────────────────────
  T('word-embedding','単語埋め込み','Word Embedding','言語モデル','word=単語|embedding=ベクトル空間へ埋める','単語を、使われ方の似た語が近くなる連続ベクトルへ変換した表現。','離散的な単語IDの間に、類似や方向の計算を導入するため。','「意味」は辞書定義でなく共起から現れる。似た文脈に出る語が近づく。'),
  T('positional-encoding','位置エンコーディング','Positional Encoding','言語モデル','position=位置|encoding=数値符号へ変換','系列中の順番を表すベクトルを、トークン表現へ加える仕組み。','自己注意だけでは入力順を区別できないため。','住所を内容に添えるようなもの。同じ単語でも何番目かを別信号で知らせる。'),
  T('self-attention','自己注意','Self-Attention','言語モデル','self=同じ系列自身|attention=注目','各トークンが同じ系列内の全トークンを参照し、関連度で情報を混ぜる演算。','遠い位置の関係を短い計算経路で結び、文脈に応じて表現を変えるため。','attention重みは重要な内部信号だが、それだけでモデル判断の因果的説明になるとは限らない。'),
  T('transformer','Transformer','Transformer','言語モデル','transform=変換する|-er=変換するもの','注意機構と位置ごとのMLP、残差接続を積み重ねた系列モデル。','再帰を使わず系列位置を並列処理し、長距離関係も扱うため。','一般語の「変換器」を固有名のように使った。原論文は注意中心の構成を提案した。', ['Vaswani et al., Attention Is All You Need (2017)','https://arxiv.org/abs/1706.03762']),
  T('token','トークン','Token','言語モデル','token=記号・しるし|tokenization=記号単位へ分割','モデルが一単位として読む文字列片や記号ID。','有限の語彙で、未知の文字列も小さな部品へ分けて処理するため。','一トークンは一単語とは限らない。空白、語尾、漢字の一部まで分割されることがある。'),
  T('gpt','GPT','Generative Pre-trained Transformer','言語モデル','generative=生成する|pre-trained=事前学習済み|transformer=注意型モデル','大量テキストで次トークン予測を事前学習したTransformer系言語モデル。','同じ予測学習から、生成や多様な言語課題に使える表現を得るため。','略称の三語が設計を要約する。生成型で、先に学び、骨格はTransformer。'),
  T('moe','Mixture of Experts','Mixture of Experts','言語モデル','mixture=混合|experts=専門家群|router=受付','入力ごとに少数の専門家ネットを選び、出力を混ぜる条件付き計算。','総パラメータを増やしつつ、一入力あたりの計算を抑えるため。','専門家の役割は人が名付けず、ルーターとの共同学習で自然に分かれることがある。'),
  T('rag','RAG','Retrieval-Augmented Generation','言語モデル','retrieval=検索|augmented=補強された|generation=生成','質問に関連する外部文書を検索し、その文脈を使って回答を生成する構成。','モデル重みだけに頼らず、根拠や更新可能な知識を入力時に供給するため。','検索が外すと生成も苦しい。retrieverとgeneratorを分けて測るのが肝心。', ['Lewis et al. (2020)','https://arxiv.org/abs/2005.11401']),

  // ── 生成・表現学習 ─────────────────────────────────────────
  T('matrix-factorization','行列分解','Matrix Factorization','生成・表現学習','matrix=行列|factorization=因子の積へ分ける','大きな行列を、低次元の二つ以上の行列の積で近似する方法。','欠損した評価を、ユーザーと項目の潜在因子の相性として予測するため。','掛け算して元に近づく小さな部品へ分ける。推薦では隠れた「好みの軸」が現れる。'),
  T('autoencoder','オートエンコーダ','Autoencoder','生成・表現学習','auto=自分自身|encoder=符号化器','入力を低次元へ圧縮し、同じ入力を復元するよう学ぶネット。','ラベルなしで情報を保つ表現や圧縮座標を得るため。','答えが入力自身なのでauto。単なる恒等写像を防ぐためボトルネックやノイズが要る。'),
  T('contrastive-learning','対照学習','Contrastive Learning','生成・表現学習','contrast=対比する|learning=学習','関連する組を近づけ、無関係な組を遠ざける表現学習。','ラベルの代わりに「同じ対象の別の見え方」を教師信号にできるため。','写真を切り抜いても同じ物という不変性を、正例ペアの作り方に埋め込む。'),
  T('vae','変分オートエンコーダ','Variational Autoencoder','生成・表現学習','variational=分布近似で推論する|autoencoder=自己符号化器','入力ごとの潜在分布を学び、再構成と事前分布への近さを同時に最適化する生成モデル。','潜在空間からサンプルして生成できる、連続的な表現を作るため。','普通のAEが点へ写すのに対し、VAEは平均と分散を持つ雲へ写す。', ['Kingma & Welling (2013)','https://arxiv.org/abs/1312.6114']),
  T('gan','GAN','Generative Adversarial Network','生成・表現学習','generative=生成する|adversarial=敵対的|network=ネット','生成器と識別器を競わせ、生成データを本物分布へ近づけるモデル。','明示的な尤度計算なしに、鋭い標本を生成する学習信号を得るため。','偽造者と鑑定士のいたちごっこ。ただし均衡が崩れると一部の作品しか作らないmode collapseが起きる。', ['Goodfellow et al. (2014)','https://arxiv.org/abs/1406.2661']),
  T('diffusion-model','拡散モデル','Diffusion Model','生成・表現学習','diffusion=拡散・散らばり|reverse process=逆過程','データへ少しずつノイズを足す過程の逆を学び、ノイズから段階的に標本を作るモデル。','難しい一発生成を、多数の小さなノイズ除去問題へ分けるため。','インクが水へ拡散する逆再生の比喩。生成時は何段も戻るため反復計算が必要。', ['Ho, Jain & Abbeel (2020)','https://arxiv.org/abs/2006.11239']),
  T('gaussian-process','ガウス過程','Gaussian Process','数学・確率','Gaussian=ガウス分布|process=入力に沿う確率的な過程','有限個の入力での関数値が同時ガウス分布になる、関数上の確率分布。','予測平均と、観測から離れた場所の不確かさを同時に表すため。','一本の曲線でなく「あり得る関数の束」を先に置き、観測で束を絞る。'),
  T('surrogate-model','サロゲートモデル','Surrogate Model','学習の基本語','surrogate=代理人|model=模型','高価・遅い・微分不能な対象の入出力を、安い近似モデルで代行する。','多数の試行や最適化を、元の対象より速く行うため。','代理人は本人ではない。観測範囲外ではもっともらしい創作をする危険がある。'),
  T('black-box','ブラックボックス','Black Box','学習の基本語','black=中が見えない|box=箱','内部を直接利用できず、主に入力と出力から振る舞いを扱う対象。','実装非公開・複雑すぎる・物理実験など、内部へ依存できない状況を区別するため。','「説明不能」と同義ではない。開けない箱でも、実験から局所的な性質は測れる。'),

  // ── 強化学習 ──────────────────────────────────────────────
  T('reward','報酬','Reward','強化学習','reward=行動後に得る価値|return=将来報酬の合計','環境が行動結果の良さを数値で返す学習信号。','各場面の正解行動を教えず、最終目的から方策を改善するため。','報酬は目的の代理。抜け道があればエージェントは忠実に攻略してreward hackingを起こす。'),
  T('bandit','多腕バンディット','Multi-Armed Bandit','強化学習','multi-armed=複数の腕|bandit=スロット機の俗称','未知の当たり率を持つ複数選択肢から、探索と活用を両立して報酬を得る問題。','強化学習の核心である情報収集と利益獲得の競合を、状態なしで切り出すため。','複数レバーのスロット機が名前の由来。試さない腕の当たり率は永遠に分からない。'),
  T('q-learning','Q学習','Q-Learning','強化学習','Q=action-valueの品質値|learning=学習','状態と行動の組の将来価値Qを、報酬と次状態の最大価値から更新する方法。','環境モデルなしで、各場面の良い行動を学べるため。','Qはqualityの連想で説明されることが多いが、まず「状態×行動の価値表」と捉えるのが確実。'),
  T('dqn','DQN','Deep Q-Network','強化学習','deep=深層|Q=行動価値|network=近似器','Q値表の代わりにニューラルネットで行動価値を近似する手法。','画像のような巨大な状態空間でも、似た状態へ価値を一般化するため。','経験再生とターゲットネットは、動く教師を追う不安定さを和らげる二つの支え。'),
  T('policy-gradient','方策勾配','Policy Gradient','強化学習','policy=行動の選び方|gradient=改善方向','期待報酬の勾配を推定し、行動確率を直接更新する方法。','連続行動や確率的方策を、価値最大化から直接学ぶため。','良い結果へつながった行動の対数確率を太らせる。結果の偶然が大きいので分散低減が重要。'),
  T('actor-critic','Actor–Critic','Actor–Critic','強化学習','actor=行動する役|critic=評価する役','方策を更新するActorと、状態や行動の価値を見積もるCriticを組み合わせる方法。','Criticを基準線にして、方策勾配のばらつきを減らすため。','舞台の俳優と批評家の比喩。批評家は正解行動を命令せず、行動が期待より良かったかを評する。'),
  T('mcts','モンテカルロ木探索','Monte Carlo Tree Search','強化学習','Monte Carlo=乱数試行|tree search=木の探索','有望な手を深く、未探索の手も時々試し、試行結果を木へ戻して手を選ぶ探索法。','全ゲーム木を読めない状況で、探索と活用を両立するため。','Monte Carloはカジノで有名な地名から、乱数を使う計算法の呼び名になった。'),
  T('rlhf','RLHF','Reinforcement Learning from Human Feedback','強化学習','reinforcement learning=強化学習|human feedback=人の評価','人の比較評価から報酬モデルを作り、その報酬で方策を調整する枠組み。','正解文を書き尽くせない品質や好みを、比較から学習信号へ変えるため。','人の価値を完全に理解するわけではない。集めた比較と報酬モデルの範囲に依存する。'),

  // ── 説明可能AI ────────────────────────────────────────────
  T('xai','説明可能AI','Explainable AI','説明可能AI','explainable=説明できる|AI=人工知能','モデルの予測根拠や挙動を、人が調査・検証できる形にする技術群。','精度だけでは、ショートカットや不当な依存、失敗理由を発見できないため。','説明はモデルそのものではなく、別の近似や測定であることが多い。説明の忠実度も評価対象。'),
  T('lime','LIME','Local Interpretable Model-agnostic Explanations','説明可能AI','local=一点の近所|interpretable=読める|model-agnostic=モデル不問','説明したい一点の周囲でブラックボックスを線形モデルに近似し、特徴寄与を示す方法。','複雑な全体を説明せず、今の一予測の近所だけ単純化するため。','近所の広さや乱数で説明が変わり得る。地球全体でなく、その地点の接平面を見る発想。', ['Ribeiro, Singh & Guestrin (2016)','https://arxiv.org/abs/1602.04938']),
  T('shap','SHAP','SHapley Additive exPlanations','説明可能AI','SHapley=協力ゲームの配分|Additive=足し合わせる|exPlanations=説明','特徴を参加者とみなし、予測への貢献をShapley値で公平に配分する説明法。','特徴の参加順すべてを平均し、相互作用を含む貢献配分の原則を持たせるため。','SHAPの大文字は略称を作る言葉遊び。厳密計算は組合せ爆発するため近似や専用算法を使う。', ['Lundberg & Lee (2017)','https://arxiv.org/abs/1705.07874']),
];

// ===== 命名の由来（なぜその名前なのか）=====
// 用語ノートの「なぜこの名前？」欄。ここへ 1 行足すだけで、その語を載せる全ページに反映される。
//
//   テンプレ:  '<id>': '<名前の各語が何を指すか／どこから借りた語か>。<誤読しやすい点・対になる語>。',
//
// 書き方の約束:
//   - 原語の分解（parts）で言い切れることは繰り返さず、「なぜその語を選んだか」を書く。
//   - 歴史は確実なものだけ。曖昧なら「〜と説明されることが多い」と留保を付ける。
//   - COFFEE BREAK と内容が重ならないようにする（重なる場合は片方の角度を変える）。
//   - 未記入の語はこの欄ごと非表示になるので、部分的に増やしても表示は崩れない。
export const TERM_NAMING = {
  // ── 学習の基本語 ──
  'machine-learning': '人が規則を書き下す代わりに、例から規則を得る点を強調して learning と名付けた。日本語は machine=機械 / learning=学習 の直訳。',
  'supervised-learning': '日本語の「教師」は supervisor（監督者）の訳語。学習中ずっと正解を横に置ける状況を、監督者付きの作業になぞらえた名前。',
  'unsupervised-learning': 'un- を付けただけの名前で、「監督者がいない＝正解ラベルがない」と消極的に定義している。何を目指すか（構造の発見）は名前に含まれない。',
  'reinforcement-learning': '心理学の reinforcement（強化＝ある行動の起こりやすさを高める操作）から借りた語。学ぶ対象が「行動の選び方」であることを名前が示す。',
  'generative-model': '境界だけを引く discriminative（識別）モデルとの対で付いた名前。データがどう生まれる（generate）かを表す側、という役割分担を表す。',
  'model': '工学の「模型」と同じ語。実物ではなく目的に必要な性質だけを写した縮尺、という含意がそのまま数式の模型へ引き継がれている。',
  'feature': 'feature は顔立ち・目立つ特徴の意。日本語で「量」を足したのは、測って数にしたものだけがモデルへ入るから。',
  'label': '貼り札の意で、データ点に外から貼り付ける正解という関係を表す。連続値を予測するときは target（標的）と呼ぶことが多い。',
  'parameter': 'ギリシャ語 para（そばに）＋ metron（測る）。主役の変数のかたわらで形を決める量、という数学の用法をそのまま引き継いだ。',
  'hyperparameter': 'parameter の外側にあるので hyper-（上位の）。学習で決まらず人が決める、という階層関係がそのまま名前になっている。',
  'training': '動物や人の訓練と同じ語。一度で仕上げず、繰り返しと反復修正で仕上げる工程だという含みがある。',
  'inference': 'ラテン語 in-（中へ）＋ ferre（運ぶ）で、手掛かりから結論を運び込むこと。統計学の推論から借りたが、実務では学習済みモデルの実行そのものを指すことが多い。',
  'loss-function': '決定理論の loss（誤った決定で失う価値）に由来する。cost / objective / error とも呼ばれ、いずれも「下げたい量」という役割は同じ。',
  'optimizer': 'optimum（最良点）を探す仕組みの意。最良点へ到達する保証を名乗っているのではなく、探し方に付いた名前である。',
  'epoch': '天文や地質で使う「区切りとなる時点」の語。訓練の進み具合を測る単位として、全データ一巡を一区切りと定めた。',
  'batch': '工場で一度にまとめて処理する単位を指す語。1 件ずつ流す online 処理に対する呼び名として定着した。',
  'seed': '疑似乱数は出発値から決定的に育つ数列なので、その出発値を「種」と呼ぶ。同じ種からは同じ列が育つ。',
  'overfitting': 'fit は曲線を当てはめること。over- は当てはめ過ぎを指す。日本語の「過学習」は学びすぎの語感になるが、正しくは訓練データへ合わせすぎ。',
  'generalization': '個別例から一般則へ広げる generalize の名詞形。日本語の「汎」は広く行き渡るという意味。',
  'train-valid-test': 'validation は「妥当性の確認」で設定を選ぶための試験、test は最後に一度だけ使う本試験。役割分担がそのまま名前になっている。',
  'bias-variance': '統計学の bias（推定量の偏り）と variance（推定量の分散）を持ち込んだ名前。日本語では「偏り」と「ばらつき」。',
  'distribution-shift': '分布そのものがずれる現象をそのまま名にしたもの。入力側がずれる covariate shift、答え側がずれる label shift と細分される。',

  // ── 数学・確率 ──
  'tensor': 'ラテン語 tendere（張る）に由来し、もとは弾性体の張力を表す物理量の名前だった。深層学習では「多次元配列」の意味へ緩めて使う。',
  'gradient': 'ラテン語 gradus（段・歩み）から。坂の傾きを表す語をベクトル解析が採り、日本語は「勾配」と訳した。',
  'gradient-descent': '勾配の逆向きへ降りる（descent）動作をそのまま名前にした。最大化したいときは同じ手順を gradient ascent と呼ぶ。',
  'sgd': 'stochastic はギリシャ語で「狙って推し量る」が原義。全データの勾配を、標本から狙い撃ちに見積もることを指している。',
  'genetic-algorithm': '集団遺伝学の語彙を計算手順へ移植したので genetic。個体・交叉・突然変異という語が、そのまま操作の名前になっている。',
  'probability-distribution': '起こりやすさ（probability）を、あり得る値へ配って回る（distribute）ことから。合計が 1 になるのは配り切るため。',
  'likelihood': 'likely（ありそう）の名詞形。日本語の「尤」は"もっとも"の意で、もっともらしさを表す。確率と区別するために別の語が用意された。',
  'posterior': '証拠を取り込んだ「後（posterior）」の信念という意味で、取り込む前の prior（事前）と対になる。時間の前後ではなく、更新の前後を指す。',
  'entropy': '熱力学でクラウジウスが作った造語（en-＋trope＝内側の変化）。情報理論が同じ形の式を見いだし、名前ごと借りた。',
  'cross-entropy': '真の分布を、別の分布の符号で測る＝二つの分布が交差する形なので cross。両者が一致すれば通常のエントロピーへ戻る。',
  'kl-divergence': '1951 年の Kullback と Leibler の論文に由来し、二人の姓がそのまま指標名になった人名由来の典型例。',
  'softmax': '最大値だけを 1 にする hard max を滑らかにしたので soft＋max。argmax の微分可能な代用という位置づけが名前に出ている。',
  'kernel': '核・果実の中身の意。積分方程式で中心に置かれる関数を kernel と呼んだ数学の用法が、そのまま機械学習へ引き継がれた。',
  'covariance': 'co-（共に）＋ variance（分散）。1 変数の散らばりを 2 変数の連動へ広げたことが、名前だけで分かる。',
  'latent-space': 'latent は医学や心理学でいう「潜伏している」。観測できないが背後で効いている統計の latent variable（潜在変数）から来ている。',
  'embedding': '数学の embedding（ある空間を、構造を保ったまま別の空間へ入れる写像）から。離散的な記号をベクトル空間へ入れる操作をそう呼んだ。',
  'gaussian-process': 'どの有限個の点を取り出しても同時ガウス分布になるので Gaussian。process は時間発展ではなく、入力に沿って値が定まる確率的な仕組みを指す。',

  // ── ニューラルネット ──
  'forward-propagation': '信号が入力から出力へ前向き（forward）に伝わる（propagate）から。訓練時の逆伝播と対になるよう名付けられた。',
  'activation-function': '神経細胞が発火する＝活性化するという生物の比喩から。実体は非線形変換であり、発火の有無を模す必要はない。',
  'mlp': '単層パーセプトロンの限界を、層を重ねて超えたという経緯がそのまま名前になった。実体は「全結合層＋活性化」の積み重ね。',
  'perceptron': 'perceive（知覚する）＋ 装置を表す接尾辞 -tron（cyclotron などと同じ）。知覚する機械、という 1950 年代の期待が名前に表れている。',
  'linear-regression': 'linear は「パラメータについて線形」の意。特徴を二乗しても、係数の入り方が線形なら線形回帰と呼ぶ。',
  'backpropagation': 'backward propagation of errors（誤差の後ろ向き伝播）を縮めた呼び名。日本語は「誤差逆伝播（法）」と訳された。',
  'regularization': '解が一つに定まらない不良設定問題を、正則（regular）な問題へ直すという数値解析の用語から。Tikhonov 正則化がその代表。',
  'dropout': 'ユニットを一時的に抜けさせる（drop out）操作そのものが名前。学校を中退する意味とは関係がない。',
  'vanishing-gradient': '勾配が消えてなくなる（vanish）現象をそのまま名にしたもの。逆に膨れ上がる場合は exploding gradient（勾配爆発）と対で呼ぶ。',
  'batch-normalization': 'ミニバッチという軸で統計を取るので batch normalization。層方向で取れば layer norm、チャネルを束ねれば group norm と、どの軸で揃えるかが名前になる。',
  'residual-connection': '学ぶ対象を H(x) ではなく残差 F(x)=H(x)−x に置き換えたことが名前の由来。接続そのものは skip connection やショートカットとも呼ばれる。',
  'transfer-learning': '心理学の transfer of learning（学習転移＝前に学んだことが次に生きる現象）から借りた名前。',
  'knowledge-distillation': '先行研究の model compression を、蒸留の比喩で言い直した呼び名。軟らかさを決める temperature（温度）という語も、熱の比喩で揃えてある。',
  'convolution': '数学の畳み込み積分と同じ名前だが、深層学習の実装は多くの場合フィルタを反転しない相互相関である。名前と実装が少しずれている例。',

  // ── 評価・実験 ──
  'confusion-matrix': 'どのクラスをどのクラスと取り違えた（confuse）かを並べた表だから。error matrix と呼ばれることもある。',
  'precision-recall': '情報検索の用語で、precision は取り出したものの純度、recall は取り出すべきものをどれだけ思い出せたか。',
  'roc-auc': 'AUC は Area Under the Curve の頭字語で、どの曲線かは文脈による。ROC 曲線なら ROC-AUC、PR 曲線なら PR-AUC と書き分ける。',
  'cross-validation': '検証役を分割どうしで交差させる（cross）ことから。k 個に折り畳んで回すので k-fold（fold＝折り）と呼ぶ。',
  'model-evaluation': 'evaluate は value（価値）を測る語。数値計算そのものではなく、目的に照らした価値判断だという含みがある。',
  'calibration': '計器の目盛りを実測に合わせる「校正」と同じ語。確率という目盛りが現実の頻度と合うよう直すことを指す。',
  'confidence-interval': 'Neyman による命名。信頼するのは区間そのものではなく区間を作る手続きの方で、この語感のずれが誤解の元になっている。',
  'ablation': '原義は削り取ること。氷河が溶けて削れる現象にも使う語で、取り除いた後に何が失われるかで役割を測る発想が共通する。',

  // ── 古典・クラスタ ──
  'logistic-regression': 'logistic は人口増加を表すロジスティック曲線から。その S 字を確率に使うので logistic、係数を当てはめるので regression。',
  'decision-boundary': '決定（どのクラスと判定するか）が切り替わる境目、という文字通りの名前。決定面（decision surface）とも呼ぶ。',
  'decision-tree': '根から葉へ判断をたどる図が木に見えることから。計算機科学の木は根を上に描く慣習なので、絵は逆さの木になる。',
  'random-forest': '木を多数集めるので forest、乱択を効かせるので random。Breiman らによる命名で、Random Forests は登録商標でもある。',
  'gradient-boosting': 'boost は押し上げる意で、弱い学習器を押し上げて強くする boosting の系譜。そこへ「損失の勾配方向に足す」という定式化を重ねた名前。',
  'knn': '近い順に k 個の隣人（nearest neighbors）を見るから。ハイパーパラメータの記号 k が、そのまま手法名に入った例。',
  'svm': '境界を支える（support）データ点＝サポートベクトルが名前の由来。machine は当時の「学習する機械」という言い方の名残。',
  'naive-bayes': 'ベイズ則を使い、かつ特徴が条件付き独立という素朴（naive）な仮定を置くから。但し書きが名前として残った珍しい例。',
  'k-means': 'k 個の平均（means）で代表するから。代表値を実データ点にすれば k-medoids、中央値にすれば k-medians と名前が変わる。',
  'gmm': 'ガウス分布を混ぜ合わせる（mixture）モデル、という構造そのままの名前。混合の重みが各成分の割合になる。',
  'dbscan': '正式名の末尾 with Noise が要点で、全点をどれかの塊へ入れる k-means と違い、どこにも属さない点を認めることを名前で宣言している。',
  'hierarchical-clustering': '結果が入れ子（階層）構造になるから。下から併合するものを凝集型（agglomerative）、上から割るものを分枝型（divisive）と呼ぶ。',
  'som': '外から配置を指示されず、競合学習だけで格子が整っていくので「自己組織化」。提案者の名から Kohonen map とも呼ばれる。',
  'hopfield-network': '提案者 John Hopfield の姓から。物理学者らしく、状態がエネルギーの低い方へ落ちる力学系として定式化されている。',
  'anomaly-detection': 'anomaly はギリシャ語 anomalos（不揃いな）に由来し、規則から外れたものを指す。単に数値が端にある outlier（外れ値）とは含みが少し違う。',
  'pca': '分散を最も多く担う「主たる成分」から順に取り出すので principal component。principal は主要な、の意。',
  'tsne': '先行手法 SNE（Stochastic Neighbor Embedding）の低次元側に t 分布を使ったので t- を冠した。名前が改良点そのものになっている。',

  // ── 画像・系列・グラフ ──
  'rnn': '日本語では「再帰型」と訳されるが、関数が自分を呼ぶ recursive ではなく、同じ層を時刻ごとに再訪する recurrent。訳語が同じなので混同しやすい。',
  'lstm': '区切りは long (short-term memory)。重みに蓄える長期記憶ではなく、活性に載る短期記憶を長持ちさせる、という主張が名前になっている。',
  'hmm': 'マルコフ性（次は現在だけで決まる）を持つ状態が hidden（観測できない）なので hidden Markov。Markov は提案者 A. A. Markov の姓。',
  'kalman-filter': 'Rudolf Kálmán の姓と、雑音から信号を取り出す信号処理の filter から。推定なのに filter と呼ぶのは通信工学の用語法。',
  'gnn': '格子（画像）でも系列でもなくグラフを入力に取るニューラルネット、という素直な命名。畳み込みに相当する演算は graph convolution と呼ぶ。',
  'power-flow': '英語は power flow / load flow で、流れを潮の満ち引きになぞらえた「潮流」は日本語側の訳語。水流の比喩だが、実際は位相差が流れを決める。',
  'pinn': 'informed は「情報を与えられた」で、物理法則を損失として教え込まれたネットの意。法則を発見する手法ではない、と名前が示している。',

  // ── 言語モデル ──
  'word-embedding': '互いに直交して無関係な one-hot 表現に対し、距離が意味を持つ空間へ移すことを強調した名前。',
  'positional-encoding': '位置を符号（code）へ変えて足すから。固定式でなく学習で得る場合は positional embedding と呼び分けることがある。',
  'self-attention': '注意を向ける相手が別系列ではなく自分自身の系列だから self。原文と訳文をまたぐ cross-attention と対になる。',
  'transformer': '一般名詞の「変換するもの」を固有名として使った例。原論文は注意中心の構成を提案しており、名前自体に特別な由来説明は置かれていない。',
  'token': '代用貨幣やしるしを意味する token から。文字列を、モデルが数えられる「しるし」の列へ置き換えることを指す。',
  'gpt': 'pre-trained の pre- は「本番の課題より前に」の意で、事前学習＋微調整が前提だった時代の名残。微調整せず使う今も名前は当時のまま。',
  'moe': '専門家（experts）の意見を混ぜる（mixture）から。1991 年の適応的混合エキスパートに遡る古い名前で、近年は少数だけ呼ぶ疎ゲート版が主流。',
  'rag': 'Retrieval-Augmented Generation の頭字語で、「検索で補強された生成」と読む。生成に外部検索を足す構成全般を指す語として広まった。',

  // ── 生成・表現学習 ──
  'matrix-factorization': '整数の因数分解（factorization）と同じ発想で、行列を積の形へ分ける。分け方によって SVD・NMF などの名前が付く。',
  'autoencoder': 'auto- は「自動」ではなく「自分自身」。autobiography（自伝）と同じ使い方で、自分を写して自分へ戻す構造を指している。',
  'contrastive-learning': '正例と負例を対比（contrast）させて表現を作るから。日本語の「対照」は照らし合わせる意で、左右対称の「対称」ではない。',
  'vae': 'variational は変分法（関数を動かして最良を探す手法）に由来し、解けない真の事後分布を、扱える近似分布で置き換える推論法を指す。',
  'gan': '原論文 Generative Adversarial Nets の直訳。adversarial は生成器と識別器が利害の反する二人ゲーム（ミニマックス）を戦うことを指し、入力に細工をする adversarial example（敵対的サンプル）とは別概念。',
  'diffusion-model': '非平衡熱力学の拡散過程を借りた名前。データが少しずつ散らばる前向き過程と、その逆をたどる生成過程を同じ言葉で扱う。',
  'surrogate-model': 'surrogate は代理母（surrogate mother）と同じ語で、本人の代わりを務めるもの。分野によっては metamodel、応答曲面とも呼ばれる。',
  'black-box': '中身を問わず入出力だけを見る箱、という工学の言い方。対義語は内部が見える white box / glass box。',

  // ── 強化学習 ──
  'reward': '行動の後に与える価値、という心理学の語をそのまま使う。目的そのものではなく目的の代理指標だという但し書きは、名前には現れない。',
  'bandit': 'スロットマシンの俗称 one-armed bandit（レバー 1 本で金を奪う「片腕の追い剥ぎ」）が元。腕を増やして multi-armed とした言葉遊びである。',
  'q-learning': '学習する対象が行動価値関数 Q そのものだから Q-learning。表で持てば tabular Q-learning、ネットで近似すれば DQN と名前が変わる。',
  'dqn': 'Deep（深層ネットで近似する）＋ Q-Network の合成。Q の表をネットへ置き換えた、という一点だけを名前が言っている。',
  'policy-gradient': '価値ではなく方策（policy）のパラメータについて勾配を取るから。日本語の「方策」は policy の訳語で、政治の政策とは無関係。',
  'actor-critic': '演じる側（actor）と批評する側（critic）という劇場の比喩。1983 年の Barto らの研究で使われた呼び方が定着した。',
  'mcts': '乱数を使う計算法の総称 Monte Carlo と、木を探索する tree search の合成。ロールアウトで乱数を振る点と、木を伸ばす点の両方が名前に入っている。',
  'rlhf': '報酬をどこから得るかを名前で明示した例。人の評価なら RLHF、AI の評価に置き換えれば RLAIF と呼び分ける。',

  // ── 説明可能AI ──
  'xai': 'explainable AI の訳で、2016 年ごろの研究計画名を通じて広まった呼称。interpretable（解釈可能）との使い分けは論者によって揺れる。',
  'lime': 'Local Interpretable Model-agnostic Explanations の頭字語。局所・読める・モデル不問という三つの設計方針が、名前に畳み込まれている。',
  'shap': 'Shapley 値（協力ゲーム理論）と additive（加法的）な説明を掛け合わせた造語。LIME などの既存手法を「加法的な説明」という枠で統一した、という主張が名前に入っている。',
};

TERM_NOTES.forEach(term => { term.naming = TERM_NAMING[term.id] || null; });

export const PAGE_TERMS = {
  'viz/map.html':['machine-learning','supervised-learning','unsupervised-learning'],
  'viz/foundations.html':['tensor','gradient','probability-distribution','cross-entropy'],
  'viz/gradient.html':['gradient-descent','sgd','optimizer'],
  'viz/ga.html':['genetic-algorithm','optimizer','hyperparameter'],
  'viz/surrogate.html':['surrogate-model','gaussian-process','black-box','kernel'],
  'viz/surrogate2.html':['surrogate-model','black-box','generalization'],
  'viz/gp.html':['gaussian-process','kernel','covariance','posterior'],
  'viz/index.html':['forward-propagation','parameter','activation-function'],
  'viz/perceptron.html':['perceptron','decision-boundary','supervised-learning'],
  'viz/linreg.html':['linear-regression','loss-function','gradient-descent'],
  'viz/backprop.html':['backpropagation','gradient','forward-propagation'],
  'viz/reg.html':['regularization','overfitting','generalization'],
  'viz/dropout.html':['dropout','regularization','inference'],
  'viz/vanishing.html':['vanishing-gradient','backpropagation','activation-function'],
  'viz/batchnorm.html':['batch-normalization','batch','inference'],
  'viz/resnet.html':['residual-connection','vanishing-gradient','backpropagation'],
  'viz/transfer.html':['transfer-learning','training','generalization'],
  'viz/distill.html':['knowledge-distillation','softmax','probability-distribution'],
  'viz/logreg.html':['logistic-regression','decision-boundary','cross-entropy'],
  'viz/classify.html':['decision-boundary','softmax','supervised-learning'],
  'viz/digit.html':['convolution','feature','xai'],
  'viz/metrics.html':['confusion-matrix','precision-recall','roc-auc'],
  'viz/crossval.html':['cross-validation','train-valid-test','overfitting'],
  'viz/evaluation.html':['model-evaluation','calibration','confidence-interval','ablation'],
  'viz/dtree.html':['decision-tree','feature','overfitting'],
  'viz/forest.html':['random-forest','decision-tree','bias-variance'],
  'viz/boosting.html':['gradient-boosting','decision-tree','loss-function'],
  'viz/knn.html':['knn','feature','decision-boundary'],
  'viz/svm.html':['svm','kernel','decision-boundary'],
  'viz/naivebayes.html':['naive-bayes','likelihood','posterior'],
  'viz/cnn.html':['convolution','feature','parameter'],
  'viz/rnn.html':['rnn','backpropagation','vanishing-gradient'],
  'viz/lstm.html':['lstm','rnn','vanishing-gradient'],
  'viz/hmm.html':['hmm','probability-distribution','inference'],
  'viz/kalman.html':['kalman-filter','covariance','posterior'],
  'viz/gnn.html':['gnn','feature','supervised-learning'],
  'viz/gnnflow.html':['power-flow','gnn','surrogate-model'],
  'viz/pinn.html':['pinn','loss-function','gradient'],
  'viz/word2vec.html':['word-embedding','embedding','unsupervised-learning'],
  'viz/positional.html':['positional-encoding','embedding','self-attention'],
  'viz/attention.html':['self-attention','softmax','embedding'],
  'viz/transformer.html':['transformer','self-attention','positional-encoding'],
  'viz/moe.html':['moe','transformer','parameter'],
  'viz/rag.html':['rag','embedding','generative-model'],
  'viz/kmeans.html':['k-means','unsupervised-learning','seed'],
  'viz/gmm.html':['gmm','likelihood','posterior'],
  'viz/dbscan.html':['dbscan','unsupervised-learning','hyperparameter'],
  'viz/hierarchical.html':['hierarchical-clustering','unsupervised-learning','feature'],
  'viz/som.html':['som','unsupervised-learning','embedding'],
  'viz/hopfield.html':['hopfield-network','rnn','loss-function'],
  'viz/anomaly.html':['anomaly-detection','unsupervised-learning','roc-auc'],
  'viz/pca.html':['pca','covariance','embedding'],
  'viz/tsne.html':['tsne','embedding','seed'],
  'viz/recommend.html':['matrix-factorization','latent-space','embedding'],
  'viz/autoencoder.html':['autoencoder','latent-space','unsupervised-learning'],
  'viz/contrastive.html':['contrastive-learning','embedding','cross-entropy'],
  'viz/vae.html':['vae','latent-space','kl-divergence'],
  'viz/gan.html':['gan','generative-model','probability-distribution'],
  'viz/diffusion.html':['diffusion-model','generative-model','probability-distribution'],
  'viz/bandit.html':['bandit','reward','seed'],
  'viz/qlearning.html':['q-learning','reward','reinforcement-learning'],
  'viz/dqn.html':['dqn','q-learning','reinforcement-learning'],
  'viz/policygrad.html':['policy-gradient','reward','reinforcement-learning'],
  'viz/actorcritic.html':['actor-critic','policy-gradient','reward'],
  'viz/mcts.html':['mcts','reinforcement-learning','reward'],
  'viz/rlhf.html':['rlhf','reward','kl-divergence'],
  'viz/dronerace.html':['reinforcement-learning','actor-critic','reward'],
  'viz/dronerace2.html':['distribution-shift','generalization','reinforcement-learning'],
  'viz/xai.html':['xai','feature','black-box'],
  'viz/lime.html':['lime','xai','surrogate-model'],
  'viz/shap.html':['shap','xai','feature'],
  'viz/mlp3d.html':['mlp','tensor','forward-propagation'],
  'viz/cnn3d.html':['convolution','tensor','feature'],
  'viz/rnn3d.html':['rnn','tensor','backpropagation'],
  'viz/attention3d.html':['self-attention','tensor','softmax'],
  'viz/gpt3d.html':['gpt','transformer','self-attention'],
  'gpt2/index.html':['gpt','token','inference','self-attention'],
};

export function termById(id) {
  return TERM_NOTES.find(term => term.id === id) || null;
}

export function termsForPage(path) {
  return (PAGE_TERMS[path] || []).map(termById).filter(Boolean);
}
