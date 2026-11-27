import assert from 'node:assert/strict';
import test from 'node:test';
import { createRateRamp, normalizeRate } from '../src/player/rate.js';

function fixture() {
  const queued = new Map();
  const writes = [];
  let id = 0, actual = 1;
  const owner = {
    requestAnimationFrame(callback) { queued.set(++id, callback); return id; },
    cancelAnimationFrame(token) { queued.delete(token); },
  };
  const video = {
    paused: false, ownerDocument: { defaultView: owner },
    get playbackRate() { return actual; },
    set playbackRate(value) { actual = value; writes.push(value); },
  };
  return {
    video, writes,
    tick(time) {
      const callbacks = [...queued.values()];
      queued.clear();
      for (const run of callbacks) run(time);
    },
  };
}

test('clamps speed and retains hundredth increments', () => {
  assert.deepEqual([normalizeRate(0), normalizeRate(4), normalizeRate('0.57'), normalizeRate(NaN)], [.25, 2, .57, 1]);
});

test('starts slowing on the first frame and reaches the precise target with pitch correction', () => {
  const { video, tick, writes } = fixture();
  const ramp = createRateRamp();
  ramp.set(video, .37);
  tick(0);
  assert.ok(video.playbackRate > .37 && video.playbackRate < 1);
  for (let now = 16; now <= 320; now += 16) tick(now);
  assert.ok(writes.length > 3 && writes.length <= 7);
  assert.ok(writes.every((value, index) => index === 0 || value < writes[index - 1]));
  assert.equal(video.playbackRate, .37);
  assert.equal(video.defaultPlaybackRate, .37);
  assert.equal(video.preservesPitch, true);
});

test('coalesces repeated drag updates without restarting the ramp', () => {
  const { video, tick, writes } = fixture();
  const ramp = createRateRamp();
  for (let now = 0; now < 160; now += 8) {
    ramp.set(video, 1 + now / 160);
    if (now === 80) assert.ok(video.playbackRate > 1);
    tick(now);
  }
  assert.ok(writes.length >= 2 && writes.length <= 4);
  const previousSpeed = video.playbackRate;
  ramp.set(video, .52);
  tick(192);
  assert.ok(video.playbackRate < previousSpeed);
  for (let now = 208; now <= 512; now += 16) tick(now);
  assert.equal(video.playbackRate, .52);
});

test('snaps while paused and cancels pending writes when switching clips', () => {
  const { video, tick, writes } = fixture();
  const ramp = createRateRamp();
  ramp.set(video, 2);
  tick(0);
  ramp.snap(undefined, 1);
  tick(64);
  assert.equal(writes.length, 1);
  video.paused = true;
  ramp.set(video, .6);
  assert.equal(video.playbackRate, .6);
  assert.equal(video.defaultPlaybackRate, .6);
});
