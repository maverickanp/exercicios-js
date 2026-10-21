// Today: streak, current plan day with checklist, quick actions.
(function (root) {
  root.Views = root.Views || {};
  const { esc, qs, on, toast } = root.UI;

  root.Views.home = function (main, ctx) {
    const App = root.App;
    const plan = App.data.plan;
    let progress = App.progress();
    const requested = Number(ctx.query.day);
    const currentDay = requested >= 1 && requested <= plan.length ? requested : Progress.currentPlanDay(progress, plan.length);
    const day = plan[currentDay - 1];
    const streak = Progress.currentStreak(progress);
    const srs = Srs.summary(App.data.flashcards.map((c) => c.id), Storage.get('srs', {}));
    const stats = Progress.stats(progress);
    const taskState = (progress.planTasks && progress.planTasks[currentDay]) || {};
    const doneCount = day.tasks.filter((_, i) => taskState[i]).length;
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    main.innerHTML = `
      <div class="card hero">
        <div class="row between">
          <div>
            <h1>${greeting}. Ready to practice?</h1>
            <p class="muted mb0">Everything here is in English on purpose: the interview will be too. Say your answers out loud, even when typing.</p>
          </div>
          <div class="stat" style="text-align:right"><span class="streak">🔥 ${streak}</span><span class="lbl" style="color:rgba(255,255,255,.85)">day streak</span></div>
        </div>
        <div class="row mt">
          <a class="btn primary" href="#/drill/random">🎯 Random question</a>
          <a class="btn" href="#/flashcards">🃏 ${srs.due + Math.min(10, srs.unseen)} cards to review</a>
          <a class="btn" href="#/mock">🎤 Mock interview</a>
        </div>
      </div>

      <div class="coach">Como usar: faça o plano do dia (20–40 min). Em cada pergunta: 1) ouça o entrevistador, 2) responda em voz alta com o cronômetro, 3) veja os pontos-chave que faltaram, 4) faça shadowing da resposta-modelo, 5) responda de novo. A repetição em voz alta é o que constrói fluência, não a leitura.</div>

      <div class="card">
        <div class="row between">
          <div>
            <span class="tag">Day ${day.day} of ${plan.length}</span>
            <h2 class="mt" style="margin-top:.4rem">${esc(day.title)}</h2>
            <p class="muted">${esc(day.focus)}</p>
          </div>
          <div class="row">
            <a class="btn sm" href="#/home?day=${Math.max(1, currentDay - 1)}" ${currentDay === 1 ? 'style="visibility:hidden"' : ''}>◀ Prev</a>
            <a class="btn sm" href="#/home?day=${Math.min(plan.length, currentDay + 1)}" ${currentDay === plan.length ? 'style="visibility:hidden"' : ''}>Next ▶</a>
          </div>
        </div>
        <div class="coach">${esc(day.pt)}</div>
        <div data-el="tasks">
          ${day.tasks.map((t, i) => `
            <div class="task ${taskState[i] ? 'done' : ''}">
              <input type="checkbox" id="task-${i}" data-task="${i}" ${taskState[i] ? 'checked' : ''}>
              <label for="task-${i}">${esc(t.label)}</label>
              <a class="btn sm" href="${esc(t.route)}">Open →</a>
            </div>`).join('')}
        </div>
        <div class="row between mt">
          <span class="muted small">${doneCount}/${day.tasks.length} done</span>
          <button class="btn ${progress.planDone && progress.planDone[currentDay] ? '' : 'primary'}" data-act="complete-day">${progress.planDone && progress.planDone[currentDay] ? '✓ Day completed (undo)' : '🏁 Mark day as complete'}</button>
        </div>
      </div>

      <div class="grid">
        <div class="card">
          <h3>Your numbers</h3>
          <div class="row" style="gap:1.5rem">
            <div class="stat"><b>${stats.attempts}</b><span class="lbl">answers</span></div>
            <div class="stat"><b>${stats.avg || '–'}</b><span class="lbl">avg score</span></div>
            <div class="stat"><b>${stats.last10avg || '–'}</b><span class="lbl">last 10</span></div>
            <div class="stat"><b>${stats.activeDays}</b><span class="lbl">active days</span></div>
          </div>
          <a class="small" href="#/progress">See progress →</a>
        </div>
        <div class="card">
          <h3>The 14-day plan</h3>
          <div class="row">
            ${plan.map((d) => `<a class="chip ${d.day === currentDay ? 'active' : ''} ${progress.planDone && progress.planDone[d.day] ? 'static' : ''}" href="#/home?day=${d.day}" title="${esc(d.title)}">${progress.planDone && progress.planDone[d.day] ? '✓' : ''} ${d.day}</a>`).join('')}
          </div>
          <p class="small muted mt">Week 1: language and runtime. Week 2: architecture, behavioral and full mocks.</p>
        </div>
        <div class="card">
          <h3>How the scoring works</h3>
          <p class="small">Each question has the key points an interviewer expects. After you answer, the app checks which ones you mentioned, counts words, pace and filler words, and gives a 0–100 score. Use it to find gaps, then shadow the model answer.</p>
        </div>
      </div>`;

    on(main, 'change', '[data-task]', (e, el) => {
      progress = App.progress();
      progress.planTasks = progress.planTasks || {};
      progress.planTasks[currentDay] = progress.planTasks[currentDay] || {};
      progress.planTasks[currentDay][el.getAttribute('data-task')] = el.checked;
      App.saveProgress(progress);
      el.closest('.task').classList.toggle('done', el.checked);
    });
    on(main, 'click', '[data-act=complete-day]', () => {
      progress = App.progress();
      progress.planDone = progress.planDone || {};
      const was = !!progress.planDone[currentDay];
      progress.planDone[currentDay] = !was;
      if (!was) Progress.touch(progress, 'plan');
      App.saveProgress(progress);
      toast(was ? 'Day reopened.' : 'Day ' + currentDay + ' completed. Nice work! 🎉');
      App.refresh();
    });
  };
})(window);
