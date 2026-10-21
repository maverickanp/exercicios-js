// Text-to-speech (the "interviewer" voice) and speech-to-text (your answer),
// built on the Web Speech API. Chrome/Edge have the best support.
(function (root) {
  const synth = root.speechSynthesis || null;
  const Recognition = root.SpeechRecognition || root.webkitSpeechRecognition || null;
  let voices = [];
  // Identity of the speak() call currently playing; cancel() clears it so
  // callbacks from superseded utterances are ignored.
  let currentToken = null;

  function loadVoices() { voices = synth ? synth.getVoices() : []; }
  if (synth) {
    loadVoices();
    if (typeof synth.addEventListener === 'function') synth.addEventListener('voiceschanged', loadVoices);
    else synth.onvoiceschanged = loadVoices;
  }

  // Browsers gate synthesis behind a user gesture: iOS WebKit silently drops
  // speak() until one speak() has run inside a gesture, and Chrome rejects it
  // with 'not-allowed' until the page has been interacted with. The views
  // auto-read questions from a hashchange + timer, outside any gesture, so we
  // unlock on the first real click (capture runs before the link navigation).
  if (synth && root.document) {
    root.document.addEventListener('click', () => {
      if (!synth.speaking && !synth.pending) synth.speak(new SpeechSynthesisUtterance(''));
    }, { capture: true, once: true });
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

  // Chrome's network (Google) voices stop a single utterance after ~15 s and
  // never fire onend (crbug 679437), so long texts are spoken as a chain of
  // short chunks: one per sentence, split again at commas/spaces when a
  // sentence is itself too long.
  const MAX_CHUNK = 160;
  function chunks(text) {
    const parts = String(text == null ? '' : text).match(/[^.!?]+[.!?]+["']?|[^.!?]+$/g) || [String(text)];
    const out = [];
    parts.forEach((part) => {
      let s = part.trim();
      while (s.length > MAX_CHUNK) {
        let cut = s.lastIndexOf(', ', MAX_CHUNK);
        if (cut < MAX_CHUNK / 2) cut = s.lastIndexOf(' ', MAX_CHUNK);
        if (cut < 1) cut = MAX_CHUNK;
        out.push(s.slice(0, cut + 1).trim());
        s = s.slice(cut + 1).trim();
      }
      if (s) out.push(s);
    });
    return out.length ? out : [''];
  }

  function speak(text, opts) {
    opts = opts || {};
    if (!synth) { if (opts.onend) opts.onend(); return null; }
    cancel();
    const parts = chunks(text);
    const v = pickVoice();
    const token = { text: String(text) };
    currentToken = token;
    const say = (i) => {
      const u = new SpeechSynthesisUtterance(parts[i]);
      if (v) u.voice = v;
      u.lang = (v && v.lang) || 'en-US';
      u.rate = opts.rate || rate();
      u.pitch = 1;
      if (i === 0) u.onstart = () => { if (opts.onstart) opts.onstart(); };
      u.onend = () => {
        if (currentToken !== token) return; // cancelled or superseded by a newer speak()
        if (i + 1 < parts.length) { say(i + 1); return; }
        currentToken = null;
        if (opts.onend) opts.onend();
      };
      u.onerror = (e) => {
        if (currentToken !== token) return;
        if (e.error === 'interrupted' || e.error === 'canceled') return;
        currentToken = null;
        if (e.error === 'not-allowed' && root.UI) root.UI.toast('Tap 🔊 to hear it read aloud.');
        if (opts.onend) opts.onend();
      };
      synth.speak(u);
    };
    say(0);
    return token;
  }

  function cancel() {
    currentToken = null;
    if (synth) synth.cancel();
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
      if (!active) return; // stop() was already called: a late error must not reach the caller
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
    englishVoices, pickVoice, speak, cancel, isSpeaking, shadow, listen, chunks,
    isSecure: root.isSecureContext !== false,
  };
})(window);
