// Phrasebook: sentence frames with listen/repeat, and pronunciation drills.
(function (root) {
  root.Views = root.Views || {};
  const { esc, qs, qsa, on, shuffle } = root.UI;

  function renderIndex(main) {
    const D = root.App.data;
    main.innerHTML = `
      <h1>Phrasebook</h1>
      <p class="muted">Sentence frames that make you sound structured and natural. Learn the frames, plug in your own content.</p>
      <div class="coach">Não decore frases soltas: decore os "moldes" (frames). "I reach for X when…", "The trade-off is…", "Just to make sure I understood…". Com 30 moldes você conduz qualquer entrevista.</div>
      <div class="grid">
        ${D.phrases.map((g) => `<a class="card" href="#/phrases/${g.id}" style="display:block"><h3>${esc(g.title)}</h3><p class="small muted mb0">${g.items.length} phrases</p><div class="coach">${esc(g.pt)}</div></a>`).join('')}
        <a class="card hero" href="#/phrases/pronunciation" style="display:block"><h3 style="color:#fff">🔤 Pronunciation drill</h3><p class="muted mb0">${D.pronunciation.length} words Brazilian speakers often get wrong.</p></a>
      </div>`;
  }

  function renderGroup(main, g) {
    main.innerHTML = `
      <a class="small" href="#/phrases">← Phrasebook</a>
      <h1 class="mt">${esc(g.title)}</h1>
      <div class="coach">${esc(g.pt)}</div>
      <div class="row">
        <button class="btn primary" data-act="shadow-all">🗣️ Listen & repeat all</button>
        <span class="row" data-el="ctl" hidden>
          <button class="btn sm" data-act="repeat">↻ Repeat</button>
          <button class="btn sm" data-act="next">Next ▶</button>
          <button class="btn sm ghost" data-act="stop">■ Stop</button>
        </span>
      </div>
      <div class="card mt">
        ${g.items.map((p, i) => `
          <div class="phrase" data-i="${i}">
            <button class="btn sm ghost" data-act="say" data-text="${esc(p.en)}">🔊</button>
            <div><div class="en sentence" data-i="${i}">${esc(p.en)}</div>${p.pt ? `<div class="pt">${esc(p.pt)}</div>` : ''}</div>
          </div>`).join('')}
      </div>`;
    let ctl = null;
    const highlight = (i) => qsa('.sentence', main).forEach((s) => s.classList.toggle('active', Number(s.getAttribute('data-i')) === i));
    on(main, 'click', '[data-act=say]', (e, el) => root.Speech.speak(el.getAttribute('data-text')));
    on(main, 'click', '[data-act=shadow-all]', () => {
      qs('[data-el=ctl]', main).hidden = false;
      if (ctl) ctl.stop();
      ctl = root.Speech.shadow(g.items.map((p) => p.en), { onSentence: highlight, onDone: () => highlight(-1) });
      ctl.play();
    });
    on(main, 'click', '[data-act=repeat]', () => ctl && ctl.repeat());
    on(main, 'click', '[data-act=next]', () => ctl && ctl.next());
    on(main, 'click', '[data-act=stop]', () => { if (ctl) ctl.stop(); highlight(-1); qs('[data-el=ctl]', main).hidden = true; });
    root.App.touch('phrases');
    return { destroy() { if (ctl) ctl.stop(); } };
  }

  function renderPronunciation(main) {
    const list = root.App.data.pronunciation;
    let drill = null; let di = 0;
    function table() {
      return `<table class="table">
        <tr><th>Word</th><th>Sounds like</th><th>Tip</th><th></th></tr>
        ${list.map((w) => `<tr>
          <td class="word">${esc(w.word)}</td>
          <td class="sounds">${esc(w.sounds)}</td>
          <td class="small">${esc(w.tip)}${w.pt ? `<div class="coach" style="margin:.3rem 0 0">${esc(w.pt)}</div>` : ''}</td>
          <td class="row" style="flex-wrap:nowrap"><button class="btn sm ghost" data-act="say" data-text="${esc(w.word.replace(/\s*\(.*\)$/, ''))}">🔊</button><button class="btn sm ghost" data-act="slow" data-text="${esc(w.word.replace(/\s*\(.*\)$/, ''))}" title="slow">🐢</button></td>
        </tr>`).join('')}
      </table>`;
    }
    main.innerHTML = `
      <a class="small" href="#/phrases">← Phrasebook</a>
      <h1 class="mt">Pronunciation drill</h1>
      <p class="muted">Capitals mark the stressed syllable. Stress is what makes you understood; individual sounds matter less.</p>
      <div class="coach">Regras que mais pesam para brasileiros: 1) sílaba tônica (dePENdency, não depenDENcy); 2) -ed final: "worked" = 1 sílaba, "executed" = 4; 3) "th"; 4) vogais longas vs curtas (sheet/focus). Ouça, repita, grave-se.</div>
      <div class="card">
        <div class="row between">
          <h3 class="mb0">Random drill: listen, repeat, next</h3>
          <button class="btn primary" data-act="start-drill">🎲 Start 10-word drill</button>
        </div>
        <div data-el="drill" class="mt" hidden>
          <div class="row" style="gap:1.5rem; align-items:center">
            <div><div class="word" style="font-size:1.6rem" data-el="dw"></div><div class="sounds" data-el="ds"></div><div class="small muted" data-el="dt"></div></div>
            <div class="row">
              <button class="btn" data-act="d-say">🔊 Again</button>
              <button class="btn" data-act="d-slow">🐢 Slow</button>
              <button class="btn primary" data-act="d-next">Next ▶</button>
            </div>
          </div>
          <div class="tiny muted mt" data-el="dp"></div>
        </div>
      </div>
      <div class="card">${table()}</div>`;
    const say = (t, rate) => root.Speech.speak(t, { rate: rate || undefined });
    function showDrill() {
      const w = drill[di];
      qs('[data-el=dw]', main).textContent = w.word;
      qs('[data-el=ds]', main).textContent = w.sounds;
      qs('[data-el=dt]', main).textContent = w.tip;
      qs('[data-el=dp]', main).textContent = `${di + 1} / ${drill.length}`;
      say(w.word.replace(/\s*\(.*\)$/, ''));
    }
    on(main, 'click', '[data-act=say]', (e, el) => say(el.getAttribute('data-text')));
    on(main, 'click', '[data-act=slow]', (e, el) => say(el.getAttribute('data-text'), 0.6));
    on(main, 'click', '[data-act=start-drill]', () => { drill = shuffle(list).slice(0, 10); di = 0; qs('[data-el=drill]', main).hidden = false; showDrill(); });
    on(main, 'click', '[data-act=d-say]', () => say(drill[di].word.replace(/\s*\(.*\)$/, '')));
    on(main, 'click', '[data-act=d-slow]', () => say(drill[di].word.replace(/\s*\(.*\)$/, ''), 0.6));
    on(main, 'click', '[data-act=d-next]', () => { if (di + 1 < drill.length) { di += 1; showDrill(); } else { qs('[data-el=dw]', main).textContent = 'Done 🎉'; qs('[data-el=ds]', main).textContent = ''; qs('[data-el=dt]', main).textContent = 'Start again for a new random set.'; root.App.touch('phrases'); } });
    return null;
  }

  root.Views.phrases = function (main, ctx) {
    const [id] = ctx.params;
    if (id === 'pronunciation') return renderPronunciation(main);
    if (id) {
      const g = root.App.data.phrases.find((x) => x.id === id);
      if (!g) { main.innerHTML = '<div class="empty">Not found. <a href="#/phrases">Back</a></div>'; return null; }
      return renderGroup(main, g);
    }
    renderIndex(main);
    return null;
  };
})(window);
