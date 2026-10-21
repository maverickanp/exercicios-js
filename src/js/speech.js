// Text-to-speech (the "interviewer" voice) and speech-to-text (your answer),
// built on the Web Speech API. Chrome/Edge have the best support.
(function (root) {
  const synth = root.speechSynthesis || null;
  const Recognition = root.SpeechRecognition || root.webkitSpeechRecognition || null;
  let voices = [];
  let currentUtterance = null;

  function loadVoices() { voices = synth ? synth.getVoices() : []; }
  if (synth) {
    loadVoices();
    if (typeof synth.addEventListener === 'function') synth.addEventListener('voiceschanged', loadVoices);
    else synth.onvoiceschanged = loadVoices;
  }

  function englishVoices() {
    if (!voices.length) loadVoices();
    return voices.filter((v) => /^en[-_]/i.test(v.lang));
  }

  function settings() { return Storage.get('settings', {}); }

  function pickVoice() {
    const list = englishVoices();
    if (!list.length) return null;
    const wanted = settings().voice;
    if (wanted) {
      const found = list.find((v) => v.name === wanted);
      if (found) return found;
    }
    // Prefer natural-sounding en-US voices when available.
    const prefs = [/natural/i, /google us english/i, /microsoft (aria|jenny|guy)/i, /samantha/i, /en-US/i];
    for (const re of prefs) {
      const f = list.find((v) => re.test(v.name) || re.test(v.lang));
      if (f) return f;
    }
    return list[0];
  }

  function rate() { const r = Number(settings().rate); return r && r > 0 ? r : 1; }

  function speak(text, opts) {
    opts = opts || {};
    if (!synth) { if (opts.onend) opts.onend(); return null; }
    cancel();
    const u = new SpeechSynthesisUtterance(String(text));
    const v = pickVoice();
    if (v) u.voice = v;
    u.lang = (v && v.lang) || 'en-US';
    u.rate = opts.rate || rate();
    u.pitch = 1;
    u.onstart = () => { if (opts.onstart) opts.onstart(); };
    u.onend = () => { currentUtterance = null; if (opts.onend) opts.onend(); };
    u.onerror = (e) => { currentUtterance = null; if (opts.onend && e.error !== 'interrupted') opts.onend(); };
    currentUtterance = u;
    synth.speak(u);
    return u;
  }

  function cancel() {
    if (synth) synth.cancel();
    currentUtterance = null;
  }

  function isSpeaking() { return !!(synth && synth.speaking); }

  // Reads one sentence at a time so you can repeat after the voice.
  // Returns a controller: { next(), repeat(), stop(), index }
  function shadow(sentences, hooks) {
    hooks = hooks || {};
    let i = 0;
    let stopped = false;
    const ctl = {
      get index() { return i; },
      play() {
        if (stopped || i >= sentences.length) { if (hooks.onDone) hooks.onDone(); return; }
        if (hooks.onSentence) hooks.onSentence(i, sentences[i]);
        speak(sentences[i], { rate: hooks.rate, onend: () => { if (hooks.onSentenceEnd) hooks.onSentenceEnd(i); } });
      },
      next() { i = Math.min(sentences.length, i + 1); ctl.play(); },
      prev() { i = Math.max(0, i - 1); ctl.play(); },
      repeat() { ctl.play(); },
      stop() { stopped = true; cancel(); },
    };
    return ctl;
  }

  // Speech recognition. Keeps listening (auto-restarts on silence) until stop().
  function listen(hooks) {
    hooks = hooks || {};
    if (!Recognition) { if (hooks.onError) hooks.onError('unsupported'); return null; }
    const rec = new Recognition();
    rec.lang = 'en-US';
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    let active = true;
    let finalText = '';
    rec.onresult = (e) => {
      let interim = '';
      for (let k = e.resultIndex; k < e.results.length; k += 1) {
        const r = e.results[k];
        if (r.isFinal) finalText += r[0].transcript + ' ';
        else interim += r[0].transcript;
      }
      if (hooks.onResult) hooks.onResult(finalText.trim(), interim.trim());
    };
    rec.onerror = (e) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return; // harmless; onend restarts
      active = false;
      if (hooks.onError) hooks.onError(e.error);
    };
    rec.onend = () => {
      if (active) { try { rec.start(); } catch (err) { /* already started */ } }
      else if (hooks.onEnd) hooks.onEnd(finalText.trim());
    };
    try { rec.start(); } catch (err) { if (hooks.onError) hooks.onError(String(err)); return null; }
    return {
      stop() { active = false; try { rec.stop(); } catch (err) { /* ignore */ } },
      get text() { return finalText.trim(); },
    };
  }

  root.Speech = {
    supported: { tts: !!synth, stt: !!Recognition },
    englishVoices, pickVoice, speak, cancel, isSpeaking, shadow, listen,
    isSecure: root.isSecureContext !== false,
  };
})(window);
