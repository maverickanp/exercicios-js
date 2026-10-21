// My Stories: STAR story builder + elevator pitch builder, with rehearsal.
(function (root) {
  root.Views = root.Views || {};
  const { esc, qs, qsa, on, toast, uid, splitSentences } = root.UI;

  const THEMES = ['ownership', 'conflict', 'failure', 'pressure', 'leadership', 'learning', 'design', 'teamwork', 'architecture', 'self-awareness'];
  const FIELDS = [
    { key: 'situation', label: 'Situation', hint: 'Where were you, what was the context? Two sentences max.', pt: 'Contexto curto: empresa/projeto, o problema. Não conte a história da empresa.',
      starters: ['At my previous company, we had', 'In my current role, the team was', 'Last year, we were facing', 'A few months ago, our', 'When I joined the project,'] },
    { key: 'task', label: 'Task', hint: 'What was YOUR responsibility or goal?', pt: 'Seu papel específico. "I was responsible for..." deixa claro que a história é sua.',
      starters: ['I was responsible for', 'My goal was to', 'I was asked to', 'I took it on myself to', 'My role was to'] },
    { key: 'action', label: 'Action', hint: 'What did you do, step by step? Use "I", not "we".', pt: 'A parte mais longa (50%). Verbos de ação em primeira pessoa: I proposed, I built, I measured, I talked to...',
      starters: ['The first thing I did was', 'I proposed', 'I decided to', 'I implemented', 'I set up', 'I talked to', 'I measured', 'Then I', 'I also'] },
    { key: 'result', label: 'Result', hint: 'What happened? Numbers if you have them.', pt: 'Resultado com número: tempo, %, bugs, dinheiro. Se não tiver número, descreva a mudança concreta.',
      starters: ['As a result,', 'In the end,', 'We reduced', 'It went from X to Y', 'The outcome was', 'We shipped on time and'] },
    { key: 'learning', label: 'What I learned', hint: 'One sentence of reflection.', pt: 'Uma frase. Mostra maturidade e fecha a história com elegância.',
      starters: ['What I learned was', 'Looking back, I would', 'The lesson for me was', 'Since then, I always'] },
  ];

  function stories() { return Storage.get('stories', []); }
  function saveStories(list) { Storage.set('stories', list); }
  function narrative(s) {
    return FIELDS.map((f) => (s[f.key] || '').trim()).filter(Boolean).join(' ');
  }

  // Key points for rehearsal: STAR signposts + the learner's own numbers/keywords.
  function storyKeyPoints(s) {
    const STAR = root.App.data.behavioral.find((b) => b.id === 'bh-challenging-project').keyPoints;
    const own = [];
    const numbers = (s.result || '').match(/\d+[%]?/g) || [];
    if (numbers.length) own.push({ label: 'Your result numbers (' + numbers.slice(0, 3).join(', ') + ')', terms: numbers.slice(0, 3), tip: 'Say the numbers out loud; they make the story credible.' });
    const words = (s.action || '').toLowerCase().match(/[a-z][a-z-]{6,}/g) || [];
    const stop = new Set(['because', 'through', 'without', 'between', 'another', 'already', 'something', 'everything', 'company', 'project', 'decided', 'proposed', 'implemented', 'responsible']);
    const uniq = Array.from(new Set(words.filter((w) => !stop.has(w)))).slice(0, 4);
    if (uniq.length) own.push({ label: 'Your own key terms (' + uniq.join(', ') + ')', terms: uniq, tip: 'These were in your written action; did you say them?' });
    return STAR.concat(own);
  }

  function renderList(main) {
    const list = stories();
    const pitch = Storage.get('pitch', null);
    main.innerHTML = `
      <h1>My Stories</h1>
      <p class="muted">Interviewers ask "tell me about a time when…". Prepare 5–6 real stories once, then reuse them for many questions.</p>
      <div class="coach">Escreva cada história em inglês simples, no formato STAR. Depois clique em "Rehearse" e conte sem ler. A meta não é decorar o texto, é internalizar a sequência: contexto → meu papel → o que EU fiz → resultado → aprendizado.</div>
      <div class="grid">
        <a class="card hero" href="#/stories/pitch" style="display:block">
          <h3 style="color:#fff">🎤 Elevator pitch</h3>
          <p class="muted mb0">"Tell me about yourself" in 60–90 seconds. ${pitch && pitch.text ? 'Ready ✓ · edit or rehearse' : 'Not built yet → build it first'}</p>
        </a>
        <a class="card" href="#/stories/new" style="display:block"><h3>＋ New STAR story</h3><p class="muted small mb0">Challenging project, conflict, failure, deadline, leadership…</p></a>
      </div>
      ${list.length ? `<div class="grid">${list.map((s) => `
        <a class="card" href="#/stories/${s.id}" style="display:block">
          <div class="row">${(s.themes || []).map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
          <h3 class="mt">${esc(s.title || 'Untitled story')}</h3>
          <p class="small muted mb0">${esc((s.situation || '').slice(0, 110))}${(s.situation || '').length > 110 ? '…' : ''}</p>
          <p class="tiny muted mb0 mt">${s.rehearsals ? s.rehearsals + ' rehearsal' + (s.rehearsals > 1 ? 's' : '') + ' · best ' + (s.best || 0) : 'never rehearsed'}</p>
        </a>`).join('')}</div>` : '<div class="empty">No stories yet. Start with "the most challenging project you worked on".</div>'}
      <div class="card">
        <h3>Which story for which question?</h3>
        <table class="table small">
          <tr><th>They ask…</th><th>Use a story tagged</th></tr>
          <tr><td>Most challenging project / something you're proud of</td><td>ownership, architecture</td></tr>
          <tr><td>Disagreement with a colleague or manager</td><td>conflict</td></tr>
          <tr><td>A mistake / a failure / difficult feedback</td><td>failure, self-awareness</td></tr>
          <tr><td>Tight deadline / pressure / quality vs speed</td><td>pressure</td></tr>
          <tr><td>Mentoring, leading without a title</td><td>leadership</td></tr>
          <tr><td>Unclear requirements / learning something new</td><td>learning, ownership</td></tr>
          <tr><td>A technical decision you'd change</td><td>design</td></tr>
        </table>
      </div>`;
  }

  function renderEditor(main, story) {
    const isNew = !story.id;
    const s = Object.assign({ id: uid(), title: '', themes: [], situation: '', task: '', action: '', result: '', learning: '' }, story);
    main.innerHTML = `
      <a class="small" href="#/stories">← My stories</a>
      <h1 class="mt">${isNew ? 'New story' : 'Edit story'}</h1>
      <div class="card">
        <div class="field"><label>Title (for you)</label><input type="text" data-f="title" value="${esc(s.title)}" placeholder="e.g. Migration of the orders monolith"></div>
        <div class="field"><label>Themes this story can answer</label>
          <div class="row">${THEMES.map((t) => `<span class="chip ${s.themes.includes(t) ? 'active' : ''}" data-theme="${t}">${t}</span>`).join('')}</div>
        </div>
        ${FIELDS.map((f) => `
          <div class="field">
            <label>${f.label} <span class="muted small" style="font-weight:400">— ${esc(f.hint)}</span></label>
            <div class="starters">${f.starters.map((st) => `<span class="chip" data-starter="${f.key}" data-text="${esc(st)}">${esc(st)}…</span>`).join('')}</div>
            <textarea data-f="${f.key}" placeholder="Write in English…">${esc(s[f.key])}</textarea>
            <div class="coach">${esc(f.pt)}</div>
          </div>`).join('')}
        <div class="row">
          <button class="btn primary" data-act="save">💾 Save story</button>
          ${isNew ? '' : '<button class="btn danger ghost" data-act="delete">Delete</button>'}
        </div>
      </div>
      <div class="card">
        <h3>Spoken version <span class="muted small">(this is what you'll say)</span></h3>
        <p class="model-answer" data-el="preview">${esc(narrative(s)) || '<span class="muted">Fill in the fields above…</span>'}</p>
        <div class="row">
          <button class="btn sm" data-act="listen">🔊 Listen</button>
          <span class="muted small" data-el="count"></span>
        </div>
      </div>
      ${isNew ? '' : `
      <div class="card">
        <h3>Rehearse</h3>
        <p class="small muted">Tell the story without reading. The scorer checks STAR structure, first-person action verbs, and your own numbers.</p>
        <div data-el="panel"></div>
        <div data-el="feedback"></div>
      </div>`}`;

    function collect() {
      qsa('[data-f]', main).forEach((el) => { s[el.getAttribute('data-f')] = el.value; });
      s.themes = qsa('[data-theme].active', main).map((el) => el.getAttribute('data-theme'));
      return s;
    }
    function refreshPreview() {
      collect();
      const text = narrative(s);
      qs('[data-el=preview]', main).innerHTML = esc(text) || '<span class="muted">Fill in the fields above…</span>';
      const words = Scoring.countWords(text);
      qs('[data-el=count]', main).textContent = words ? `${words} words ≈ ${Math.round(words / 140 * 60)} s at interview pace` : '';
    }
    refreshPreview();
    on(main, 'input', '[data-f]', refreshPreview);
    on(main, 'click', '[data-theme]', (e, el) => { el.classList.toggle('active'); });
    on(main, 'click', '[data-starter]', (e, el) => {
      const ta = qs(`textarea[data-f=${el.getAttribute('data-starter')}]`, main);
      const txt = el.getAttribute('data-text');
      ta.value = (ta.value.trim() ? ta.value.trim() + ' ' : '') + txt + ' ';
      ta.focus();
      refreshPreview();
    });
    on(main, 'click', '[data-act=listen]', () => root.Speech.speak(narrative(collect())));
    on(main, 'click', '[data-act=save]', () => {
      collect();
      if (!s.title.trim()) { toast('Give the story a title.'); return; }
      const list = stories();
      const i = list.findIndex((x) => x.id === s.id);
      s.updatedAt = Date.now();
      if (i >= 0) list[i] = s; else list.push(s);
      saveStories(list);
      root.App.touch('story');
      toast('Story saved.');
      if (isNew) location.hash = '#/stories/' + s.id;
    });
    on(main, 'click', '[data-act=delete]', () => {
      if (!confirm('Delete this story?')) return;
      saveStories(stories().filter((x) => x.id !== s.id));
      location.hash = '#/stories';
    });

    let panel = null; let fb = null;
    if (!isNew) {
      panel = root.AnswerPanel.mount(qs('[data-el=panel]', main), {
        targetSeconds: 120,
        onDone(ans) {
          const kps = storyKeyPoints(collect());
          const r = Scoring.overall(ans.text, kps, ans.seconds);
          const fbEl = qs('[data-el=feedback]', main);
          fbEl.innerHTML = Feedback.render(r, { model: narrative(s), pt: 'Compare o que você FALOU com o que ESCREVEU. Normalmente a versão falada perde o resultado e o aprendizado. Repita focando no fechamento.' }, { selfRating: false });
          if (fb) fb.destroy();
          fb = Feedback.mount(fbEl);
          const list = stories();
          const st = list.find((x) => x.id === s.id);
          if (st) { st.rehearsals = (st.rehearsals || 0) + 1; st.best = Math.max(st.best || 0, r.score); saveStories(list); s.rehearsals = st.rehearsals; s.best = st.best; }
          root.App.recordAttempt({ kind: 'story', id: 'story-' + s.id, category: 'story', question: s.title, score: r.score, covered: r.coverage.covered, total: r.coverage.total, words: r.words, seconds: Math.round(r.seconds), fillers: r.fillers.total, mode: ans.mode });
          fbEl.scrollIntoView({ behavior: 'smooth' });
        },
      });
    }
    return { destroy() { if (panel) panel.destroy(); if (fb) fb.destroy(); } };
  }

  const PITCH_FIELDS = [
    { key: 'role', label: 'Current role and years', ph: 'e.g. backend developer with 6 years in C# and .NET', pt: 'Uma frase: cargo + anos + stack principal.' },
    { key: 'now', label: 'What you do today', ph: 'e.g. I own the payments API: ASP.NET Core, EF Core, Azure Service Bus', pt: 'Responsabilidade atual, com tecnologias.' },
    { key: 'past', label: 'Before that (1–2 highlights)', ph: 'e.g. 3 years at a consultancy, migrated a .NET Framework monolith to .NET Core', pt: 'Só os destaques que interessam para a vaga.' },
    { key: 'win', label: 'Signature achievement (with a number)', ph: 'e.g. redesigned the settlement service, cut processing from 40 to 5 minutes', pt: 'Sua melhor conquista, com resultado mensurável.' },
    { key: 'why', label: 'Why this role / what you want next', ph: 'e.g. I want to own services end to end in an event-driven platform, which is exactly this role', pt: 'Conecte com a vaga. Pesquise a empresa.' },
  ];

  function buildPitch(p) {
    const parts = [];
    if (p.role) {
      const role = p.role.replace(/^(?:(?:i am|i'm)\s+)?(?:a|an)\s+/i, '').replace(/[.!?]+$/, '').trim();
      const art = /^[aeio]/i.test(role) ? 'an' : 'a'; // "UI developer" keeps "a"
      parts.push(`Sure. I'm ${art} ${role}.`);
    }
    if (p.now) parts.push(`Today, ${/^i /i.test(p.now) ? p.now : 'I ' + p.now}${/[.!?]$/.test(p.now) ? '' : '.'}`);
    if (p.past) parts.push(`Before that, ${/^i /i.test(p.past) ? p.past : 'I ' + p.past}${/[.!?]$/.test(p.past) ? '' : '.'}`);
    if (p.win) parts.push(`The project I'm proudest of: ${/^i /i.test(p.win) ? p.win : 'I ' + p.win}${/[.!?]$/.test(p.win) ? '' : '.'}`);
    if (p.why) parts.push(`Going forward, ${p.why}${/[.!?]$/.test(p.why) ? '' : '.'} I'm happy to go deeper on any of that.`);
    return parts.join(' ');
  }

  function renderPitch(main) {
    const p = Storage.get('pitch', { role: '', now: '', past: '', win: '', why: '', text: '' });
    const intro = root.App.data.behavioral.find((b) => b.id === 'bh-tell-me-about-yourself');
    main.innerHTML = `
      <a class="small" href="#/stories">← My stories</a>
      <h1 class="mt">Elevator pitch: "Tell me about yourself"</h1>
      <p class="muted">Present → past → signature win → why this role. 60–90 seconds. This is the one answer you must know cold.</p>
      <div class="coach">Preencha os campos em inglês simples. O app monta um rascunho com os conectores certos ("Today… Before that… Going forward…"). Edite o texto final com suas palavras, ouça, faça shadowing e ensaie até sair sem ler.</div>
      <div class="card">
        ${PITCH_FIELDS.map((f) => `
          <div class="field">
            <label>${esc(f.label)}</label>
            <input type="text" data-p="${f.key}" value="${esc(p[f.key] || '')}" placeholder="${esc(f.ph)}">
            <div class="coach">${esc(f.pt)}</div>
          </div>`).join('')}
        <button class="btn" data-act="generate">✨ Generate draft from the fields</button>
      </div>
      <div class="card">
        <h3>Your pitch <span class="muted small">(edit freely)</span></h3>
        <textarea class="answer" data-el="text" style="min-height:180px">${esc(p.text || '')}</textarea>
        <div class="row mt">
          <button class="btn primary" data-act="save">💾 Save</button>
          <button class="btn" data-act="listen">🔊 Listen</button>
          <span class="muted small" data-el="count"></span>
        </div>
        <details class="mt"><summary>See a model pitch</summary><p class="model-answer">${esc(intro.model)}</p></details>
      </div>
      <div class="card">
        <h3>Rehearse</h3>
        <p class="small muted">Say it without reading. Scored against what interviewers expect in an intro.</p>
        <div data-el="panel"></div>
        <div data-el="feedback"></div>
      </div>`;
    function collect() {
      PITCH_FIELDS.forEach((f) => { p[f.key] = qs(`[data-p=${f.key}]`, main).value; });
      p.text = qs('[data-el=text]', main).value;
      return p;
    }
    function count() {
      const w = Scoring.countWords(qs('[data-el=text]', main).value);
      qs('[data-el=count]', main).textContent = w ? `${w} words ≈ ${Math.round(w / 140 * 60)} s` : '';
    }
    count();
    on(main, 'input', '[data-el=text]', count);
    on(main, 'click', '[data-act=generate]', () => { collect(); qs('[data-el=text]', main).value = buildPitch(p); count(); });
    on(main, 'click', '[data-act=save]', () => { Storage.set('pitch', collect()); root.App.touch('story'); toast('Pitch saved.'); });
    on(main, 'click', '[data-act=listen]', () => root.Speech.speak(qs('[data-el=text]', main).value));
    let fb = null;
    const panel = root.AnswerPanel.mount(qs('[data-el=panel]', main), {
      targetSeconds: 90,
      onDone(ans) {
        const r = Scoring.overall(ans.text, intro.keyPoints, ans.seconds);
        const fbEl = qs('[data-el=feedback]', main);
        fbEl.innerHTML = Feedback.render(r, { model: qs('[data-el=text]', main).value || intro.model, pt: intro.pt }, { selfRating: false });
        if (fb) fb.destroy();
        fb = Feedback.mount(fbEl);
        root.App.recordAttempt({ kind: 'story', id: intro.id, category: 'behavioral', question: intro.q, score: r.score, covered: r.coverage.covered, total: r.coverage.total, words: r.words, seconds: Math.round(r.seconds), fillers: r.fillers.total, mode: ans.mode });
        fbEl.scrollIntoView({ behavior: 'smooth' });
      },
    });
    return { destroy() { panel.destroy(); if (fb) fb.destroy(); } };
  }

  root.Views.stories = function (main, ctx) {
    const [id] = ctx.params;
    if (id === 'pitch') return renderPitch(main);
    if (id === 'new') return renderEditor(main, {});
    if (id) {
      const s = stories().find((x) => x.id === id);
      if (!s) { main.innerHTML = '<div class="empty">Story not found. <a href="#/stories">Back</a></div>'; return null; }
      return renderEditor(main, s);
    }
    renderList(main);
    return null;
  };
})(window);
