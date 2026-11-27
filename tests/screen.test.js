import assert from 'node:assert/strict';
import test from 'node:test';
import { screenClock } from '../remote/screen-clock.mjs';
import { createScreenSessions } from '../remote/screen-sessions.mjs';

test('an external screen must be approved, and disconnect revokes playback and audio', () => {
  const screen = createScreenSessions();
  const { token, code } = screen.request();
  assert.deepEqual(screen.status(token), { phase: 'pending', code });
  assert.equal(screen.connected(), false);
  assert.equal(screen.setAudio(token, true), false);
  assert.equal(screen.approve(code), true);
  assert.deepEqual(screen.status(token), { phase: 'connected' });
  assert.equal(screen.approve(code), false);
  assert.equal(screen.setAudio(token, true), true);
  assert.equal(screen.audio(), true);
  assert.equal(screen.status('other').phase, 'expired');
  screen.disconnect();
  assert.equal(screen.audio(), false);
  assert.equal(screen.status(token).phase, 'expired');
});

test('screen codes and disconnected receiver heartbeats expire', () => {
  let now = 100;
  const screen = createScreenSessions(() => now);
  const first = screen.request();
  now += 180001;
  assert.equal(screen.approve(first.code), false);
  const second = screen.request();
  assert.equal(screen.approve(second.code), true);
  now += 14000;
  assert.equal(screen.status(second.token).phase, 'connected');
  now += 15001;
  assert.equal(screen.status(second.token).phase, 'expired');
  assert.equal(screen.connected(), false);
});

test('corrects moderate playback drift without seeking', () => {
  const frame = { media: { time: 10, duration: 30 }, paused: false, rate: 1, age: 100 };
  assert.deepEqual(screenClock(frame, 100, 9.8, 30), { running: true, rate: 1.03 });
  assert.deepEqual(screenClock(frame, 100, 10.6, 30), { running: true, rate: .97 });
  assert.deepEqual(screenClock(frame, 100, 10.2, 30), { running: true, rate: 1 });
});

test('seeks explicitly, keeps paused frames fixed and stays smooth across a loop boundary', () => {
  const paused = { media: { time: 9, duration: 10 }, paused: true, rate: 1, age: 2500 };
  assert.deepEqual(screenClock(paused, 100, 7, 10), { running: false, seek: 9, rate: 1 });
  assert.deepEqual(screenClock({ ...paused, paused: false, age: 500 }, 0, 9.25, 10, true),
    { running: true, seek: 9.5, rate: 1 });
  const looping = screenClock({ ...paused, paused: false, age: 1100 }, 0, 9.85, 10);
  assert.equal(looping.seek, undefined);
  assert.equal(looping.rate, 1.02);
});

test('sending snapshots on a socket cannot extend a silent receiver session', () => {
  let now = 0;
  const screen = createScreenSessions(() => now);
  const { token, code } = screen.request();
  assert.equal(screen.approve(code), true);
  now = 14000;
  assert.equal(screen.status(token, false).phase, 'connected');
  now = 15001;
  assert.equal(screen.status(token, false).phase, 'expired');
});
