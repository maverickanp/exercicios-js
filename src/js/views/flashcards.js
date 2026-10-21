// Flashcards with Leitner spaced repetition. State in Storage key "srs".
(function (root) {
  root.Views = root.Views || {};
  const { esc, qs, on, toast, catLabel } = root.UI;
  const TAGS = ['csharp', 'dotnet', 'aspnet', 'efcore', 'architecture', 'testing'];

  root.Views.flashcards = function (main, ctx) {
    const App = root.App;
    const tag = ctx.query.tag || 'all';
    const cards = App.data.flashcards.filter((c) => tag === 'all' || c.tag === tag);
    const byId = {};
    App.data.flashcards.forEach((c) => { byId[c.id] = c; });
    let state = Storage.get('srs', {});
    let queue = Srs.buildQueue(cards.map((c) => c.id), state, { newLimit: 10 });
    let pos = 0;
    let flipped = false;
    let reviewed = 0;
    const summaryAll = Srs.summary(App.data.flashcards.map((c) => c.id), state);

    function header() {
      return `
        <div class="row between">
          <h1>Flashcards</h1>
          <span class="muted small">${summaryAll.due} due · ${summaryAll.unseen} new · ${summaryAll.seen} learned</span>
        </div>
        <div class="row">
          <a class="chip ${tag === 'all' ? 'active' : ''}" href="#/flashcards">All</a>
          ${TAGS.map((t) => `<a class="chip ${tag === t ? 'active' : ''}" href="#/flashcards?tag=${t}">${esc(catLabel(t))}</a>`).join('')}
        </div>`;
    }

    function renderCard() {
      if (pos >= queue.length) return renderDone();
      const card = byId[queue[pos]];
      const st = state[card.id];
      main.innerHTML = `
        ${header()}
        <div class="coach">Leia a frente, responda EM VOZ ALTA em inglês antes de virar. Depois compare, ouça a frase "Say it like this" e repita. Avalie com honestidade: "Again" não é fracasso, é o algoritmo trabalhando.</div>
        <div class="row between small muted"><span>Card ${pos + 1} of ${queue.length} ${tag !== 'all' ? '· ' + esc(catLabel(tag)) : ''}</span><span>${st ? 'Box ' + st.box + ' · seen ' + st.reviews + '×' : 'New card'}</span></div>
        <div class="card flashcard" data-act="flip">
          ${flipped ? `
            <div class="back">
              <div class="tiny muted">${esc(card.front)}</div>
              <p class="mt">${esc(card.back)}</p>
              <div class="say">🗣️ Say it like this: "${esc(card.say)}" <button class="btn sm ghost" data-act="say" data-text="${esc(card.say)}">🔊</button></div>
              ${card.pt ? `<div class="coach">${esc(card.pt)}</div>` : ''}
            </div>` : `
            <div class="front">${esc(card.front)}</div>
            <p class="muted small mt">Answer out loud, then tap to flip</p>`}
        </div>
        ${flipped ? `
          <div class="row" style="justify-content:center">
            <button class="btn" data-rate="again">❌ Again</button>
            <button class="btn" data-rate="hard">😬 Hard</button>
            <button class="btn primary" data-rate="good">✅ Good</button>
            <button class="btn accent" data-rate="easy">🚀 Easy</button>
          </div>
          <p class="tiny muted mt" style="text-align:center">Again: 10 min · Hard: same box · Good: next box · Easy: skip a box. Keys: 1–4, space to flip.</p>` : `
          <div class="row" style="justify-content:center"><button class="btn primary" data-act="flip">Flip (space)</button><button class="btn ghost" data-act="say" data-text="${esc(card.front)}">🔊 Hear it</button></div>`}`;
    }

    function renderDone() {
      const s = Srs.summary(App.data.flashcards.map((c) => c.id), state);
      main.innerHTML = `
        ${header()}
        <div class="card" style="text-align:center">
          <h2>${reviewed ? 'Session complete 🎉' : 'Nothing due right now'}</h2>
          <p class="muted">${reviewed ? 'You reviewed ' + reviewed + ' card' + (reviewed > 1 ? 's' : '') + '.' : 'Come back later, or study new cards from another topic.'}</p>
          <div class="boxes mt">${[1, 2, 3, 4, 5].map((b) => `<div><b>${s.boxes[b] || 0}</b>box ${b}</div>`).join('')}</div>
          <p class="tiny muted mt">Box 1 = every session · Box 5 = every two weeks</p>
          <div class="row mt" style="justify-content:center">
            <button class="btn primary" data-act="more">Study 10 more new cards</button>
            <a class="btn" href="#/drill/random">Go to a drill</a>
          </div>
        </div>`;
    }

    function rate(rating) {
      const id = queue[pos];
      const card = state[id] || Srs.newCard(id);
      state[id] = Srs.rate(card, rating);
      Storage.set('srs', state);
      reviewed += 1;
      App.touch('flashcards');
      if (rating === 'again') queue.push(id); // see it again this session
      pos += 1; flipped = false;
      renderCard();
    }

    on(main, 'click', '[data-act=flip]', (e) => { if (e.target.closest('[data-act=say]')) return; flipped = !flipped; renderCard(); });
    on(main, 'click', '[data-act=say]', (e, el) => { e.stopPropagation(); root.Speech.speak(el.getAttribute('data-text')); });
    on(main, 'click', '[data-rate]', (e, el) => rate(el.getAttribute('data-rate')));
    on(main, 'click', '[data-act=more]', () => {
      state = Storage.get('srs', {});
      const fresh = cards.map((c) => c.id).filter((id) => !state[id]).slice(0, 10);
      if (!fresh.length) { toast('No new cards left in this topic.'); return; }
      queue = fresh; pos = 0; flipped = false; renderCard();
    });
    function keys(e) {
      if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
      if (pos >= queue.length) return;
      if (e.key === ' ') { e.preventDefault(); flipped = !flipped; renderCard(); }
      else if (flipped && ['1', '2', '3', '4'].includes(e.key)) rate(['again', 'hard', 'good', 'easy'][Number(e.key) - 1]);
    }
    document.addEventListener('keydown', keys);
    renderCard();
    return { destroy() { document.removeEventListener('keydown', keys); } };
  };
})(window);
