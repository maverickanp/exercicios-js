// Streaks, activity log and daily-plan completion. Pure functions over a
// `progress` object so they can be unit tested.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Progress = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  function dayKey(ts) {
    const d = new Date(ts == null ? Date.now() : ts);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }

  function empty() {
    return { startedAt: null, days: {}, attempts: [], planDone: {} };
  }

  // Marks activity for today. kind: 'drill' | 'flashcards' | 'story' | 'code' | 'mock' | 'phrases'
  function touch(progress, kind, now) {
    now = now == null ? Date.now() : now;
    const p = progress || empty();
    if (!p.startedAt) p.startedAt = now;
    const key = dayKey(now);
    p.days[key] = p.days[key] || {};
    p.days[key][kind] = (p.days[key][kind] || 0) + 1;
    return p;
  }

  function currentStreak(progress, now) {
    now = now == null ? Date.now() : now;
    const p = progress || empty();
    let streak = 0;
    let cursor = now;
    // Today counts if active; otherwise start counting from yesterday.
    if (!p.days[dayKey(cursor)]) cursor -= 24 * 60 * 60 * 1000;
    while (p.days[dayKey(cursor)]) {
      streak += 1;
      cursor -= 24 * 60 * 60 * 1000;
    }
    return streak;
  }

  // Which plan day the learner is on (1-based), based on completed days.
  function currentPlanDay(progress, totalDays) {
    const p = progress || empty();
    const done = Object.keys(p.planDone || {}).map(Number).filter((n) => p.planDone[n] === true);
    const max = done.length ? Math.max.apply(null, done) : 0;
    return Math.min(totalDays, max + 1);
  }

  function activeDaysCount(progress) {
    return Object.keys((progress || empty()).days).length;
  }

  function addAttempt(progress, attempt) {
    const p = progress || empty();
    p.attempts = p.attempts || [];
    p.attempts.push(attempt);
    if (p.attempts.length > 500) p.attempts = p.attempts.slice(-500);
    return p;
  }

  function stats(progress) {
    const p = progress || empty();
    const attempts = p.attempts || [];
    const byCategory = {};
    let sum = 0;
    attempts.forEach((a) => {
      sum += a.score || 0;
      const c = a.category || 'other';
      byCategory[c] = byCategory[c] || { count: 0, sum: 0 };
      byCategory[c].count += 1;
      byCategory[c].sum += a.score || 0;
    });
    const cats = {};
    Object.keys(byCategory).forEach((c) => {
      cats[c] = { count: byCategory[c].count, avg: Math.round(byCategory[c].sum / byCategory[c].count) };
    });
    const last10 = attempts.slice(-10);
    const last10avg = last10.length ? Math.round(last10.reduce((s, a) => s + (a.score || 0), 0) / last10.length) : 0;
    return {
      attempts: attempts.length,
      avg: attempts.length ? Math.round(sum / attempts.length) : 0,
      last10avg,
      byCategory: cats,
      activeDays: activeDaysCount(p),
    };
  }

  return { dayKey, empty, touch, currentStreak, currentPlanDay, activeDaysCount, addAttempt, stats };
});
