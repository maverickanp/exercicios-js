// Progress: stats, per-category averages, flashcard boxes, history, backup.
(function (root) {
  root.Views = root.Views || {};
  const { esc, qs, on, toast, catLabel, scoreClass, fmtTime } = root.UI;

  root.Views.progress = function (main) {
    const App = root.App;
    const p = App.progress();
    const stats = Progress.stats(p);
    const streak = Progress.currentStreak(p);
    const srs = Srs.summary(App.data.flashcards.map((c) => c.id), Storage.get('srs', {}));
    const recent = (p.attempts || []).slice(-15).reverse();
    const cats = Object.keys(stats.byCategory).sort((a, b) => stats.byCategory[a].avg - stats.byCategory[b].avg);
    const mocks = (p.mocks || []).slice(-6);
    const days = Object.keys(p.days || {}).sort().slice(-14);

    main.innerHTML = `
      <h1>Progress</h1>
      <div class="coach">Olhe para a categoria com menor média: é o seu foco da semana. Média acima de 75 na categoria = pronto. Compare também o mock do dia 7 com o do dia 14.</div>
      <div class="grid">
        <div class="card">
          <h3>Overview</h3>
          <div class="row" style="gap:1.5rem">
            <div class="stat"><b>🔥 ${streak}</b><span class="lbl">streak</span></div>
            <div class="stat"><b>${stats.activeDays}</b><span class="lbl">active days</span></div>
            <div class="stat"><b>${stats.attempts}</b><span class="lbl">answers</span></div>
            <div class="stat"><b class="${scoreClass(stats.avg)}">${stats.avg || '–'}</b><span class="lbl">avg score</span></div>
            <div class="stat"><b class="${scoreClass(stats.last10avg)}">${stats.last10avg || '–'}</b><span class="lbl">last 10</span></div>
          </div>
          <div class="row mt" style="gap:.25rem">${days.map((d) => { const n = Object.values(p.days[d]).reduce((s, v) => s + v, 0); return `<span class="chip static" title="${d}: ${n} activities">${d.slice(5)} · ${n}</span>`; }).join('') || '<span class="muted small">No activity yet.</span>'}</div>
        </div>
        <div class="card">
          <h3>Flashcards</h3>
          <div class="boxes">${[1, 2, 3, 4, 5].map((b) => `<div><b>${srs.boxes[b] || 0}</b>box ${b}</div>`).join('')}</div>
          <p class="small muted mt mb0">${srs.seen} of ${srs.total} cards learned · ${srs.due} due now</p>
        </div>
      </div>
      <div class="card">
        <h3>By category <span class="muted small">(weakest first)</span></h3>
        ${cats.length ? cats.map((c) => `
          <div class="row between small" style="margin:.35rem 0"><span>${esc(catLabel(c))} <span class="muted">· ${stats.byCategory[c].count}</span></span><b class="${scoreClass(stats.byCategory[c].avg)}">${stats.byCategory[c].avg}</b></div>
          <div class="bar"><i style="width:${stats.byCategory[c].avg}%"></i></div>`).join('') : '<p class="muted small">Answer a few questions to see your profile.</p>'}
      </div>
      ${mocks.length ? `<div class="card"><h3>Mock interviews</h3><div class="row" style="gap:1rem; align-items:flex-end">${mocks.map((m) => `<div class="stat" style="align-items:center"><b class="${scoreClass(m.score)}">${m.score}</b><span class="lbl">${new Date(m.at).toLocaleDateString()}</span></div>`).join('')}</div></div>` : ''}
      <div class="card">
        <h3>Recent answers</h3>
        ${recent.length ? `<table class="table"><tr><th>When</th><th>Question</th><th>Score</th><th>Covered</th><th>Words</th><th>Time</th></tr>
          ${recent.map((a) => `<tr><td class="small muted">${new Date(a.at).toLocaleString()}</td><td><a href="${a.kind === 'code' ? '#/code/' + a.id : a.kind === 'story' && a.id.startsWith('story-') ? '#/stories/' + a.id.slice(6) : '#/drill/q/' + a.id}">${esc(a.question)}</a> <span class="tag">${esc(a.kind)}</span></td><td class="${scoreClass(a.score)}"><b>${a.score}</b></td><td>${a.covered}/${a.total}</td><td>${a.words}</td><td>${fmtTime(a.seconds)}</td></tr>`).join('')}</table>` : '<p class="muted small">Nothing yet.</p>'}
      </div>
      <div class="card">
        <h3>Backup</h3>
        <p class="small muted">Everything is stored in this browser only. Export to keep a copy or move to another device.</p>
        <div class="row">
          <button class="btn" data-act="export">⬇️ Export JSON</button>
          <label class="btn">⬆️ Import JSON <input type="file" accept="application/json" data-el="import" hidden></label>
          <button class="btn danger ghost" data-act="reset">Reset all data</button>
        </div>
      </div>`;

    on(main, 'click', '[data-act=export]', () => {
      const blob = new Blob([JSON.stringify(Storage.exportAll(), null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'dotnet-interview-coach-' + Progress.dayKey() + '.json';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });
    on(main, 'change', '[data-el=import]', (e, el) => {
      const f = el.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = () => { try { Storage.importAll(JSON.parse(r.result)); toast('Imported.'); root.App.refresh(); } catch (err) { toast('Invalid file.'); } };
      r.readAsText(f);
    });
    on(main, 'click', '[data-act=reset]', () => { if (confirm('Delete all progress, stories and flashcard history?')) { Storage.clearAll(); toast('Reset.'); root.App.applySettings(); root.App.refresh(); } });
    return null;
  };
})(window);
