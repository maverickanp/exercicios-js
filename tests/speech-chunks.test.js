// speech.js is a browser module; load it with a minimal window stub to test
// the text chunking used to work around Chrome's 15-second utterance limit.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const vm = require('vm');

function loadSpeech() {
  const win = { isSecureContext: true, UI: { toast() {} } };
  const code = fs.readFileSync(require.resolve('../src/js/speech.js'), 'utf8');
  vm.runInNewContext(code.replace(/\(window\);\s*$/, '(win);'), { win, Storage: { get: () => ({}) }, console });
  return win.Speech;
}

test('chunks splits long text into sentence-sized utterances under the limit', () => {
  const Speech = loadSpeech();
  const text = 'First sentence here. ' + 'A very long sentence that keeps going, with commas, and more clauses, '.repeat(6) + 'and it ends. Last one!';
  const parts = Speech.chunks(text);
  assert.ok(parts.length >= 4);
  parts.forEach((p) => assert.ok(p.length <= 160, 'chunk too long: ' + p.length));
  assert.equal(parts[0], 'First sentence here.');
  assert.equal(parts[parts.length - 1], 'Last one!');
  // Arrays come from another vm realm, so compare by value, not prototype.
  assert.equal(JSON.stringify(Speech.chunks('')), '[""]');
  assert.equal(JSON.stringify(Speech.chunks('No punctuation at all')), '["No punctuation at all"]');
});
