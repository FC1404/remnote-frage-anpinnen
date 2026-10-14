const { test, afterEach, after } = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'http://localhost/' });
global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
// React 17's browser scheduler would otherwise keep Node's MessagePort alive.
global.MessageChannel = undefined;
global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
global.cancelAnimationFrame = clearTimeout;
window.requestAnimationFrame = global.requestAnimationFrame;
window.cancelAnimationFrame = global.cancelAnimationFrame;
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'CommonJS' } });
const React = require('react');
const ReactDOM = require('react-dom');
const { act, Simulate } = require('react-dom/test-utils');
const { QuestionEditor } = require('../src/QuestionEditor');
const root = document.getElementById('root');
afterEach(() => { act(() => { ReactDOM.unmountComponentAtNode(root); }); });
after(() => dom.window.close());
const button = (name) => [...root.querySelectorAll('button')].find((b) => b.textContent === name);
const change = (text) => act(() => { Simulate.change(root.querySelector('textarea'), { target: { value: text } }); });
const click = async (name) => { await act(async () => { Simulate.click(button(name)); }); };
async function mount(overrides = {}) {
  const calls = [];
  const props = {
    load: async () => '',
    save: async (...args) => { calls.push(['save', ...args]); },
    remove: async (...args) => { calls.push(['remove', ...args]); },
    close: async () => { calls.push(['close']); },
    ...overrides,
  };
  await act(async () => { ReactDOM.render(React.createElement(QuestionEditor, props), root); });
  return calls;
}

test('new question: focus, blank disabled, save and close', async () => {
  const calls = await mount();
  assert.equal(document.activeElement, root.querySelector('textarea'));
  assert.equal(button('Fertig').disabled, true);
  change('Warum entsteht ATP?');
  await click('Fertig');
  assert.deepEqual(calls, [['save', 'Warum entsteht ATP?', ''], ['close']]);
});

test('existing question loads and saves with previous value', async () => {
  const calls = await mount({ load: async () => 'Alte Frage?' });
  assert.equal(root.querySelector('textarea').value, 'Alte Frage?');
  change('Neue Frage?'); await click('Speichern');
  assert.deepEqual(calls, [['save', 'Neue Frage?', 'Alte Frage?'], ['close']]);
});

test('cancel discards edits without a write', async () => {
  const calls = await mount({ load: async () => 'Original?' });
  change('Ungespeichert?'); await click('Abbrechen');
  assert.deepEqual(calls, [['close']]);
});

test('remove deletes the stored question and closes', async () => {
  const calls = await mount({ load: async () => 'Original?' });
  await click('Entfernen');
  assert.deepEqual(calls, [['remove', 'Original?'], ['close']]);
});

test('save failure retains draft and permits retry', async () => {
  const calls = await mount({ save: async () => { throw new Error('Offline'); } });
  change('Meine Frage?'); await click('Fertig');
  assert.equal(root.querySelector('[role="alert"]').textContent, 'Offline');
  assert.equal(root.querySelector('textarea').value, 'Meine Frage?');
  assert.equal(button('Fertig').disabled, false);
  assert.deepEqual(calls, []);
});

test('load failure blocks writes', async () => {
  const calls = await mount({ load: async () => { throw new Error('Nicht erreichbar'); } });
  assert.equal(root.querySelector('textarea').disabled, true);
  assert.equal(button('Fertig').disabled, true);
  assert.equal(root.querySelector('[role="alert"]').textContent, 'Nicht erreichbar');
  assert.deepEqual(calls, []);
});

test('double click cannot submit twice', async () => {
  let complete;
  const calls = await mount({ save: () => new Promise((resolve) => { complete = resolve; }) });
  change('Frage?');
  const submit = button('Fertig');
  await act(async () => { Simulate.click(submit); Simulate.click(submit); });
  assert.equal(button('Bitte warten …').disabled, true);
  await act(async () => { complete(); });
  assert.deepEqual(calls, [['close']]);
});
