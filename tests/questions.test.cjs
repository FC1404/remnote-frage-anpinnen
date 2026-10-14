const { test } = require('node:test');
const assert = require('node:assert/strict');
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'CommonJS' } });
const { saveQuestion, readQuestion, removeQuestion, selectedRemId, POWERUP } = require('../src/questions');

function fixture() {
  let state = { question: '', pinned: false, text: 'Mitochondrien', answer: 'produzieren ATP', schedule: [5, 12], otherTags: ['Biologie'] };
  let failing = false;
  const rem = {
    _id: 'target',
    hasPowerup: async () => state.pinned,
    getPowerupProperty: async () => state.question,
    addPowerup: async (code) => { assert.equal(code, POWERUP); state.pinned = true; },
    setPowerupProperty: async (_, __, value) => {
      if (failing) throw new Error('Speichern fehlgeschlagen');
      state.question = value[0];
    },
    removePowerup: async (code) => { assert.equal(code, POWERUP); state.pinned = false; state.question = ''; },
  };
  const plugin = {
    rem: { findOne: async (id) => id === 'target' ? rem : undefined },
    app: { transaction: async (fn) => {
      const snapshot = structuredClone(state);
      try { return await fn(); } catch (e) { state = snapshot; throw e; }
    } },
    editor: { getSelectedRem: async () => ({ remIds: ['target'] }) },
    focus: { getFocusedRem: async () => ({ _id: 'other-focused-rem' }) },
  };
  return { plugin, state: () => structuredClone(state), fail: () => { failing = true; } };
}

test('add, read, edit and remove preserve note, answer, tags and schedule', async () => {
  const f = fixture();
  const before = f.state();
  await saveQuestion(f.plugin, 'target', '  Welche Funktion?  ', '');
  assert.equal(await readQuestion(f.plugin, 'target'), 'Welche Funktion?');
  await saveQuestion(f.plugin, 'target', 'Warum?\nUnd wie?', 'Welche Funktion?');
  assert.equal(await readQuestion(f.plugin, 'target'), 'Warum?\nUnd wie?');
  await removeQuestion(f.plugin, 'target', 'Warum?\nUnd wie?');
  assert.equal(await readQuestion(f.plugin, 'target'), '');
  assert.deepEqual(f.state(), before);
});

test('empty, oversize and deleted targets do not write', async () => {
  const f = fixture(); const before = f.state();
  await assert.rejects(saveQuestion(f.plugin, 'target', '  \n', ''), /Frage/);
  await assert.rejects(saveQuestion(f.plugin, 'target', 'a'.repeat(4001), ''), /4000/);
  await assert.rejects(saveQuestion(f.plugin, 'missing', 'Frage?', ''), /nicht verfügbar/);
  assert.deepEqual(f.state(), before);
});

test('stale editors cannot overwrite or remove a newer question', async () => {
  const f = fixture();
  await saveQuestion(f.plugin, 'target', 'Neu?', '');
  await assert.rejects(saveQuestion(f.plugin, 'target', 'Alt?', ''), /inzwischen geändert/);
  await assert.rejects(removeQuestion(f.plugin, 'target', ''), /inzwischen geändert/);
  assert.equal(await readQuestion(f.plugin, 'target'), 'Neu?');
});

test('a failed first property write removes the newly added empty pin', async () => {
  const f = fixture(); const before = f.state(); f.fail();
  await assert.rejects(saveQuestion(f.plugin, 'target', 'Frage?', ''), /fehlgeschlagen/);
  assert.deepEqual(f.state(), before);
});

test('popup writes and deletes work when the host cannot dispatch popup transaction callbacks', async () => {
  const f = fixture();
  // Installed RemNote dispatches transactions to the index widget. A callback
  // registered only by the popup is missing there and returns undefined.
  f.plugin.app.transaction = async () => undefined;
  await saveQuestion(f.plugin, 'target', 'Aus dem Eingabefenster?', '');
  assert.equal(await readQuestion(f.plugin, 'target'), 'Aus dem Eingabefenster?');
  await removeQuestion(f.plugin, 'target', 'Aus dem Eingabefenster?');
  assert.equal(f.state().pinned, false);
});

test('a silent host write failure is not reported as success', async () => {
  const f = fixture();
  const rem = await f.plugin.rem.findOne('target');
  rem.setPowerupProperty = async () => {};
  await assert.rejects(saveQuestion(f.plugin, 'target', 'Nicht gespeichert?', ''), /nicht bestätigt/);
});

test('failed editing preserves the previously stored question', async () => {
  const f = fixture();
  await saveQuestion(f.plugin, 'target', 'Original?', '');
  f.fail();
  await assert.rejects(saveQuestion(f.plugin, 'target', 'Neue Frage?', 'Original?'), /fehlgeschlagen/);
  assert.equal(await readQuestion(f.plugin, 'target'), 'Original?');
});

test('selected menu target takes priority over another focused bullet; multi-selection is rejected', async () => {
  const f = fixture();
  assert.equal(await selectedRemId(f.plugin), 'target');
  assert.equal(await selectedRemId(f.plugin, { selectedRem: ['clicked'], focusedRem: 'other' }), 'clicked');
  f.plugin.editor.getSelectedRem = async () => ({ remIds: ['a', 'b'] });
  await assert.rejects(selectedRemId(f.plugin), /genau einen/);
});

test('question content remains literal text', async () => {
  const f = fixture(); const text = '<script>alert(1)</script> >> {{ATP}}';
  await saveQuestion(f.plugin, 'target', text, '');
  assert.equal(await readQuestion(f.plugin, 'target'), text);
});
