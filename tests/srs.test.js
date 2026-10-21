const test = require('node:test');
const assert = require('node:assert/strict');
const Srs = require('../src/js/core/srs.js');

const NOW = Date.UTC(2026, 0, 1, 12);

test('new card starts in box 1 and is due immediately', () => {
  const c = Srs.newCard('a', NOW);
  assert.equal(c.box, 1);
  assert.ok(Srs.isDue(c, NOW));
});

test('good moves up one box with the box interval', () => {
  const c = Srs.rate(Srs.newCard('a', NOW), 'good', NOW);
  assert.equal(c.box, 2);
  assert.equal(c.due, NOW + 1 * Srs.DAY);
  assert.equal(c.reviews, 1);
});

test('easy jumps two boxes and caps at the max box', () => {
  let c = Srs.rate(Srs.newCard('a', NOW), 'easy', NOW);
  assert.equal(c.box, 3);
  c = Srs.rate(c, 'easy', NOW);
  c = Srs.rate(c, 'easy', NOW);
  assert.equal(c.box, Srs.MAX_BOX);
  assert.equal(c.due, NOW + 14 * Srs.DAY);
});

test('again resets to box 1, counts a lapse and comes back soon', () => {
  let c = Srs.rate(Srs.newCard('a', NOW), 'good', NOW);
  c = Srs.rate(c, 'again', NOW);
  assert.equal(c.box, 1);
  assert.equal(c.lapses, 1);
  assert.ok(c.due > NOW && c.due < NOW + Srs.DAY);
});

test('unknown rating throws', () => {
  assert.throws(() => Srs.rate(Srs.newCard('a', NOW), 'meh', NOW));
});

test('queue puts due cards first (oldest first), then limited new cards', () => {
  const state = {
    a: { id: 'a', box: 2, due: NOW - 1000 },
    b: { id: 'b', box: 3, due: NOW - 5000 },
    c: { id: 'c', box: 4, due: NOW + 5000 },
  };
  const q = Srs.buildQueue(['a', 'b', 'c', 'd', 'e', 'f'], state, { now: NOW, newLimit: 2 });
  assert.deepEqual(q, ['b', 'a', 'd', 'e']);
});

test('summary counts boxes, due and unseen', () => {
  const state = { a: { id: 'a', box: 2, due: NOW - 1 }, b: { id: 'b', box: 5, due: NOW + 1 } };
  const s = Srs.summary(['a', 'b', 'c'], state, NOW);
  assert.equal(s.total, 3);
  assert.equal(s.seen, 2);
  assert.equal(s.unseen, 1);
  assert.equal(s.due, 1);
  assert.equal(s.boxes[2], 1);
  assert.equal(s.boxes[5], 1);
});
