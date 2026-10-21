// Interview Drill: pick a question, hear it, answer out loud, get feedback.
(function (root) {
  root.Views = root.Views || {};
  const { esc, qs, qsa, on, toast, shuffle, pick, catLabel } = root.UI;

  const CATS = ['csharp', 'dotnet', 'aspnet', 'efcore', 'architecture', 'testing', 'behavioral-tech', 'behavioral'];

  function attemptsFor(id) {
    return (root.App.progress().attempts || []).filter((a) => a.id === id);
  }

  function renderList(main, ctx) {
    const App = root.App;
    const all = App.allQuestions();
    const cat = ctx.query.cat || 'all';
    const level = ctx.query.level || 'all';
    const list = all.filter((q) => (cat === 'all' || q.category === cat) && (level === 'all' || String(q.level) === level));
    const attempts = App.progress().attempts || [];
    const best = {};
    attempts.forEach((a) => { best[a.id] = Math.max(best[a.id] || 0, a.score || 0); });

    main.innerHTML = `
      <h1>Interview Drill</h1>
      <p class="muted">One question at a time, like the real thing. The interviewer reads it out loud; you answer with your voice.</p>
      <div class="coach">Comece pelos níveis 1 e pela categoria que mais te assusta. Repita a mesma pergunta até passar de 75. Depois mude de pergunta. Qualidade e repetição batem quantidade.</div>
      <div class="card">
        <div class="row between">
          <div class="row">
            <a class="chip ${cat === 'all' ? 'active' : ''}" href="#/drill?cat=all&level=${level}">All</a>
            ${CATS.map((c) => `<a class="chip ${cat === c ? 'active' : ''}" href="#/drill?cat=${c}&level=${level}">${esc(catLabel(c))}</a>`).join('')}
          </div>
          <div class="row">
            <span class="muted small">Level</span>
            ${['all', '1', '2', '3'].map((l) => `<a class="chip ${level === l ? 'active' : ''}" href="#/drill?cat=${cat}&level=${l}">${l === 'all' ? 'All' : l}</a>`).join('')}
          </div>
        </div>
        <div class="row mt">
          <a class="btn primary" href="#/drill/random${cat !== 'all' ? '?cat=' + cat : ''}">🎲 Random from this filter</a>
          <span class="muted small">${list.length} questions</span>
        </div>
      </div>
      <div class="grid">
        ${list.map((q) => `
          <a class="card" href="#/drill/q/${q.id}" style="display:block">
            <div class="row between"><span class="tag">${esc(catLabel(q.category))}</span><span class="muted tiny">L${q.level} ${best[q.id] != null ? '· best ' + best[q.id] : ''}</span></div>
            <div class="mt" style="font-weight:600; color:var(--text)">${esc(q.q)}</div>
          </a>`).join('')}
      </div>`;
  }

  function renderQuestion(main, q, ctx) {
    const App = root.App;
    const history = attemptsFor(q.id);
    const target = q.category === 'behavioral' ? 150 : 100;
    const all = App.allQuestions();
    const sameCat = all.filter((x) => x.category === q.category && x.id !== q.id);
    const nextId = (sameCat.length ? pick(sameCat) : pick(all)).id;

    main.innerHTML = `
      <div class="row between">
        <a class="small" href="#/drill?cat=${q.category}">← Back to questions</a>
        <span class="row small muted">
          <span class="tag">${esc(catLabel(q.category))}</span> Level ${q.level}
          ${history.length ? `· ${history.length} attempt${history.length > 1 ? 's' : ''}, best ${Math.max.apply(null, history.map((h) => h.score || 0))}` : ''}
        </span>
      </div>
      <div class="card interviewer mt">
        <div class="row" style="align-items:flex-start">
          <div class="avatar">IV</div>
          <div style="flex:1">
            <div class="muted tiny">Interviewer</div>
            <div class="question-text">${esc(q.q)}</div>
            <div class="row mt">
              <button class="btn sm" data-act="listen-q">🔊 Hear the question</button>
              <button class="btn sm ghost" data-act="toggle-hints">💡 Show what they expect to hear</button>
            </div>
            <div data-el="hints" hidden class="mt">
              <ul class="kp">${q.keyPoints.map((k) => `<li><span>•</span><span>${esc(k.label)}</span></li>`).join('')}</ul>
              <p class="tiny muted mt">Try answering without the hints first. Use them on the second attempt.</p>
            </div>
          </div>
        </div>
      </div>
      ${q.pt ? `<div class="coach">${esc(q.pt)}</div>` : ''}
      <div class="card" data-el="panel"></div>
      <div data-el="feedback"></div>
      <div class="row" data-el="after" hidden>
        <button class="btn primary" data-act="save">💾 Save attempt</button>
        <button class="btn" data-act="retry">↺ Answer again</button>
        <a class="btn" href="#/drill/q/${nextId}">Next question →</a>
      </div>`;

    let lastResult = null;
    let lastAnswer = null;
    let fb = null;
    const panelEl = qs('[data-el=panel]', main);
    const fbEl = qs('[data-el=feedback]', main);
    const afterEl = qs('[data-el=after]', main);
    const saveBtn = qs('[data-act=save]', afterEl);

    const panel = root.AnswerPanel.mount(panelEl, {
      targetSeconds: target,
      onStart() { root.Speech.cancel(); fbEl.innerHTML = ''; afterEl.hidden = true; saveBtn.disabled = false; saveBtn.textContent = '💾 Save attempt'; },
      onDone(ans) {
        lastAnswer = ans;
        lastResult = Scoring.overall(ans.text, q.keyPoints, ans.seconds);
        fbEl.innerHTML = Feedback.render(lastResult, q, { showCoach: false });
        if (fb) fb.destroy();
        fb = Feedback.mount(fbEl);
        afterEl.hidden = false;
        fbEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      },
    });

    on(main, 'click', '[data-act=listen-q]', () => root.Speech.speak(q.q));
    on(main, 'click', '[data-act=toggle-hints]', () => { const h = qs('[data-el=hints]', main); h.hidden = !h.hidden; });
    on(main, 'click', '[data-act=retry]', () => { panel.reset(); fbEl.innerHTML = ''; afterEl.hidden = true; window.scrollTo({ top: 0, behavior: 'smooth' }); });
    on(main, 'click', '[data-act=save]', (e, btn) => {
      if (!lastResult) return;
      App.recordAttempt({
        kind: 'drill', id: q.id, category: q.category, question: q.q, score: lastResult.score,
        covered: lastResult.coverage.covered, total: lastResult.coverage.total, words: lastResult.words,
        seconds: Math.round(lastResult.seconds), fillers: lastResult.fillers.total, mode: lastAnswer.mode,
        text: lastAnswer.text.slice(0, 2000), ratings: fb ? fb.ratings() : {},
      });
      btn.textContent = '✓ Saved';
      btn.disabled = true;
      toast('Attempt saved. Score ' + lastResult.score + '.');
    });

    // Read the question automatically, like a real interviewer would.
    if (ctx.query.silent !== '1') setTimeout(() => root.Speech.speak(q.q), 300);

    return { destroy() { panel.destroy(); if (fb) fb.destroy(); } };
  }

  root.Views.drill = function (main, ctx) {
    const App = root.App;
    const [sub, id] = ctx.params;
    if (sub === 'random') {
      const all = App.allQuestions().filter((q) => !ctx.query.cat || q.category === ctx.query.cat);
      const q = pick(all);
      location.replace('#/drill/q/' + q.id);
      return null;
    }
    if (sub === 'q' && id) {
      const q = App.findQuestion(id);
      if (!q) { main.innerHTML = '<div class="empty">Question not found. <a href="#/drill">Back</a></div>'; return null; }
      return renderQuestion(main, q, ctx);
    }
    renderList(main, ctx);
    return null;
  };
})(window);
