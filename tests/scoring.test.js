const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../src/js/core/scoring.js');

test('normalize lowercases and strips punctuation but keeps C# and .NET-ish tokens', () => {
  assert.equal(S.normalize('Hello, World!  I use C# and .NET.'), 'hello world i use c# and .net.');
});

test('countWords', () => {
  assert.equal(S.countWords(''), 0);
  assert.equal(S.countWords('one two  three'), 3);
});

test('containsTerm matches whole words/phrases only', () => {
  const n = S.normalize('A value type is stored inline; reference types point to the heap.');
  assert.ok(S.containsTerm(n, 'value type'));
  assert.ok(S.containsTerm(n, 'heap'));
  assert.ok(!S.containsTerm(n, 'eap'));
  assert.ok(!S.containsTerm(n, 'stack'));
  // inflections and long-term prefixes
  assert.ok(S.containsTerm(S.normalize('we use structs and locking'), 'struct'));
  assert.ok(S.containsTerm(S.normalize('we use structs and locking'), 'lock'));
  assert.ok(S.containsTerm(S.normalize('cache invalidation is hard'), 'invalidat'));
  assert.ok(!S.containsTerm(S.normalize('an interface and an integer'), 'int'));
});

test('coverage reports covered and missed key points using synonyms', () => {
  const kps = [
    { label: 'Mentions the heap', terms: ['heap', 'managed heap'] },
    { label: 'Mentions boxing', terms: ['boxing', 'boxed'] },
    { label: 'Mentions structs', terms: ['struct'] },
  ];
  const c = S.coverage('Reference types live on the managed heap and a struct gets boxed when cast to object.', kps);
  assert.equal(c.covered, 3);
  assert.equal(c.total, 3);
  assert.equal(c.ratio, 1);
  const c2 = S.coverage('I have no idea.', kps);
  assert.equal(c2.covered, 0);
  assert.equal(c2.items[0].covered, false);
});

test('fillerWords counts common fillers', () => {
  const f = S.fillerWords('Um, so basically we, uh, you know, used a queue. I mean, basically.');
  assert.equal(f.found['um'], 1);
  assert.equal(f.found['uh'], 1);
  assert.equal(f.found['basically'], 2);
  assert.equal(f.found['you know'], 1);
  assert.equal(f.found['i mean'], 1);
  assert.equal(f.total, 6);
});

test('wordsPerMinute and pace labels', () => {
  assert.equal(S.wordsPerMinute(130, 60), 130);
  assert.equal(S.wordsPerMinute(0, 0), 0);
  assert.equal(S.paceLabel(60), 'slow');
  assert.equal(S.paceLabel(130), 'good');
  assert.equal(S.paceLabel(200), 'fast');
});

test('overall score rewards coverage and penalises fillers and short answers', () => {
  const kps = [{ label: 'a', terms: ['alpha'] }, { label: 'b', terms: ['beta'] }];
  const good = 'alpha '.repeat(30) + 'beta '.repeat(30);
  const bad = 'um um um alpha';
  const g = S.overall(good, kps, 60);
  const b = S.overall(bad, kps, 60);
  assert.ok(g.score > b.score);
  assert.equal(g.coverage.covered, 2);
  assert.equal(g.length, 'good');
  assert.equal(b.length, 'too short');
  assert.equal(g.score, 100);
});
