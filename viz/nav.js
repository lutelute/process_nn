// viz/ 共有ナビゲーション — 各ページの .nav / .back を同一の完全ナビに統一する。
// 各ビューアは <script src="nav.js"></script> を読み込むだけ。現在ページを強調表示。
(function () {
  const pages = [
    // ロードマップ順（基礎→応用）。トップの「学習ロードマップ」と同じ並び。
    { href: 'gradient.html',    label: '勾配降下' },
    { href: 'ga.html',          label: '遺伝的AL' },
    { href: 'index.html',       label: '信号の流れ' },
    { href: 'linreg.html',      label: '線形回帰' },
    { href: 'backprop.html',    label: '逆伝播' },
    { href: 'classify.html',    label: '決定境界' },
    { href: 'digit.html',       label: '数字認識' },
    { href: 'dtree.html',       label: '決定木' },
    { href: 'knn.html',         label: 'kNN' },
    { href: 'svm.html',         label: 'SVM' },
    { href: 'naivebayes.html',  label: 'ナイーブベイズ' },
    { href: 'cnn.html',         label: 'CNN' },
    { href: 'rnn.html',         label: 'RNN' },
    { href: 'attention.html',   label: '自己注意' },
    { href: 'transformer.html', label: 'Transformer' },
    { href: '../gpt2/',         label: 'GPT-2' },
    { href: 'kmeans.html',      label: 'k-means' },
    { href: 'gmm.html',         label: 'GMM' },
    { href: 'som.html',         label: 'SOM' },
    { href: 'hopfield.html',    label: 'Hopfield' },
    { href: 'pca.html',         label: 'PCA' },
    { href: 'tsne.html',        label: 't-SNE' },
    { href: 'autoencoder.html', label: 'オートエンコーダ' },
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
    const sep = '<span style="color:' + faint + ';margin:0 6px;">·</span>';
    const items = pages.map(function (p) {
      if (p.href === cur) return '<span style="color:' + text + ';font-weight:600;">' + p.label + '</span>';
      return '<a href="' + p.href + '">' + p.label + '</a>';
    });
    // 末尾に「← 地図（トップ）」
    items.push('<a href="../">← 地図</a>');
    el.innerHTML = items.join(sep);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
  else render();
})();
