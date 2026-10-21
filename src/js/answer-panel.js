// The reusable "answer a question" widget: timer + voice/typed input.
// Used by the drill, the mock interview, Code Talk and story rehearsal.
//
//   AnswerPanel.mount(container, {
//     targetSeconds: 120,
//     onDone({ text, seconds, mode }) {},
//     onCancel() {}
//   })
(function (root) {
  const { esc, qs, fmtTime, toast } = root.UI;

  function mount(container, opts) {
    opts = opts || {};
    const target = opts.targetSeconds || 120;
    let mode = null; // 'voice' | 'type'
    let startedAt = null;
    let timerId = null;
    let recognizer = null;
    let finalText = '';
    let interimText = '';

    const sttOk = root.Speech.supported.stt;
    container.innerHTML = `
      <div class="answer-panel">
        <div class="row between">
          <div class="row">
            <span class="timer" data-el="timer">0:00</span>
            <span class="muted small">target ~${fmtTime(target)}</span>
          </div>
          <div class="row" data-el="controls">
            <button class="btn primary" data-act="voice" ${sttOk ? '' : 'disabled title="Speech recognition is not available in this browser. Use Chrome or Edge."'}>🎙️ Answer by voice</button>
            <button class="btn" data-act="type">⌨️ Answer by typing</button>
          </div>
        </div>
        ${sttOk ? '' : '<p class="small muted mt">Voice input needs Chrome or Edge (and http://localhost or https). You can still type your answer.</p>'}
        <div data-el="body" class="mt"></div>
        <div class="row mt" data-el="footer" hidden>
          <button class="btn primary" data-act="done">✅ I'm done</button>
          <button class="btn ghost" data-act="restart">↺ Restart</button>
          <span class="muted small" data-el="hint"></span>
        </div>
      </div>`;

    const timerEl = qs('[data-el=timer]', container);
    const bodyEl = qs('[data-el=body]', container);
    const footerEl = qs('[data-el=footer]', container);
    const controlsEl = qs('[data-el=controls]', container);
    const hintEl = qs('[data-el=hint]', container);

    function elapsed() { return startedAt ? (Date.now() - startedAt) / 1000 : 0; }
    function tick() {
      const s = elapsed();
      timerEl.textContent = fmtTime(s);
      timerEl.classList.toggle('over', s > target);
    }
    function startTimer() { startedAt = Date.now(); clearInterval(timerId); timerId = setInterval(tick, 250); tick(); }
    function stopTimer() { clearInterval(timerId); timerId = null; }

    function renderVoice() {
      bodyEl.innerHTML = `
        <div class="row between">
          <span class="btn recording sm">● Listening… speak naturally</span>
          <span class="muted small">Transcript appears as you talk. You can edit it after you finish.</span>
        </div>
        <div class="transcript mt" data-el="transcript"><span class="muted">…</span></div>`;
    }
    function updateTranscript() {
      const t = qs('[data-el=transcript]', bodyEl);
      if (!t) return;
      t.innerHTML = esc(finalText) + (interimText ? ' <span class="interim">' + esc(interimText) + '</span>' : '') || '<span class="muted">…</span>';
    }
    function renderType() {
      bodyEl.innerHTML = `<textarea class="answer" data-el="text" placeholder="Speak the answer out loud while you type the key sentences… (English only)"></textarea>`;
      qs('[data-el=text]', bodyEl).focus();
    }

    function start(selectedMode) {
      mode = selectedMode;
      finalText = ''; interimText = '';
      controlsEl.hidden = true;
      footerEl.hidden = false;
      if (mode === 'voice') {
        renderVoice();
        recognizer = root.Speech.listen({
          onResult(fin, interim) { finalText = fin; interimText = interim; updateTranscript(); },
          onError(err) {
            toast('Microphone error: ' + err + '. Switching to typing.');
            mode = 'type';
            renderType();
            if (finalText) qs('[data-el=text]', bodyEl).value = finalText;
          },
        });
        hintEl.textContent = 'Tip: pause, breathe, then continue. Fillers like "um" are counted.';
      } else {
        renderType();
        hintEl.textContent = 'Tip: say every sentence out loud as you type it.';
      }
      startTimer();
      if (opts.onStart) opts.onStart(mode);
    }

    function stopInput() {
      if (recognizer) { recognizer.stop(); recognizer = null; }
      stopTimer();
    }

    function finish() {
      const seconds = elapsed();
      stopInput();
      let text = finalText;
      if (mode === 'type') text = qs('[data-el=text]', bodyEl).value;
      else if (interimText) text = (finalText + ' ' + interimText).trim();
      // Let the user fix recognition mistakes before scoring.
      bodyEl.innerHTML = `
        <p class="small muted">Review the transcript (fix recognition mistakes if needed), then score it.</p>
        <textarea class="answer" data-el="text">${esc(text)}</textarea>
        <div class="row mt">
          <button class="btn primary" data-act="score">📊 Score my answer</button>
          <button class="btn ghost" data-act="restart">↺ Try again</button>
        </div>`;
      footerEl.hidden = true;
      qs('[data-act=score]', bodyEl).onclick = () => {
        const finalAnswer = qs('[data-el=text]', bodyEl).value.trim();
        if (!finalAnswer) { toast('Say or type something first.'); return; }
        if (opts.onDone) opts.onDone({ text: finalAnswer, seconds, mode });
      };
      qs('[data-act=restart]', bodyEl).onclick = reset;
    }

    function reset() {
      stopInput();
      startedAt = null;
      timerEl.textContent = '0:00';
      timerEl.classList.remove('over');
      bodyEl.innerHTML = '';
      footerEl.hidden = true;
      controlsEl.hidden = false;
      hintEl.textContent = '';
      if (opts.onReset) opts.onReset();
    }

    container.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-act]');
      if (!btn || !container.contains(btn)) return;
      const act = btn.getAttribute('data-act');
      if (act === 'voice') start('voice');
      else if (act === 'type') start('type');
      else if (act === 'done') finish();
      else if (act === 'restart') reset();
    });

    return {
      destroy() { stopInput(); },
      start,
      reset,
    };
  }

  root.AnswerPanel = { mount };
})(window);
