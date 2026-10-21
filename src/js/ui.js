// Tiny DOM/UI helpers shared by all views.
(function (root) {
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function qs(sel, el) { return (el || document).querySelector(sel); }
  function qsa(sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); }
  // Event delegation: on(root, 'click', '[data-action]', (e, el) => ...)
  function on(rootEl, event, selector, handler) {
    rootEl.addEventListener(event, (e) => {
      let node = e.target;
      while (node && node !== rootEl) {
        if (node.matches && node.matches(selector)) return handler(e, node);
        node = node.parentNode;
      }
      return undefined;
    });
  }
  function fmtTime(seconds) {
    const s = Math.max(0, Math.round(seconds));
    const m = Math.floor(s / 60);
    return m + ':' + String(s % 60).padStart(2, '0');
  }
  let toastTimer = null;
  function toast(msg) {
    const t = qs('#toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function splitSentences(text) {
    return String(text || '').match(/[^.!?]+[.!?]+["']?|[^.!?]+$/g)?.map((s) => s.trim()).filter(Boolean) || [];
  }
  function scoreClass(score) { return score >= 75 ? 'pill-ok' : score >= 50 ? 'pill-warn' : 'pill-bad'; }
  const CATEGORY_LABELS = {
    csharp: 'C# language', dotnet: '.NET runtime', aspnet: 'ASP.NET Core', efcore: 'EF Core',
    architecture: 'Architecture', testing: 'Testing', 'behavioral-tech': 'Tech communication', behavioral: 'Behavioral', code: 'Code Talk', story: 'My story',
  };
  function catLabel(c) { return CATEGORY_LABELS[c] || c; }

  root.UI = { esc, qs, qsa, on, fmtTime, toast, shuffle, pick, uid, splitSentences, scoreClass, catLabel, CATEGORY_LABELS };
})(window);
