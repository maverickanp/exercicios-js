// Code Talk: explain a C# snippet out loud.
(function (root) {
  root.Views = root.Views || {};
  const { esc, qs, on, toast, pick } = root.UI;

  function renderList(main) {
    const D = root.App.data;
    const attempts = root.App.progress().attempts || [];
    const best = {};
    attempts.forEach((a) => { if (a.kind === 'code') best[a.id] = Math.max(best[a.id] || 0, a.score || 0); });
    main.innerHTML = `
      <h1>Code Talk</h1>
      <p class="muted">Interviewers often share a snippet and say "walk me through this". Practice narrating code clearly in English.</p>
      <div class="coach">Fórmula para explicar código: 1) o que faz (uma frase), 2) o problema ou ponto de atenção, 3) como você corrigiria/melhoraria, 4) uma alternativa ou ressalva. Linha por linha só se pedirem.</div>
      <div class="grid">
        ${D.snippets.map((s) => `<a class="card" href="#/code/${s.id}" style="display:block"><div class="row between"><span class="tag">Level ${s.level}</span>${best[s.id] != null ? `<span class="tiny muted">best ${best[s.id]}</span>` : ''}</div><h3 class="mt">${esc(s.title)}</h3><pre class="code" style="font-size:.72rem; max-height:90px; overflow:hidden; margin:0">${esc(s.code.split('\n').slice(0, 4).join('\n'))}</pre></a>`).join('')}
      </div>`;
  }

  function renderSnippet(main, s) {
    const D = root.App.data;
    const next = pick(D.snippets.filter((x) => x.id !== s.id));
    main.innerHTML = `
      <a class="small" href="#/code">← Code Talk</a>
      <div class="card interviewer mt">
        <div class="row" style="align-items:flex-start">
          <div class="avatar">IV</div>
          <div style="flex:1">
            <div class="muted tiny">Interviewer</div>
            <div class="question-text">${esc(s.task)}</div>
            <div class="row mt"><button class="btn sm" data-act="listen-q">🔊 Hear the question</button></div>
          </div>
        </div>
      </div>
      <h3>${esc(s.title)} <span class="tag">Level ${s.level}</span></h3>
      <pre class="code">${esc(s.code)}</pre>
      <div class="coach">${esc(s.pt)}</div>
      <div class="card" data-el="panel"></div>
      <div data-el="feedback"></div>
      <div class="row" data-el="after" hidden>
        <button class="btn primary" data-act="save">💾 Save attempt</button>
        <button class="btn" data-act="retry">↺ Explain again</button>
        <a class="btn" href="#/code/${next.id}">Next snippet →</a>
      </div>`;
    let last = null; let lastAns = null; let fb = null;
    const fbEl = qs('[data-el=feedback]', main);
    const afterEl = qs('[data-el=after]', main);
    const panel = root.AnswerPanel.mount(qs('[data-el=panel]', main), {
      targetSeconds: 75,
      onStart() { root.Speech.cancel(); fbEl.innerHTML = ''; afterEl.hidden = true; },
      onDone(ans) {
        lastAns = ans;
        last = Scoring.overall(ans.text, s.keyPoints, ans.seconds);
        fbEl.innerHTML = Feedback.render(last, s, { selfRating: false, showCoach: false });
        if (fb) fb.destroy();
        fb = Feedback.mount(fbEl);
        afterEl.hidden = false;
        fbEl.scrollIntoView({ behavior: 'smooth' });
      },
    });
    on(main, 'click', '[data-act=listen-q]', () => root.Speech.speak(s.task));
    on(main, 'click', '[data-act=retry]', () => { panel.reset(); fbEl.innerHTML = ''; afterEl.hidden = true; });
    on(main, 'click', '[data-act=save]', (e, btn) => {
      if (!last) return;
      root.App.recordAttempt({ kind: 'code', id: s.id, category: 'code', question: s.title, score: last.score, covered: last.coverage.covered, total: last.coverage.total, words: last.words, seconds: Math.round(last.seconds), fillers: last.fillers.total, mode: lastAns.mode, text: lastAns.text.slice(0, 2000) });
      btn.textContent = '✓ Saved'; btn.disabled = true; toast('Saved.');
    });
    setTimeout(() => root.Speech.speak(s.task), 300);
    return { destroy() { panel.destroy(); if (fb) fb.destroy(); } };
  }

  root.Views.code = function (main, ctx) {
    const [id] = ctx.params;
    if (id) {
      const s = root.App.data.snippets.find((x) => x.id === id);
      if (!s) { main.innerHTML = '<div class="empty">Not found. <a href="#/code">Back</a></div>'; return null; }
      return renderSnippet(main, s);
    }
    renderList(main);
    return null;
  };
})(window);
