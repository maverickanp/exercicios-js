// Mock interview: 8 questions in a row, no feedback until the end.
(function (root) {
  root.Views = root.Views || {};
  const { esc, qs, on, toast, shuffle, pick, catLabel, fmtTime, scoreClass } = root.UI;

  function buildSession(focus) {
    const D = root.App.data;
    const intro = D.behavioral.find((b) => b.id === 'bh-tell-me-about-yourself');
    const closing = D.behavioral.find((b) => b.id === 'bh-questions-for-us');
    const behavioral = shuffle(D.behavioral.filter((b) => b.id !== intro.id && b.id !== closing.id)).slice(0, 2);
    let techPool = D.questions.filter((q) => q.category !== 'behavioral-tech');
    if (focus && focus !== 'all') techPool = techPool.filter((q) => q.category === focus);
    // Mix categories: take at most 2 per category.
    const perCat = {};
    const tech = [];
    shuffle(techPool).forEach((q) => {
      if (tech.length >= 4) return;
      if ((perCat[q.category] || 0) >= 2 && focus === 'all') return;
      perCat[q.category] = (perCat[q.category] || 0) + 1;
      tech.push(q);
    });
    const mark = (q, cat) => Object.assign({ category: cat || q.category }, q);
    return [mark(intro, 'behavioral'), mark(behavioral[0], 'behavioral')].concat(tech.slice(0, 2).map((q) => mark(q)), [mark(behavioral[1], 'behavioral')], tech.slice(2).map((q) => mark(q)), [mark(closing, 'behavioral')]);
  }

  root.Views.mock = function (main, ctx) {
    const App = root.App;
    let session = null;
    let index = 0;
    let answers = [];
    let panel = null;

    function renderStart() {
      const past = (App.progress().mocks || []).slice(-5).reverse();
      main.innerHTML = `
        <h1>Mock Interview</h1>
        <p class="muted">Eight questions, about 20 minutes, no feedback until the end. Treat it like the real call: camera on, sit up, speak out loud.</p>
        <div class="coach">Simule as condições reais: fone, câmera, sem anotações. Não pause entre perguntas. No fim, leia o relatório e escolha 3 perguntas para refazer no Drill amanhã.</div>
        <div class="card">
          <h3>Format</h3>
          <ol class="small">
            <li>Tell me about yourself (intro)</li>
            <li>Behavioral question</li>
            <li>Two technical questions</li>
            <li>Behavioral question</li>
            <li>Two technical questions</li>
            <li>Do you have questions for us? (closing)</li>
          </ol>
          <div class="field">
            <label>Technical focus</label>
            <select data-el="focus">
              <option value="all">Mixed (recommended)</option>
              ${['csharp', 'dotnet', 'aspnet', 'efcore', 'architecture', 'testing'].map((c) => `<option value="${c}">${esc(catLabel(c))}</option>`).join('')}
            </select>
          </div>
          <button class="btn primary" data-act="start">🎤 Start the interview</button>
        </div>
        ${past.length ? `<div class="card"><h3>Previous mocks</h3><table class="table"><tr><th>Date</th><th>Score</th><th>Questions</th></tr>${past.map((m) => `<tr><td>${new Date(m.at).toLocaleDateString()}</td><td class="${scoreClass(m.score)}"><b>${m.score}</b></td><td class="small muted">${m.items.map((i) => i.score).join(' · ')}</td></tr>`).join('')}</table></div>` : ''}`;
    }

    function renderQuestion() {
      const q = session[index];
      const target = q.category === 'behavioral' ? 150 : 100;
      main.innerHTML = `
        <div class="row between">
          <span class="muted small">Question ${index + 1} of ${session.length} · <span class="tag">${esc(catLabel(q.category))}</span></span>
          <button class="btn sm ghost danger" data-act="abort">Leave interview</button>
        </div>
        <div class="card interviewer mt">
          <div class="row" style="align-items:flex-start">
            <div class="avatar">IV</div>
            <div style="flex:1">
              <div class="muted tiny">Interviewer</div>
              <div class="question-text">${esc(q.q)}</div>
              <div class="row mt"><button class="btn sm" data-act="listen-q">🔊 Repeat the question</button></div>
            </div>
          </div>
        </div>
        <div class="card" data-el="panel"></div>`;
      if (panel) panel.destroy();
      panel = root.AnswerPanel.mount(qs('[data-el=panel]', main), {
        targetSeconds: target,
        onStart() { root.Speech.cancel(); },
        onDone(ans) {
          const r = Scoring.overall(ans.text, q.keyPoints, ans.seconds);
          answers.push({ q, ans, r });
          index += 1;
          if (index < session.length) {
            toast('Thanks. Next question.');
            renderQuestion();
          } else renderReport();
        },
      });
      setTimeout(() => root.Speech.speak(q.q), 300);
    }

    function renderReport() {
      const total = Math.round(answers.reduce((s, a) => s + a.r.score, 0) / answers.length);
      const totalSeconds = answers.reduce((s, a) => s + a.r.seconds, 0);
      const fillers = answers.reduce((s, a) => s + a.r.fillers.total, 0);
      const weakest = answers.slice().sort((a, b) => a.r.score - b.r.score).slice(0, 3);
      // Persist: one attempt per question + a mock summary.
      answers.forEach((a) => App.recordAttempt({
        kind: 'mock', id: a.q.id, category: a.q.category, question: a.q.q, score: a.r.score,
        covered: a.r.coverage.covered, total: a.r.coverage.total, words: a.r.words, seconds: Math.round(a.r.seconds),
        fillers: a.r.fillers.total, mode: a.ans.mode, text: a.ans.text.slice(0, 2000),
      }));
      const p = App.progress();
      p.mocks = p.mocks || [];
      p.mocks.push({ at: Date.now(), score: total, items: answers.map((a) => ({ id: a.q.id, score: a.r.score })) });
      App.saveProgress(p);

      main.innerHTML = `
        <h1>Interview report</h1>
        <div class="card">
          <div class="row" style="gap:1.5rem">
            <div class="score-ring" style="--pct:${total}"><span class="${scoreClass(total)}">${total}</span></div>
            <div class="stat"><b>${fmtTime(totalSeconds)}</b><span class="lbl">talking time</span></div>
            <div class="stat"><b>${fillers}</b><span class="lbl">filler words</span></div>
            <div class="stat"><b>${answers.reduce((s, a) => s + a.r.words, 0)}</b><span class="lbl">words</span></div>
          </div>
          <div class="coach">Leia o relatório como um entrevistador leria: onde faltou estrutura? Onde faltou vocabulário técnico? Refaça as 3 mais fracas no Drill (links abaixo) e faça shadowing das respostas-modelo.</div>
        </div>
        <div class="card">
          <h3>Work on these first</h3>
          <ul>${weakest.map((a) => `<li><a href="#/drill/q/${a.q.id}">${esc(a.q.q)}</a> <span class="muted small">(${a.r.score})</span></li>`).join('')}</ul>
        </div>
        ${answers.map((a, i) => `
          <details class="card" ${i === 0 ? 'open' : ''}>
            <summary><span class="${scoreClass(a.r.score)}">${a.r.score}</span> · ${esc(a.q.q)}</summary>
            <div class="small muted">${esc(catLabel(a.q.category))} · ${a.r.words} words · ${fmtTime(a.r.seconds)} · ${a.r.fillers.total} fillers</div>
            ${Feedback.coverageList(a.r.coverage)}
            <details class="mt"><summary>Your answer</summary><p class="small">${esc(a.ans.text)}</p></details>
            <a class="btn sm mt" href="#/drill/q/${a.q.id}">Practice this one with the model answer →</a>
          </details>`).join('')}
        <div class="row mt"><button class="btn primary" data-act="again">🎤 Another mock</button><a class="btn" href="#/progress">See progress</a></div>`;
      window.scrollTo(0, 0);
    }

    // Single dispatcher for the whole view (handlers must not accumulate
    // across the start / question / report screens).
    on(main, 'click', '[data-act]', (e, el) => {
      const act = el.getAttribute('data-act');
      if (act === 'start') { session = buildSession(qs('[data-el=focus]', main).value); index = 0; answers = []; renderQuestion(); }
      else if (act === 'listen-q' && session) root.Speech.speak(session[index].q);
      else if (act === 'abort') { if (confirm('Leave the mock interview? Progress will be lost.')) { if (panel) panel.destroy(); renderStart(); } }
      else if (act === 'again') renderStart();
    });

    renderStart();
    return { destroy() { if (panel) panel.destroy(); } };
  };
})(window);
