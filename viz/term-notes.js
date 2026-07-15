// 各教材の本文へ、その場で読める「人間向けの解釈」を追記する共有UI。
// 外部の用語集へ説明を逃がさず、名前の分解・意味・理由・小話をページ内に実体表示する。
(function () {
  if (window.__termNotesMounted) return;
  window.__termNotesMounted = true;

  const ownScript = document.currentScript;
  if (!ownScript || !ownScript.src) return;
  const dataUrl = new URL('lib/term-notes.mjs', new URL('./', ownScript.src));

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
      .tn-interpret{margin:0 0 20px;padding:14px 15px 15px;background:var(--panel-2,#f2efe6);
        border:1px solid var(--rule,#dcd8cc);border-left:3px solid var(--accent,#1f9e8a);border-radius:2px;
        color:var(--ink,#1a1a17);font-family:var(--gothic,system-ui,sans-serif)}
      .tn-intro{display:flex;align-items:baseline;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:10px}
      .tn-interpret h2{font:700 14px/1.5 var(--gothic,system-ui,sans-serif);letter-spacing:.02em;margin:0;padding:0;border:0;color:var(--ink,#1a1a17)}
      .tn-kicker{font:700 9.5px/1.4 var(--mono,monospace);letter-spacing:.12em;color:var(--accent,#1f9e8a)}
      .tn-guide{font-size:11.5px;line-height:1.7;color:var(--ink-2,#52504a);margin:0 0 10px}
      .tn-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:7px}
      .tn-note{min-width:0;background:var(--panel,#fff);border:1px solid var(--rule,#dcd8cc);padding:10px 11px;border-radius:2px}
      .tn-name{display:flex;justify-content:space-between;align-items:baseline;gap:8px;padding-bottom:6px;border-bottom:1px dashed var(--rule,#dcd8cc)}
      .tn-term{font-weight:700;font-size:13px}.tn-en{font:9.5px/1.4 var(--mono,monospace);color:var(--ink-3,#6e6a60);text-align:right}
      .tn-parts{display:flex;flex-wrap:wrap;gap:4px;margin:7px 0}.tn-part{background:var(--panel-2,#f2efe6);border:1px solid var(--rule,#dcd8cc);
        padding:2px 5px;border-radius:2px;font:9.5px/1.4 var(--mono,monospace)}.tn-part b{color:var(--accent,#1f9e8a)}
      .tn-line{font-size:11.5px;line-height:1.7;color:var(--ink-2,#52504a);margin:6px 0 0}
      .tn-label{display:block;font:700 9px/1.35 var(--mono,monospace);letter-spacing:.09em;color:var(--ink-3,#6e6a60);margin-bottom:1px}
      .tn-human{color:var(--ink,#1a1a17)}.tn-human .tn-label{color:var(--accent,#1f9e8a)}
      .tn-coffee{border-left:2px solid var(--warm,#b3812f);padding:5px 6px;background:var(--panel-2,#f2efe6)}
      .tn-coffee .tn-label{color:var(--warm,#b3812f)}
      @media(max-width:560px){.tn-interpret{padding:12px 11px}.tn-grid{grid-template-columns:1fr}}
      @media print{.tn-interpret{break-inside:avoid}.tn-note{break-inside:avoid}}
    `;
    document.head.appendChild(style);
  }

  function line(label, text, className) {
    const paragraph = el('p', 'tn-line' + (className ? ' ' + className : ''));
    paragraph.appendChild(el('span', 'tn-label', label));
    paragraph.appendChild(document.createTextNode(text));
    return paragraph;
  }

  function note(term) {
    const article = el('article', 'tn-note');
    const name = el('div', 'tn-name');
    name.appendChild(el('span', 'tn-term', term.term));
    name.appendChild(el('span', 'tn-en', term.en));
    article.appendChild(name);

    const parts = el('div', 'tn-parts');
    term.parts.forEach(part => {
      const chip = el('span', 'tn-part');
      chip.appendChild(el('b', '', part.word));
      chip.appendChild(document.createTextNode(' = ' + part.meaning));
      parts.appendChild(chip);
    });
    article.appendChild(parts);
    article.appendChild(line('人間の感覚でいうと', term.plain, 'tn-human'));
    article.appendChild(line('なぜこの考え方？', term.why));
    article.appendChild(line('COFFEE BREAK', term.coffee, 'tn-coffee'));
    return article;
  }

  function mount(terms) {
    if (!terms.length || document.querySelector('.tn-interpret')) return;
    injectStyles();
    const section = el('section', 'tn-interpret');
    section.setAttribute('aria-labelledby', 'term-interpret-title');
    const intro = el('div', 'tn-intro');
    const title = el('h2', '', 'このページのことばを、人間の感覚に戻す');
    title.id = 'term-interpret-title';
    intro.appendChild(title);
    intro.appendChild(el('span', 'tn-kicker', 'INTERPRETATION / ' + terms.length + ' NOTES'));
    section.appendChild(intro);
    section.appendChild(el('p', 'tn-guide', '専門語を名前の部品へほどき、意味だけでなく「なぜそう考えるのか」まで本文の前に置きます。リンク先を読まなくても、この場で理解できます。'));
    const grid = el('div', 'tn-grid');
    terms.forEach(term => grid.appendChild(note(term)));
    section.appendChild(grid);

    const purpose = document.querySelector('.purpose');
    const lead = document.querySelector('.lead');
    const anchor = purpose || lead || document.querySelector('h1');
    if (anchor && anchor.parentNode) anchor.insertAdjacentElement('afterend', section);
    else (document.querySelector('.wrap') || document.body).prepend(section);
    window.__TERM_NOTES_READY__ = { page: pageKey(), count: terms.length, inline: true };
  }

  import(dataUrl.href)
    .then(module => mount(module.termsForPage(pageKey())))
    .catch(error => console.error('解釈付き注釈を読み込めませんでした:', error));
})();
