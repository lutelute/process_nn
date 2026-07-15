// すべての教材ページへ「このノートの用語」ドロワーを追加する共有UI。
// データは ESM に分離し、中央Wikiと同じ112語を参照する。
(function () {
  if (window.__termNotesMounted) return;
  window.__termNotesMounted = true;

  const ownScript = document.currentScript;
  if (!ownScript || !ownScript.src) return;
  const vizBase = new URL('./', ownScript.src);
  const wikiUrl = new URL('terms.html', vizBase);
  const dataUrl = new URL('lib/term-notes.mjs', vizBase);

  function pageKey() {
    const path = location.pathname;
    const vizAt = path.lastIndexOf('/viz/');
    if (vizAt >= 0) return 'viz/' + (path.slice(vizAt + 5) || 'index.html');
    const gptAt = path.lastIndexOf('/gpt2/');
    if (gptAt >= 0) return 'gpt2/' + (path.slice(gptAt + 6) || 'index.html');
    return '';
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function injectStyles() {
    if (document.getElementById('term-notes-style')) return;
    const style = document.createElement('style');
    style.id = 'term-notes-style';
    style.textContent = `
      .tn-trigger{position:fixed;right:18px;bottom:18px;z-index:9997;display:flex;align-items:center;gap:7px;
        padding:9px 12px;background:var(--ink,#1a1a17);color:#fff;border:1px solid var(--ink,#1a1a17);
        border-radius:2px;font:700 12px/1.2 var(--gothic,system-ui,sans-serif);box-shadow:0 4px 18px rgba(26,26,23,.16);}
      .tn-trigger:hover:not(:disabled){background:#000;color:#fff}.tn-trigger .tn-count{font:500 10px/1 var(--mono,monospace);
        border:1px solid rgba(255,255,255,.55);padding:2px 4px;border-radius:2px}
      .tn-drawer[hidden]{display:none!important}.tn-drawer{position:fixed;z-index:9998;right:0;top:0;width:min(430px,100%);
        height:100dvh;overflow:auto;background:var(--bg,#faf8f1);color:var(--ink,#1a1a17);border-left:1px solid var(--ink,#1a1a17);
        box-shadow:-10px 0 30px rgba(26,26,23,.13);padding:20px 18px 30px;font-family:var(--gothic,system-ui,sans-serif)}
      .tn-head{position:sticky;top:-20px;z-index:1;background:var(--bg,#faf8f1);display:flex;justify-content:space-between;
        align-items:flex-start;gap:12px;padding:20px 0 12px;border-bottom:1px solid var(--ink,#1a1a17);margin-bottom:12px}
      .tn-kicker{font:700 10px/1.4 var(--mono,monospace);letter-spacing:.14em;color:var(--accent,#1f9e8a)}
      .tn-title{font-size:18px;line-height:1.4;margin:3px 0 0}.tn-close{flex:none;width:32px;height:32px;padding:0;
        background:transparent;color:var(--ink,#1a1a17);border:1px solid var(--rule,#dcd8cc);font-size:18px}
      .tn-intro{font-size:12px;line-height:1.75;color:var(--ink-2,#52504a);margin:0 0 12px}
      .tn-card{background:var(--panel,#fff);border:1px solid var(--rule,#dcd8cc);border-radius:2px;margin:8px 0;padding:0}
      .tn-card summary{list-style:none;cursor:pointer;padding:11px 12px;display:flex;justify-content:space-between;align-items:baseline;gap:10px}
      .tn-card summary::-webkit-details-marker{display:none}.tn-card summary::after{content:'＋';color:var(--accent,#1f9e8a);font-family:var(--mono,monospace)}
      .tn-card[open] summary::after{content:'−'}.tn-term{font-weight:700;font-size:14px}.tn-en{font:10px/1.4 var(--mono,monospace);
        color:var(--ink-3,#6e6a60);text-align:right}.tn-body{padding:0 12px 13px;border-top:1px dashed var(--rule,#dcd8cc)}
      .tn-parts{display:flex;flex-wrap:wrap;gap:5px;margin:10px 0}.tn-part{border:1px solid var(--rule,#dcd8cc);background:var(--panel-2,#f2efe6);
        padding:3px 6px;border-radius:2px;font:10.5px/1.4 var(--mono,monospace)}.tn-part b{color:var(--accent,#1f9e8a)}
      .tn-section{margin:9px 0}.tn-label{display:block;font:700 9.5px/1.4 var(--mono,monospace);letter-spacing:.11em;
        color:var(--ink-3,#6e6a60);margin-bottom:2px}.tn-section p{font-size:12px;line-height:1.75;margin:0;color:var(--ink-2,#52504a)}
      .tn-coffee{border-left:3px solid var(--warm,#b3812f);padding:7px 9px;background:var(--panel-2,#f2efe6)}
      .tn-links{display:flex;gap:12px;flex-wrap:wrap;margin-top:11px;font:11px/1.5 var(--mono,monospace)}
      .tn-links a{color:var(--accent,#1f9e8a)}.tn-all{display:block;margin-top:14px;padding:10px 12px;text-align:center;
        border:1px solid var(--ink,#1a1a17);color:var(--ink,#1a1a17);text-decoration:none;font:700 12px/1.4 var(--mono,monospace)}
      .tn-all:hover{background:var(--ink,#1a1a17);color:#fff}.tn-backdrop{position:fixed;z-index:9996;inset:0;background:rgba(26,26,23,.22)}
      .tn-backdrop[hidden]{display:none!important}
      @media(max-width:560px){.tn-trigger{right:10px;bottom:10px}.tn-drawer{border-left:0;padding-left:14px;padding-right:14px}.tn-head{top:-20px}}
      @media print{.tn-trigger,.tn-drawer,.tn-backdrop{display:none!important}}
    `;
    document.head.appendChild(style);
  }

  function section(label, text, coffee) {
    const box = el('div', 'tn-section' + (coffee ? ' tn-coffee' : ''));
    box.appendChild(el('span', 'tn-label', label));
    box.appendChild(el('p', '', text));
    return box;
  }

  function termCard(term, open) {
    const card = el('details', 'tn-card');
    card.id = 'note-' + term.id;
    card.open = open;
    const summary = el('summary');
    summary.appendChild(el('span', 'tn-term', term.term));
    summary.appendChild(el('span', 'tn-en', term.en));
    card.appendChild(summary);
    const body = el('div', 'tn-body');
    const parts = el('div', 'tn-parts');
    term.parts.forEach(part => {
      const chip = el('span', 'tn-part');
      const word = el('b', '', part.word);
      chip.appendChild(word);
      chip.appendChild(document.createTextNode(' = ' + part.meaning));
      parts.appendChild(chip);
    });
    body.appendChild(parts);
    body.appendChild(section('30秒でいうと', term.plain));
    body.appendChild(section('なぜこの考え方？', term.why));
    body.appendChild(section('COFFEE BREAK', term.coffee, true));
    const links = el('div', 'tn-links');
    const wiki = el('a', '', 'Wikiで開く →');
    wiki.href = wikiUrl.href + '#' + encodeURIComponent(term.id);
    links.appendChild(wiki);
    if (term.source) {
      const source = el('a', '', '原典 ↗');
      source.href = term.source.url;
      source.target = '_blank';
      source.rel = 'noopener';
      source.title = term.source.label;
      links.appendChild(source);
    }
    body.appendChild(links);
    card.appendChild(body);
    return card;
  }

  function mount(terms, total) {
    if (!terms.length || pageKey() === 'viz/terms.html') return;
    injectStyles();
    const trigger = el('button', 'tn-trigger');
    trigger.type = 'button';
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', 'term-notes-drawer');
    trigger.appendChild(el('span', '', '☕ 用語ノート'));
    trigger.appendChild(el('span', 'tn-count', String(terms.length)));

    const backdrop = el('div', 'tn-backdrop');
    backdrop.hidden = true;
    const drawer = el('aside', 'tn-drawer');
    drawer.id = 'term-notes-drawer';
    drawer.hidden = true;
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'false');
    drawer.setAttribute('aria-labelledby', 'term-notes-title');
    const head = el('div', 'tn-head');
    const headText = el('div');
    headText.appendChild(el('div', 'tn-kicker', 'ANNOTATION / SIDE NOTE'));
    const title = el('h2', 'tn-title', 'このノートの用語');
    title.id = 'term-notes-title';
    headText.appendChild(title);
    const close = el('button', 'tn-close', '×');
    close.type = 'button';
    close.setAttribute('aria-label', '用語ノートを閉じる');
    head.appendChild(headText);
    head.appendChild(close);
    drawer.appendChild(head);
    drawer.appendChild(el('p', 'tn-intro', '名前を分解し、意味 → なぜ必要か → 小話の順で寄り道します。歴史的な由来と、理解のための原語分解は区別しています。'));
    terms.forEach((term, index) => drawer.appendChild(termCard(term, index === 0)));
    const all = el('a', 'tn-all', '全' + total + '語を用語Wikiで見る →');
    all.href = wikiUrl.href;
    drawer.appendChild(all);

    function open() {
      drawer.hidden = false;
      backdrop.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      close.focus();
    }
    function shut() {
      drawer.hidden = true;
      backdrop.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      trigger.focus();
    }
    trigger.addEventListener('click', open);
    close.addEventListener('click', shut);
    backdrop.addEventListener('click', shut);
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !drawer.hidden) shut();
    });
    document.body.appendChild(backdrop);
    document.body.appendChild(trigger);
    document.body.appendChild(drawer);
    window.__TERM_NOTES_READY__ = { page: pageKey(), count: terms.length, total };
  }

  import(dataUrl.href)
    .then(module => mount(module.termsForPage(pageKey()), module.TERM_NOTES.length))
    .catch(error => console.error('用語ノートを読み込めませんでした:', error));
})();
