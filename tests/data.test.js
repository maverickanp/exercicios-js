// Validates the shape of the content so a typo in a data file fails CI
// instead of breaking a screen at runtime.
const test = require('node:test');
const assert = require('node:assert/strict');
const questions = require('../src/data/questions.js');
const behavioral = require('../src/data/behavioral.js');
const flashcards = require('../src/data/flashcards.js');
const { phrases, pronunciation } = require('../src/data/phrases.js');
const snippets = require('../src/data/snippets.js');
const plan = require('../src/data/plan.js');
const Scoring = require('../src/js/core/scoring.js');

function uniqueIds(list, name) {
  const seen = new Set();
  list.forEach((x) => {
    assert.ok(x.id, `${name}: missing id`);
    assert.ok(!seen.has(x.id), `${name}: duplicate id ${x.id}`);
    seen.add(x.id);
  });
}

function checkKeyPoints(item, name) {
  assert.ok(Array.isArray(item.keyPoints) && item.keyPoints.length >= 3, `${name} ${item.id}: needs >= 3 key points`);
  item.keyPoints.forEach((kp) => {
    assert.ok(kp.label, `${name} ${item.id}: key point without label`);
    assert.ok(Array.isArray(kp.terms) && kp.terms.length, `${name} ${item.id}: key point "${kp.label}" without terms`);
  });
}

test('technical questions are well formed and the model answer covers most key points', () => {
  assert.ok(questions.length >= 40);
  uniqueIds(questions, 'questions');
  questions.forEach((q) => {
    assert.ok(q.q && q.model && q.pt && q.category, `question ${q.id} incomplete`);
    checkKeyPoints(q, 'question');
    const cov = Scoring.coverage(q.model, q.keyPoints);
    assert.ok(cov.ratio >= 0.6, `question ${q.id}: model answer covers only ${cov.covered}/${cov.total} key points: ${cov.items.filter((i) => !i.covered).map((i) => i.label).join('; ')}`);
    assert.ok(Scoring.countWords(q.model) >= 60, `question ${q.id}: model answer too short`);
  });
});

test('behavioral questions are well formed', () => {
  assert.ok(behavioral.length >= 12);
  uniqueIds(behavioral, 'behavioral');
  behavioral.forEach((q) => {
    assert.ok(q.q && q.model && q.pt && q.theme, `behavioral ${q.id} incomplete`);
    checkKeyPoints(q, 'behavioral');
    const cov = Scoring.coverage(q.model, q.keyPoints);
    assert.ok(cov.ratio >= 0.6, `behavioral ${q.id}: model answer covers only ${cov.covered}/${cov.total}: ${cov.items.filter((i) => !i.covered).map((i) => i.label).join('; ')}`);
  });
});

test('flashcards are well formed', () => {
  assert.ok(flashcards.length >= 60);
  uniqueIds(flashcards, 'flashcards');
  flashcards.forEach((c) => assert.ok(c.front && c.back && c.say && c.tag, `flashcard ${c.id} incomplete`));
});

test('phrasebook and pronunciation are well formed', () => {
  assert.ok(phrases.length >= 6);
  uniqueIds(phrases, 'phrases');
  phrases.forEach((p) => {
    assert.ok(p.title && p.items.length >= 6, `phrase group ${p.id} incomplete`);
    p.items.forEach((i) => assert.ok(i.en, `phrase group ${p.id}: item without en`));
  });
  assert.ok(pronunciation.length >= 25);
  pronunciation.forEach((w) => assert.ok(w.word && w.sounds, 'pronunciation entry incomplete'));
});

test('code snippets are well formed and model explanations cover key points', () => {
  assert.ok(snippets.length >= 10);
  uniqueIds(snippets, 'snippets');
  snippets.forEach((s) => {
    assert.ok(s.title && s.code && s.task && s.model && s.pt, `snippet ${s.id} incomplete`);
    checkKeyPoints(s, 'snippet');
    const cov = Scoring.coverage(s.model, s.keyPoints);
    assert.ok(cov.ratio >= 0.6, `snippet ${s.id}: model covers only ${cov.covered}/${cov.total}: ${cov.items.filter((i) => !i.covered).map((i) => i.label).join('; ')}`);
  });
});

test('plan has 14 days whose routes point to existing content', () => {
  assert.equal(plan.length, 14);
  const qids = new Set(questions.concat(behavioral).map((q) => q.id));
  const sids = new Set(snippets.map((s) => s.id));
  const pids = new Set(phrases.map((p) => p.id));
  plan.forEach((d, i) => {
    assert.equal(d.day, i + 1);
    assert.ok(d.title && d.focus && d.pt && d.tasks.length >= 3, `day ${d.day} incomplete`);
    d.tasks.forEach((task) => {
      assert.ok(task.route && task.label, `day ${d.day}: task without route`);
      let m;
      if ((m = task.route.match(/^#\/drill\/q\/(.+)$/))) assert.ok(qids.has(m[1]), `day ${d.day}: unknown question ${m[1]}`);
      if ((m = task.route.match(/^#\/code\/(.+)$/))) assert.ok(sids.has(m[1]), `day ${d.day}: unknown snippet ${m[1]}`);
      if ((m = task.route.match(/^#\/phrases\/(?!pronunciation)(.+)$/))) assert.ok(pids.has(m[1]), `day ${d.day}: unknown phrase group ${m[1]}`);
    });
  });
});
