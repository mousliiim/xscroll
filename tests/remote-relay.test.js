import assert from 'node:assert/strict';
import test from 'node:test';
import { createRemoteRelay } from '../src/browser/remote.js';

test('keeps polling and reports a remote command error without disconnecting', async t => {
  const chromeDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'chrome');
  const originalError = console.error;
  const messages = [];
  const errors = [];
  Object.defineProperty(globalThis, 'chrome', {
    configurable: true,
    value: { runtime: { sendMessage: async message => {
      messages.push(message.type);
      return message.type === 'poll' ? { commands: ['next'] } : {};
    } } },
  });
  console.error = (...args) => errors.push(args);
  t.after(() => {
    if (chromeDescriptor) Object.defineProperty(globalThis, 'chrome', chromeDescriptor);
    else delete globalThis.chrome;
    console.error = originalError;
  });

  let tick;
  const owner = {
    setTimeout(callback) { tick = callback; return 1; },
    clearTimeout() {},
  };
  const relay = createRemoteRelay(
    { ownerDocument: { defaultView: owner } },
    () => ({}),
    () => { throw new Error('Command handler failed'); },
    () => {},
  );
  relay.start();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(typeof tick, 'function');
  assert.equal(errors.length, 1);
  const next = tick;
  tick = undefined;
  next();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(messages.filter(type => type === 'poll').length, 2);
  assert.equal(typeof tick, 'function');
  relay.stop();
});
