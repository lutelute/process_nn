// viz/ 共有ナビゲーション — 各ページの .nav / .back を同一の完全ナビに統一する。
// 各ビューアは <script src="nav.js"></script> を読み込むだけ。現在ページを強調表示。
(function () {
  // ===== 数式の見た目を全ビューア一括で改善（教科書品質） =====
  // 各ビューアの inline `.eq{font-family:mono}` を body .eq の詳細度で上書きし、
  // セリフ＋斜体変数に。分数 .frac / 根号 .rad / 変数 .mvar も全ページで使える。
  (function injectMath(){
    if (document.getElementById('mathfmt')) return;
    const css =
      'body .eq{font-family:"STIX Two Math","Cambria Math","TeX Gyre Termes Math",Georgia,"Times New Roman",serif;font-size:15.5px;letter-spacing:.2px;line-height:2.05;}'
      + '.eq i,.eq var,.mvar{font-style:italic;}'
      + '.eq b{font-weight:600;}'
      + '.eq .op{font-style:normal;padding:0 .12em;opacity:.85;}'
      + '.frac{display:inline-flex;flex-direction:column;vertical-align:-0.55em;text-align:center;margin:0 .22em;line-height:1.22;}'
      + '.frac>span:first-child{border-bottom:1.4px solid currentColor;padding:0 .45em 1px;}'
      + '.frac>span:last-child{padding:1px .45em 0;}'
      + '.rad{border-top:1.4px solid currentColor;padding:0 .3em;margin-left:.06em;}'
      + '.rad::before{content:"\\221A";margin-left:-.52em;margin-right:.02em;}'
      + '.mvec{font-weight:600;font-style:italic;}';
    const s = document.createElement('style');
    s.id = 'mathfmt'; s.textContent = css;
    (document.head || document.documentElement).appendChild(s);
  })();

  const pages = [
    // ロードマップ順（基礎→応用）。トップの「学習ロードマップ」と同じ並び。
    { href: 'gradient.html',    label: '勾配降下' },
    { href: 'ga.html',          label: '遺伝的AL' },
    { href: 'index.html',       label: '信号の流れ' },
    { href: 'perceptron.html',  label: 'パーセプトロン' },
    { href: 'linreg.html',      label: '線形回帰' },
    { href: 'backprop.html',    label: '逆伝播' },
    { href: 'reg.html',         label: '正則化' },
    { href: 'dropout.html',     label: 'ドロップアウト' },
    { href: 'vanishing.html',   label: '勾配消失' },
    { href: 'batchnorm.html',   label: 'バッチ正規化' },
    { href: 'logreg.html',      label: 'ロジスティック回帰' },
    { href: 'classify.html',    label: '決定境界' },
    { href: 'digit.html',       label: '数字認識' },
    { href: 'metrics.html',     label: '評価指標' },
    { href: 'dtree.html',       label: '決定木' },
    { href: 'forest.html',      label: 'ランダムフォレスト' },
    { href: 'boosting.html',    label: '勾配ブースティング' },
    { href: 'knn.html',         label: 'kNN' },
    { href: 'svm.html',         label: 'SVM' },
    { href: 'naivebayes.html',  label: 'ナイーブベイズ' },
    { href: 'cnn.html',         label: 'CNN' },
    { href: 'rnn.html',         label: 'RNN' },
    { href: 'word2vec.html',    label: '単語埋め込み' },
    { href: 'positional.html',  label: '位置エンコーディング' },
    { href: 'attention.html',   label: '自己注意' },
    { href: 'transformer.html', label: 'Transformer' },
    { href: '../gpt2/',         label: 'GPT-2' },
    { href: 'kmeans.html',      label: 'k-means' },
    { href: 'gmm.html',         label: 'GMM' },
    { href: 'dbscan.html',      label: 'DBSCAN' },
    { href: 'som.html',         label: 'SOM' },
    { href: 'hopfield.html',    label: 'Hopfield' },
    { href: 'pca.html',         label: 'PCA' },
    { href: 'tsne.html',        label: 't-SNE' },
    { href: 'autoencoder.html', label: 'オートエンコーダ' },
    { href: 'vae.html',         label: 'VAE' },
    { href: 'qlearning.html',   label: 'Q学習' },
    { href: 'mlp3d.html',       label: 'MLP(3D)' },
    { href: 'cnn3d.html',       label: 'CNN(3D)' },
    { href: 'rnn3d.html',       label: 'RNN(3D)' },
    { href: 'attention3d.html', label: 'Attention(3D)' },
    { href: 'gpt3d.html',       label: 'GPT(3D)' },
  ];
  let cur = location.pathname.split('/').pop();
  if (cur === '') cur = 'index.html';

  function render() {
    const el = document.querySelector('.nav, .back');
    if (!el) return;
    const faint = getComputedStyle(document.documentElement).getPropertyValue('--faint').trim() || '#46566b';
    const text = getComputedStyle(document.documentElement).getPropertyValue('--text').trim() || '#e7edf5';
    // 区切りの前後に半角空白を入れて改行機会を作る（狭い画面で ASCII ラベル連結が
    // 折り返せず横はみ出すのを防ぐ）。各ラベルは nowrap で内部分割しない。
    const sep = ' <span style="color:' + faint + ';margin:0 3px;">·</span> ';
    const items = pages.map(function (p) {
      if (p.href === cur) return '<span style="color:' + text + ';font-weight:600;white-space:nowrap;">' + p.label + '</span>';
      return '<a href="' + p.href + '" style="white-space:nowrap;">' + p.label + '</a>';
    });
    // 末尾に「← 地図（トップ）」
    items.push('<a href="../" style="white-space:nowrap;">← 地図</a>');
    el.innerHTML = items.join(sep);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
  else render();
})();
