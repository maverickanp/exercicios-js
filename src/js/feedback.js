// Renders the feedback after an answer: score, key-point coverage, delivery
// stats, model answer with listen/shadow controls, follow-ups, vocabulary.
(function (root) {
  const { esc, qs, qsa, fmtTime, splitSentences, scoreClass } = root.UI;

  function coverageList(cov) {
    return '<ul class="kp">' + cov.items.map((i) => `
      <li class="${i.covered ? 'ok' : 'miss'}">
        <span>${i.covered ? '✅' : '⬜'}</span>
        <span>${esc(i.label)}${i.covered && i.matched ? ` <span class="muted tiny">(you said "${esc(i.matched)}")</span>` : ''}
          ${!i.covered && i.tip ? `<span class="tip">💡 ${esc(i.tip)}</span>` : ''}
        </span>
      </li>`).join('') + '</ul>';
  }

  function deliveryStats(r) {
    const paceCls = r.pace === 'good' ? 'pill-ok' : 'pill-warn';
    const lenCls = r.length === 'good' ? 'pill-ok' : 'pill-warn';
    const fillCls = r.fillers.total === 0 ? 'pill-ok' : r.fillers.total <= 3 ? 'pill-warn' : 'pill-bad';
    const fillerList = Object.keys(r.fillers.found).map((f) => `${f}×${r.fillers.found[f]}`).join(', ');
    return `
      <div class="row" style="gap:1.5rem">
        <div class="stat"><b>${r.words}</b><span class="lbl">words</span><span class="tiny ${lenCls}">${esc(r.length)}</span></div>
        <div class="stat"><b>${fmtTime(r.seconds)}</b><span class="lbl">duration</span></div>
        <div class="stat"><b>${r.wpm || '–'}</b><span class="lbl">words/min</span><span class="tiny ${paceCls}">${esc(r.pace)}</span></div>
        <div class="stat"><b class="${fillCls}">${r.fillers.total}</b><span class="lbl">fillers</span><span class="tiny muted">${esc(fillerList || 'none 🎉')}</span></div>
      </div>`;
  }

  function modelSection(item) {
    if (!item.model) return '';
    const sentences = splitSentences(item.model);
    return `
      <details data-el="model">
        <summary>📝 Model answer (reveal after you tried)</summary>
        <div class="row mb0">
          <button class="btn sm" data-act="listen-model">🔊 Listen</button>
          <button class="btn sm accent" data-act="shadow-model">🗣️ Shadow sentence by sentence</button>
          <span class="row" data-el="shadow-controls" hidden>
            <button class="btn sm" data-act="shadow-repeat">↻ Repeat</button>
            <button class="btn sm" data-act="shadow-prev">◀</button>
            <button class="btn sm" data-act="shadow-next">Next ▶</button>
            <button class="btn sm ghost" data-act="shadow-stop">■ Stop</button>
          </span>
        </div>
        <p class="model-answer mt">${sentences.map((s, i) => `<span class="sentence" data-i="${i}">${esc(s)}</span>`).join(' ')}</p>
        <div class="coach">Shadowing: ouça a frase, pause, repita em voz alta imitando ritmo e entonação. Depois clique em Next. Faça duas passadas: a primeira lendo, a segunda sem ler.</div>
      </details>`;
  }

  function extras(item, opts) {
    let html = '';
    if (item.followUps && item.followUps.length) {
      html += `<details><summary>🔁 Likely follow-up questions</summary><ul>${item.followUps.map((f) => `<li>${esc(f)} <button class="btn sm ghost" data-act="say" data-text="${esc(f)}">🔊</button></li>`).join('')}</ul></details>`;
    }
    if (item.vocab && item.vocab.length) {
      html += `<details><summary>📚 Vocabulary to own</summary><ul>${item.vocab.map((v) => `<li><b>${esc(v.term)}</b> — ${esc(v.meaning)} <button class="btn sm ghost" data-act="say" data-text="${esc(v.term)}">🔊</button></li>`).join('')}</ul></details>`;
    }
    if (item.pitfalls && item.pitfalls.length) {
      html += `<details><summary>⚠️ Common pitfalls</summary><ul>${item.pitfalls.map((p) => `<li>${esc(p)}</li>`).join('')}</ul></details>`;
    }
    if (item.pt && opts.showCoach !== false) html += `<div class="coach">${esc(item.pt)}</div>`;
    return html;
  }

  // result: Scoring.overall(...) ; item: question/snippet ; opts: { selfRating, showModel }
  function render(result, item, opts) {
    opts = opts || {};
    const score = result.score;
    return `
      <div class="card">
        <div class="row" style="gap:1.5rem; align-items:flex-start">
          <div class="score-ring" style="--pct:${score}"><span class="${scoreClass(score)}">${score}</span></div>
          <div style="flex:1; min-width: 240px">
            <h3 class="mb0">Key points covered: ${result.coverage.covered}/${result.coverage.total}</h3>
            <p class="small muted">The scorer looks for the ideas an interviewer expects to hear. It's a guide, not a judge: you may have said it with other words.</p>
            ${coverageList(result.coverage)}
          </div>
        </div>
        <h3 class="mt">Delivery</h3>
        ${deliveryStats(result)}
        ${opts.selfRating === false ? '' : `
        <h3 class="mt">Self-assessment <span class="muted small">(be honest, this is for you)</span></h3>
        <div class="row" style="gap:1.5rem">
          <label class="rating small">Clarity <input type="range" min="1" max="5" value="3" data-rating="clarity"></label>
          <label class="rating small">Structure <input type="range" min="1" max="5" value="3" data-rating="structure"></label>
          <label class="rating small">Confidence <input type="range" min="1" max="5" value="3" data-rating="confidence"></label>
        </div>`}
      </div>
      <div class="card">
        ${opts.showModel === false ? '' : modelSection(item)}
        ${extras(item, opts)}
      </div>`;
  }

  // Wires listen/shadow/say buttons inside `container`.
  function mount(container) {
    let shadowCtl = null;
    function highlight(i) {
      qsa('.sentence', container).forEach((s) => s.classList.toggle('active', Number(s.getAttribute('data-i')) === i));
    }
    container.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-act]');
      if (!btn || !container.contains(btn)) return;
      const act = btn.getAttribute('data-act');
      const model = qs('[data-el=model]', container);
      if (act === 'say') root.Speech.speak(btn.getAttribute('data-text'));
      else if (act === 'listen-model') {
        if (shadowCtl) { shadowCtl.stop(); shadowCtl = null; }
        const text = qsa('.sentence', model).map((s) => s.textContent).join(' ');
        root.Speech.speak(text);
      } else if (act === 'shadow-model') {
        const sentences = qsa('.sentence', model).map((s) => s.textContent);
        qs('[data-el=shadow-controls]', model).hidden = false;
        if (shadowCtl) shadowCtl.stop();
        shadowCtl = root.Speech.shadow(sentences, {
          onSentence: highlight,
          onDone: () => { highlight(-1); },
        });
        shadowCtl.play();
      } else if (act === 'shadow-repeat' && shadowCtl) shadowCtl.repeat();
      else if (act === 'shadow-next' && shadowCtl) shadowCtl.next();
      else if (act === 'shadow-prev' && shadowCtl) shadowCtl.prev();
      else if (act === 'shadow-stop') { if (shadowCtl) shadowCtl.stop(); shadowCtl = null; highlight(-1); qs('[data-el=shadow-controls]', model).hidden = true; }
    });
    return {
      ratings() {
        const out = {};
        qsa('[data-rating]', container).forEach((i) => { out[i.getAttribute('data-rating')] = Number(i.value); });
        return out;
      },
      destroy() { if (shadowCtl) shadowCtl.stop(); },
    };
  }

  root.Feedback = { render, mount, coverageList, deliveryStats };
})(window);
