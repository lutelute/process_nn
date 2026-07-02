// viz/ 共有ナビゲーション — 各ページ上部の .nav を「カテゴリで畳む」方式に統一する。
// 各ビューアは <script src="nav.js"></script> を読み込むだけ。現在ページのカテゴリだけ展開し、
// 他カテゴリは名前だけ表示（クリックでその場に展開・再読込なし）。カテゴリ分けはトップ index.html の
// STEP 分類に一致させ、「トップは推奨順路に絞れているのにナビだけ49個をベタ列で全展開」という
// 矛盾を解消する。nav.js は全 48 ページが読み込む唯一の共有 JS＝ここ 1 ファイルで全ページに効く。
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

  // ===== アクセシビリティ底上げ（全ビューア一括） =====
  // nav.js は全 48 ページが読み込む唯一の共有 JS。ここで横断的に最低ラインを底上げする
  // （inline <style>/theme.css より後勝ちの注入で、どのページにも確実に届く）。
  (function injectA11yStyles(){
    if (document.getElementById('a11yfmt')) return;
    const css =
      // ① 二次テキストのコントラスト：旧 #928f84 は背景 #faf8f1 上で約 3.0:1（AA 未満）。
      //    暖色味を残したまま約 5:1 まで暗色化して通常テキスト AA(4.5:1) を満たす。
      ':root{--faint:#6e6a60;--ink-3:#6e6a60;}'
      // ② キーボードフォーカスを可視化（マウス操作では出さない）。
      + ':focus-visible{outline:2px solid var(--accent,#1f9e8a);outline-offset:2px;border-radius:2px;}'
      + '.stp:focus-visible{outline-offset:-2px;}'
      // ③ 前庭障害への配慮：CSS のアニメ/トランジションを抑制（canvas 内 rAF は JS 側フラグで各自対応）。
      + '@media (prefers-reduced-motion: reduce){*,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important;scroll-behavior:auto!important;}}';
    const s = document.createElement('style');
    s.id = 'a11yfmt'; s.textContent = css;
    (document.head || document.documentElement).appendChild(s);
  })();
  // canvas 内の requestAnimationFrame 駆動アニメは CSS では止まらないため、各ビューアが参照できる判定を公開。
  try { window.__prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  catch (e) { window.__prefersReducedMotion = false; }

  // ===== ナビ（カテゴリ折りたたみ）の見た目 =====
  // どのページでも成立するよう、色は var(--x, フォールバック) で受ける（theme.css 非読込でも壊れない）。
  // 後勝ち（head 末尾に append）で inline <style>/theme.css の .nav も上書きする。
  (function injectNavStyles(){
    if (document.getElementById('navfmt')) return;
    const css =
      '.nav{font-size:11px;line-height:1.7;letter-spacing:.03em;}'
      + '.nav .navhead{margin-bottom:8px;}'
      + '.nav .navhead a,.nav .navhead b{margin-right:16px;font-weight:600;text-decoration:none;color:var(--ink-2,#52504a);}'
      + '.nav .navhead a:hover{color:var(--ink,#1a1a17);text-decoration:underline;}'
      + '.nav .navhead b{color:var(--ink,#1a1a17);}'
      // 上段＝均一な分野タイル列（領域マップ）。各タイル＝枠付きの1領域。折り返し可。
      + '.nav .navcats{display:flex;flex-wrap:wrap;gap:5px;}'
      + '.nav button.navcat{font-family:inherit;font-size:11px;letter-spacing:.03em;color:var(--ink-2,#52504a);background:var(--panel,#fff);border:1px solid var(--rule,#dcd8cc);border-radius:2px;padding:3px 9px;cursor:pointer;white-space:nowrap;}'
      + '.nav button.navcat:hover{color:var(--ink,#1a1a17);border-color:var(--ink-3,#928f84);}'
      + '.nav button.navcat[aria-selected="true"]{color:var(--ink,#1a1a17);font-weight:700;border-color:var(--ink,#1a1a17);background:var(--panel-2,#f2efe6);}'  // 表示中
      + '.nav button.navcat.cur{box-shadow:inset 3px 0 0 var(--accent,#1f9e8a);padding-left:11px;}'  // いまここ（左に細アクセント）
      + '.nav .navcat-n{color:var(--faint,#6e6a60);font-weight:400;letter-spacing:0;margin-left:1px;}'
      // 下段＝選択中分野の手法パネル。1px罫線で上段と分ける。
      + '.nav .navpanel{margin-top:7px;padding-top:6px;border-top:1px solid var(--rule,#dcd8cc);white-space:normal;color:var(--faint,#6e6a60);}'
      + '.nav .navpanel-cat{color:var(--ink,#1a1a17);font-weight:700;}'
      + '.nav .navpanel-arw{color:var(--ink-3,#928f84);margin:0 7px 0 4px;}'
      + '.nav .navpanel-hint{color:var(--faint,#6e6a60);font-style:italic;}'
      + '.nav .navpanel a{color:var(--ink-2,#52504a);text-decoration:none;white-space:nowrap;}'
      + '.nav .navpanel a:hover{color:var(--ink,#1a1a17);text-decoration:underline;}'
      + '.nav .navpanel .cur{color:var(--ink,#1a1a17);font-weight:700;white-space:nowrap;}'
      + '.nav .navpanel .sep{color:var(--faint,#6e6a60);margin:0 2px;}'
      // ページ末尾の学習順路フッター（前後のテーマ）。ステップUIの「次へ」と区別する文言にする。
      + '.navfoot{display:flex;justify-content:space-between;align-items:baseline;gap:14px;flex-wrap:wrap;margin-top:30px;padding-top:12px;border-top:1px solid var(--rule,#dcd8cc);font-size:12.5px;letter-spacing:.02em;}'
      + '.navfoot a{text-decoration:none;}'
      + '.navfoot .navfoot-prev{color:var(--ink-3,#6e6a60);}'
      + '.navfoot .navfoot-next{color:var(--accent,#1f9e8a);font-weight:700;}'
      + '.navfoot a:hover{text-decoration:underline;color:var(--ink,#1a1a17);}';
    const s = document.createElement('style');
    s.id = 'navfmt'; s.textContent = css;
    (document.head || document.documentElement).appendChild(s);
  })();

  // カテゴリ定義。トップ index.html の STEP 分類（STEP1〜8＋3D 補足）に一致させている。
  // 各カテゴリ内は「前提 → 応用」の順。手法マップ(map.html)と地図(../)は常時表示のヘッダに置く。
  const cats = [
    { name: '基礎', items: [
      { href: 'gradient.html',    label: '勾配降下' },
      { href: 'ga.html',          label: '遺伝的AL' },
      { href: 'index.html',       label: '信号の流れ' },
      { href: 'perceptron.html',  label: 'パーセプトロン' },
      { href: 'linreg.html',      label: '線形回帰' },
      { href: 'backprop.html',    label: '逆伝播' },
    ]},
    { name: '訓練・正則化', items: [
      { href: 'reg.html',         label: '正則化' },
      { href: 'dropout.html',     label: 'ドロップアウト' },
      { href: 'vanishing.html',   label: '勾配消失' },
      { href: 'batchnorm.html',   label: 'バッチ正規化' },
    ]},
    { name: '分類', items: [
      { href: 'logreg.html',      label: 'ロジスティック回帰' },
      { href: 'classify.html',    label: '決定境界' },
      { href: 'digit.html',       label: '数字認識' },
      { href: 'metrics.html',     label: '評価指標' },
    ]},
    { name: '木・カーネル', items: [
      { href: 'dtree.html',       label: '決定木' },
      { href: 'forest.html',      label: 'ランダムフォレスト' },
      { href: 'boosting.html',    label: '勾配ブースティング' },
      { href: 'knn.html',         label: 'kNN' },
      { href: 'svm.html',         label: 'SVM' },
      { href: 'naivebayes.html',  label: 'ナイーブベイズ' },
    ]},
    { name: '画像・系列', items: [
      { href: 'cnn.html',         label: 'CNN' },
      { href: 'rnn.html',         label: 'RNN' },
      { href: 'lstm.html',        label: 'LSTM' },
    ]},
    { name: '言語', items: [
      { href: 'word2vec.html',    label: '単語埋め込み' },
      { href: 'positional.html',  label: '位置エンコーディング' },
      { href: 'attention.html',   label: '自己注意' },
      { href: 'transformer.html', label: 'Transformer' },
      { href: '../gpt2/',         label: 'GPT-2' },
      { href: 'rag.html',         label: 'RAG' },
    ]},
    { name: 'クラスタ', items: [
      { href: 'kmeans.html',      label: 'k-means' },
      { href: 'gmm.html',         label: 'GMM' },
      { href: 'dbscan.html',      label: 'DBSCAN' },
      { href: 'som.html',         label: 'SOM' },
      { href: 'hopfield.html',    label: 'Hopfield' },
    ]},
    { name: '次元・生成', items: [
      { href: 'pca.html',         label: 'PCA' },
      { href: 'tsne.html',        label: 't-SNE' },
      { href: 'autoencoder.html', label: 'オートエンコーダ' },
      { href: 'contrastive.html', label: '対照学習' },
      { href: 'vae.html',         label: 'VAE' },
      { href: 'gan.html',         label: 'GAN' },
      { href: 'diffusion.html',   label: '拡散モデル' },
    ]},
    { name: '強化', items: [
      { href: 'qlearning.html',   label: 'Q学習' },
      { href: 'dqn.html',         label: 'DQN' },
    ]},
    { name: '3D構造', items: [
      { href: 'mlp3d.html',       label: 'MLP(3D)' },
      { href: 'cnn3d.html',       label: 'CNN(3D)' },
      { href: 'rnn3d.html',       label: 'RNN(3D)' },
      { href: 'attention3d.html', label: 'Attention(3D)' },
      { href: 'gpt3d.html',       label: 'GPT(3D)' },
    ]},
  ];

  let cur = location.pathname.split('/').pop();
  if (cur === '') cur = 'index.html';

  // 分野タイル（タブ）1個。active=下パネルに手法を表示中／isCur=現在ページの分野（常時「いまここ」印）。
  function tileHtml(cat, i, active, isCur) {
    return '<button type="button" class="navcat' + (isCur ? ' cur' : '') + '" role="tab" data-i="' + i + '"'
      + ' aria-selected="' + (active ? 'true' : 'false') + '" tabindex="' + (active ? '0' : '-1') + '">'
      + cat.name + '<span class="navcat-n">·' + cat.items.length + '</span>'
      + '</button>';
  }
  // 1分野の手法リスト（現在ページは太字・非リンク）。
  function catItemsHtml(cat) {
    return cat.items.map(function (p) {
      if (p.href === cur) return '<b class="cur">' + p.label + '</b>';
      return '<a href="' + p.href + '">' + p.label + '</a>';
    }).join(' <span class="sep">·</span> ');
  }
  // タイル下のパネル：選択中の分野名＋手法一覧。
  function panelHtml(idx) {
    if (idx < 0) return '<span class="navpanel-hint">分野を選ぶと手法が並びます。</span>';
    return '<span class="navpanel-cat">' + cats[idx].name + '</span>'
      + '<span class="navpanel-arw">›</span> ' + catItemsHtml(cats[idx]);
  }

  function render() {
    const el = document.querySelector('.nav, .back');
    if (!el) return;
    // 現在ページが属する分野を特定（無ければ = map.html 等はパネル空）。
    let curCat = -1;
    cats.forEach(function (c, i) {
      if (c.items.some(function (p) { return p.href === cur; })) curCat = i;
    });
    const head = '<div class="navhead">'
      + '<a href="../">▲ 地図（トップ）</a>'
      + (cur === 'map.html' ? '<b>手法マップ</b>' : '<a href="map.html">手法マップ</a>')
      + '</div>';
    // 上＝均一な分野タイル列（領域マップ）／下＝選択中分野の手法パネル。構造を上下に分ける。
    const tiles = cats.map(function (c, i) { return tileHtml(c, i, i === curCat, i === curCat); }).join('');
    const body = '<div class="navcats" role="tablist" aria-label="分野">' + tiles + '</div>'
      + '<div class="navpanel">' + panelHtml(curCat) + '</div>';
    el.innerHTML = head + body;

    // タイルのクリック／←→キーで、下パネルにその分野の手法を表示（イベント委譲・1回だけ束縛）。
    if (!el.dataset.navbound) {
      el.dataset.navbound = '1';
      var activate = function (btn, focus) {
        el.querySelectorAll('.navcat').forEach(function (b) { b.setAttribute('aria-selected', 'false'); b.setAttribute('tabindex', '-1'); });
        btn.setAttribute('aria-selected', 'true'); btn.setAttribute('tabindex', '0');
        var panel = el.querySelector('.navpanel');
        if (panel) panel.innerHTML = panelHtml(+btn.getAttribute('data-i'));
        if (focus) btn.focus();
      };
      el.addEventListener('click', function (e) {
        var btn = e.target && e.target.closest ? e.target.closest('.navcat') : null;
        if (btn && el.contains(btn)) activate(btn, false);
      });
      el.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        var btn = e.target && e.target.closest ? e.target.closest('.navcat') : null;
        if (!btn || !el.contains(btn)) return;
        e.preventDefault();
        var list = Array.prototype.slice.call(el.querySelectorAll('.navcat'));
        var next = list[list.indexOf(btn) + (e.key === 'ArrowRight' ? 1 : -1)];
        if (next) activate(next, true);
      });
    }
  }

  // ===== DOM 強化：canvas を画像として読み上げ可能に＋ステッパーをキーボード操作可能に =====
  function enhanceA11y() {
    // ① 主役の <canvas> に代替テキスト。描画には一切影響しない（属性付与のみ）。
    const title = ((document.querySelector('h1') || {}).textContent || document.title || '可視化').trim();
    document.querySelectorAll('canvas').forEach(function (cv) {
      if (!cv.getAttribute('role')) cv.setAttribute('role', 'img');
      if (!cv.getAttribute('aria-label')) cv.setAttribute('aria-label', title + ' — 図（Canvas による可視化）');
    });

    // ② div 製ステッパーを role=tablist/tab 化し、Enter/Space/矢印で操作可能に。
    //    renderStepper が innerHTML を作り直す／class だけ差し替えるページの両方に追従する。
    function decorate(stepper) {
      if (stepper.getAttribute('role') !== 'tablist') stepper.setAttribute('role', 'tablist');
      stepper.querySelectorAll('.stp').forEach(function (stp) {
        stp.setAttribute('role', 'tab');
        if (stp.getAttribute('tabindex') === null) stp.setAttribute('tabindex', '0');
        stp.setAttribute('aria-selected', stp.classList.contains('active') ? 'true' : 'false'); // 状態は毎回同期
        if (stp.dataset.a11y) return;            // キーボードハンドラは一度だけ付与（冪等）
        stp.dataset.a11y = '1';
        stp.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); stp.click(); }
          else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            e.preventDefault();
            const list = Array.prototype.slice.call(stepper.querySelectorAll('.stp'));
            const next = list[list.indexOf(stp) + (e.key === 'ArrowRight' ? 1 : -1)];
            if (next) next.focus();
          }
        });
      });
    }
    document.querySelectorAll('.stepper').forEach(function (stepper) {
      decorate(stepper);
      // childList=innerHTML 作り直し / class 変更=active 切替 の両方を監視。
      // 付与するのは role/aria-selected/tabindex/data-* のみ（class は書かない）→ 自己再発火しない。
      try {
        new MutationObserver(function () { decorate(stepper); })
          .observe(stepper, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
      } catch (e) { /* 古い環境では監視なしでも初期装飾は効く */ }
    });
  }

  // ===== 学習順路フッター =====
  // cats のフラット順＝「前提 → 応用」の学習順路（トップの推奨順路＋カテゴリ依存順と同じ並び）。
  // 「読み終えたら次はどこへ」をページ下端で示す。ステップUIの「次へ」との混同を避けるため
  // 文言は「次のテーマ」。map.html など順路に無いページには出さない。
  function injectFooterNav() {
    if (document.querySelector('.navfoot')) return;
    const flat = [];
    cats.forEach(function (c) { c.items.forEach(function (p) { flat.push(p); }); });
    const idx = flat.map(function (p) { return p.href; }).indexOf(cur);
    if (idx < 0) return;
    const prev = flat[idx - 1], next = flat[idx + 1];
    const el = document.createElement('div');
    el.className = 'navfoot';
    el.innerHTML =
      (prev ? '<a class="navfoot-prev" href="' + prev.href + '">← 前のテーマ：' + prev.label + '</a>' : '<span></span>')
      + (next ? '<a class="navfoot-next" href="' + next.href + '">次のテーマ：' + next.label + ' →</a>'
              : '<a class="navfoot-next" href="../">🎉 全テーマ完走 — 地図に戻る →</a>');
    (document.querySelector('.wrap') || document.body).appendChild(el);
  }

  function init() { render(); enhanceA11y(); injectFooterNav(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
