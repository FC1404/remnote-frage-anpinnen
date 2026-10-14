const { test } = require('node:test');
const assert = require('node:assert/strict');
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'CommonJS' } });
const { registerBulletMenu } = require('../src/menuCompatibility');
global.self = global;
const { AppNamespace } = require('@remnote/plugin-sdk');
const command = { id: 'pin-question-menu', name: '❔ Frage bearbeiten', action: async () => {} };

test('uses the public API on hosts compatible with SDK 0.0.46', async () => {
  let received;
  await registerBulletMenu({ app: { registerRemMenuItem: async (value) => { received = value; } },
    _call: async () => { throw new Error('Unexpected fallback'); } }, command);
  assert.equal(received, command);
});

test('October 2026 host: required html is supplied while name and callback stay intact', async () => {
  const model = {};
  let rendered;
  const host = async (method, args) => {
    if (method !== 'registerRemMenuItem') throw new Error(`Invalid endpoint "${method}".`);
    // Matches the observed installed host's validator and renderer.
    if (typeof args.html !== 'string') throw new Error('Plugin Error: [Invalid Method Arguments from personal_pinned_question]: registerRemMenuItem\nhtml parameter: Required');
    rendered = { label: args.name, action: model[args.id] };
  };
  const plugin = { model, _call: host };
  // Exercise the actual SDK serializer, not a hand-written substitute.
  plugin.app = new AppNamespace(host, plugin);
  await registerBulletMenu(plugin, command);
  assert.equal(rendered.label, '❔ Frage bearbeiten');
  assert.equal(rendered.action, command.action);
});

test('does not retry unrelated permission or host errors', async () => {
  let retried = false;
  await assert.rejects(registerBulletMenu({ app: { registerRemMenuItem: async () => { throw new Error('Permission denied'); } },
    _call: async () => { retried = true; } }, command), /Permission denied/);
  assert.equal(retried, false);
});
