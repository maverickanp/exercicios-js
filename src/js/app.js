// App shell: settings, router and shared helpers for views.
(function (root) {
  const { qs, qsa, toast } = root.UI;
  const DATA = root.DATA;

  const App = {
    data: DATA,
    allQuestions() { return DATA.questions.concat(DATA.behavioral.map((b) => Object.assign({ category: 'behavioral' }, b))); },
    findQuestion(id) { return App.allQuestions().find((q) => q.id === id) || null; },
    settings() { return Storage.get('settings', { coach: true, rate: 1, voice: null }); },
    saveSettings(patch) { const s = Object.assign(App.settings(), patch); Storage.set('settings', s); App.applySettings(); return s; },
    applySettings() {
      const s = App.settings();
      document.body.classList.toggle('coach-on', s.coach !== false);
      const t = qs('#coach-toggle'); if (t) t.checked = s.coach !== false;
      const r = qs('#rate-range'); if (r) r.value = s.rate || 1;
    },
    progress() { return Storage.get('progress', Progress.empty()); },
    saveProgress(p) { Storage.set('progress', p); return p; },
    touch(kind) { App.saveProgress(Progress.touch(App.progress(), kind)); },
    recordAttempt(attempt) {
      const p = Progress.touch(App.progress(), attempt.kind || 'drill');
      Progress.addAttempt(p, Object.assign({ at: Date.now() }, attempt));
      App.saveProgress(p);
    },
    navigate(hash) { location.hash = hash; },
    refresh() { render(); },
    // Parses "#/drill/q/abc?x=1" into { path: ['drill','q','abc'], query: {x:'1'} }
    route() {
      const raw = (location.hash || '#/home').replace(/^#\/?/, '');
      const [pathPart, queryPart] = raw.split('?');
      const path = pathPart.split('/').filter(Boolean);
      const query = {};
      (queryPart || '').split('&').filter(Boolean).forEach((kv) => {
        const [k, v] = kv.split('=');
        query[decodeURIComponent(k)] = decodeURIComponent(v || '');
      });
      return { path: path.length ? path : ['home'], query };
    },
  };

  let currentView = null;

  function render() {
    const r = App.route();
    const name = r.path[0];
    const view = root.Views[name] || root.Views.home;
    if (currentView && currentView.destroy) { try { currentView.destroy(); } catch (e) { /* ignore */ } }
    root.Speech.cancel();
    // Views attach delegated listeners to #main, so swap in a fresh element
    // on every navigation to drop the previous view's handlers.
    const old = qs('#main');
    const main = old.cloneNode(false);
    old.parentNode.replaceChild(main, old);
    window.scrollTo(0, 0);
    qsa('[data-route]').forEach((a) => a.classList.toggle('active', a.getAttribute('data-route') === name));
    try {
      currentView = view(main, { params: r.path.slice(1), query: r.query }) || null;
    } catch (err) {
      console.error(err);
      main.innerHTML = '<div class="card"><h2>Something went wrong</h2><pre class="code">' + root.UI.esc(err && err.stack || err) + '</pre></div>';
    }
  }

  function initVoices() {
    const sel = qs('#voice-select');
    const status = qs('#speech-status');
    function fill() {
      const list = root.Speech.englishVoices();
      const s = App.settings();
      sel.innerHTML = list.length
        ? list.map((v) => `<option value="${root.UI.esc(v.name)}" ${s.voice === v.name ? 'selected' : ''}>${root.UI.esc(v.name.replace(/^Microsoft |^Google /, ''))} (${root.UI.esc(v.lang)})</option>`).join('')
        : '<option value="">(no English voice found)</option>';
      if (!s.voice && list.length) { const p = root.Speech.pickVoice(); if (p) sel.value = p.name; }
      const parts = [];
      parts.push(root.Speech.supported.tts ? '🔊 Voice output: ok' : '🔇 Voice output: unavailable');
      parts.push(root.Speech.supported.stt ? '🎙️ Voice input: ok' : '🎙️ Voice input: needs Chrome/Edge');
      status.innerHTML = parts.join('<br>');
    }
    fill();
    if (root.speechSynthesis) root.speechSynthesis.addEventListener('voiceschanged', fill);
    sel.addEventListener('change', () => App.saveSettings({ voice: sel.value || null }));
  }

  function init() {
    App.applySettings();
    qs('#coach-toggle').addEventListener('change', (e) => App.saveSettings({ coach: e.target.checked }));
    qs('#rate-range').addEventListener('change', (e) => { App.saveSettings({ rate: Number(e.target.value) }); toast('Voice speed: ' + e.target.value + 'x'); });
    initVoices();
    window.addEventListener('hashchange', render);
    render();
  }

  root.App = App;
  document.addEventListener('DOMContentLoaded', init);
})(window);
