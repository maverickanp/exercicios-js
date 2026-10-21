// Small namespaced wrapper over localStorage with an in-memory fallback
// (private windows, blocked storage, Node tests).
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Storage = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const PREFIX = 'dic:';
  const memory = {};

  function backend() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(PREFIX + '__probe', '1');
        localStorage.removeItem(PREFIX + '__probe');
        return localStorage;
      }
    } catch (e) { /* fall through */ }
    return null;
  }

  function get(key, fallback) {
    const ls = backend();
    try {
      const raw = ls ? ls.getItem(PREFIX + key) : memory[PREFIX + key];
      if (raw == null) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function set(key, value) {
    const ls = backend();
    const raw = JSON.stringify(value);
    try {
      if (ls) ls.setItem(PREFIX + key, raw); else memory[PREFIX + key] = raw;
    } catch (e) {
      memory[PREFIX + key] = raw;
    }
    return value;
  }

  function remove(key) {
    const ls = backend();
    try { if (ls) ls.removeItem(PREFIX + key); } catch (e) { /* ignore */ }
    delete memory[PREFIX + key];
  }

  function update(key, fn, fallback) {
    return set(key, fn(get(key, fallback)));
  }

  function keys() {
    const ls = backend();
    const out = [];
    if (ls) {
      for (let i = 0; i < ls.length; i += 1) {
        const k = ls.key(i);
        if (k && k.indexOf(PREFIX) === 0) out.push(k.slice(PREFIX.length));
      }
    }
    Object.keys(memory).forEach((k) => { if (out.indexOf(k.slice(PREFIX.length)) < 0) out.push(k.slice(PREFIX.length)); });
    return out;
  }

  function exportAll() {
    const dump = {};
    keys().forEach((k) => { dump[k] = get(k); });
    return dump;
  }

  function importAll(dump) {
    Object.keys(dump || {}).forEach((k) => set(k, dump[k]));
  }

  function clearAll() {
    keys().forEach(remove);
  }

  return { get, set, remove, update, keys, exportAll, importAll, clearAll, PREFIX };
});
