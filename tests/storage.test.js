const test = require('node:test');
const assert = require('node:assert/strict');
const Storage = require('../src/js/core/storage.js');

test('falls back to memory in Node and round-trips JSON', () => {
  Storage.set('x', { a: 1 });
  assert.deepEqual(Storage.get('x'), { a: 1 });
  assert.equal(Storage.get('missing', 'dflt'), 'dflt');
  Storage.update('x', (v) => ({ a: v.a + 1 }));
  assert.equal(Storage.get('x').a, 2);
  assert.ok(Storage.keys().includes('x'));
  const dump = Storage.exportAll();
  Storage.remove('x');
  assert.equal(Storage.get('x'), undefined);
  Storage.importAll(dump);
  assert.equal(Storage.get('x').a, 2);
  Storage.clearAll();
  assert.equal(Storage.keys().length, 0);
});
