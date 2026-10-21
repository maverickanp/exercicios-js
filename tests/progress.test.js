const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../src/js/core/progress.js');

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date(2026, 0, 10, 12).getTime();

test('touch records activity per day and kind', () => {
  let p = P.empty();
  p = P.touch(p, 'drill', NOW);
  p = P.touch(p, 'drill', NOW);
  p = P.touch(p, 'flashcards', NOW);
  const key = P.dayKey(NOW);
  assert.equal(p.days[key].drill, 2);
  assert.equal(p.days[key].flashcards, 1);
  assert.equal(p.startedAt, NOW);
});

test('streak counts consecutive active days, tolerating an inactive today', () => {
  let p = P.empty();
  p = P.touch(p, 'drill', NOW - 3 * DAY);
  p = P.touch(p, 'drill', NOW - 2 * DAY);
  p = P.touch(p, 'drill', NOW - 1 * DAY);
  assert.equal(P.currentStreak(p, NOW), 3);
  p = P.touch(p, 'drill', NOW);
  assert.equal(P.currentStreak(p, NOW), 4);
  // gap breaks the streak
  let q = P.empty();
  q = P.touch(q, 'drill', NOW - 5 * DAY);
  q = P.touch(q, 'drill', NOW);
  assert.equal(P.currentStreak(q, NOW), 1);
});

test('currentPlanDay is the day after the highest completed day, capped', () => {
  const p = P.empty();
  assert.equal(P.currentPlanDay(p, 14), 1);
  p.planDone = { 1: true, 2: true };
  assert.equal(P.currentPlanDay(p, 14), 3);
  p.planDone = { 14: true };
  assert.equal(P.currentPlanDay(p, 14), 14);
});

test('stats aggregates attempts by category', () => {
  let p = P.empty();
  p = P.addAttempt(p, { score: 80, category: 'csharp' });
  p = P.addAttempt(p, { score: 60, category: 'csharp' });
  p = P.addAttempt(p, { score: 100, category: 'behavioral' });
  const s = P.stats(p);
  assert.equal(s.attempts, 3);
  assert.equal(s.avg, 80);
  assert.equal(s.byCategory.csharp.avg, 70);
  assert.equal(s.byCategory.behavioral.count, 1);
});
