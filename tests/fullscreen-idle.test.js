import assert from 'node:assert/strict';
import test from 'node:test';
import { createFullscreenIdle } from '../src/player/fullscreen-idle.js';

test('fullscreen controls and post card use separate idle deadlines refreshed by activity', t => {
  const performanceDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'performance');
  const originalSetTimeout = globalThis.setTimeout;
  const originalClearTimeout = globalThis.clearTimeout;
  let now = 0, nextTimer = 0;
  const timers = new Map();
  globalThis.setTimeout = (callback, delay = 0) => {
    const id = ++nextTimer;
    timers.set(id, { callback, at: now + Math.max(0, Number(delay) || 0) });
    return id;
  };
  globalThis.clearTimeout = id => timers.delete(id);
  Object.defineProperty(globalThis, 'performance', { configurable: true, value: { now: () => now } });
  t.after(() => {
    globalThis.setTimeout = originalSetTimeout;
    globalThis.clearTimeout = originalClearTimeout;
    if (performanceDescriptor) Object.defineProperty(globalThis, 'performance', performanceDescriptor);
    else delete globalThis.performance;
  });

  const events = [];
  const idle = createFullscreenIdle({
    onActivity: () => events.push(['activity', now]),
    onControlsIdle: () => events.push(['controls-idle', now]),
    onPostIdle: () => events.push(['post-idle', now]),
  });
  function advance(milliseconds) {
    const target = now + milliseconds;
    while (true) {
      const due = [...timers.entries()].filter(([, timer]) => timer.at <= target)
        .sort((a, b) => a[1].at - b[1].at)[0];
      if (!due) break;
      const [id, timer] = due;
      timers.delete(id);
      now = timer.at;
      timer.callback();
    }
    now = target;
  }

  idle.setActive(true);
  assert.deepEqual(events, [['activity', 0]]);
  advance(2000);
  idle.activity();
  assert.deepEqual(events, [['activity', 0]]);
  advance(3999);
  assert.deepEqual(events.filter(([name]) => name.endsWith('idle')), []);
  advance(1);
  assert.deepEqual(events.filter(([name]) => name === 'controls-idle'), [['controls-idle', 6000]]);
  advance(5999);
  assert.deepEqual(events.filter(([name]) => name === 'post-idle'), []);
  advance(1);
  assert.deepEqual(events.filter(([name]) => name === 'post-idle'), [['post-idle', 12000]]);

  idle.activity();
  assert.deepEqual(events.filter(([name]) => name === 'activity'), [['activity', 0], ['activity', 12000]]);
  idle.setActive(false);
  advance(15000);
  assert.equal(events.filter(([name]) => name.endsWith('idle')).length, 2);
});
