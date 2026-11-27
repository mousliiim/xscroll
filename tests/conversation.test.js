import assert from 'node:assert/strict';
import test from 'node:test';
import { createConversation } from '../src/player/conversation.js';

test('updates and saves fullscreen comment appearance and speed settings', t => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const values = new Map();
  values.set('xscroll:fullscreen-comments', 'true');
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: key => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, String(value)),
    },
  });
  t.after(() => {
    if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor);
    else delete globalThis.localStorage;
  });

  const styles = [];
  const view = {
    fullscreenComments() {},
    fullscreenCommentStyle(size, transparency) { styles.push([size, transparency]); },
    fullscreenComment() {},
    fullscreenCommentPaused(paused) { pausedStates.push(paused); },
    replies: { autoScroll() {} },
  };
  const pausedStates = [];
  const conversation = createConversation({
    client: { detail: () => new Promise(() => {}) }, view, postActions: {}, currentVideo: () => null, align() {},
  });

  assert.deepEqual(styles.at(-1), [100, 30]);
  conversation.setFullscreenCommentSize(120);
  assert.deepEqual(styles.at(-1), [120, 30]);
  conversation.setFullscreenCommentTransparency(45);
  assert.deepEqual(styles.at(-1), [120, 45]);
  conversation.setFullscreenCommentSize(50);
  assert.deepEqual(styles.at(-1), [50, 45]);
  conversation.setFullscreenCommentTransparency(0);
  assert.deepEqual(styles.at(-1), [50, 0]);
  conversation.setFullscreenCommentSpeed(125);
  assert.equal(conversation.fullscreenCommentSpeed(), 125);
  conversation.setFullscreenCommentSpeed(123);
  assert.equal(conversation.fullscreenCommentSpeed(), 125);
  conversation.setFullscreen(true);
  conversation.setClip('123');
  conversation.toggleFullscreenCommentsPause();
  assert.equal(conversation.fullscreenCommentsPaused(), true);
  conversation.toggleFullscreenCommentsPause();
  assert.equal(conversation.fullscreenCommentsPaused(), false);
  assert.deepEqual(pausedStates.slice(-2), [true, false]);
  assert.equal(values.get('xscroll:fullscreen-comment-size'), '50');
  assert.equal(values.get('xscroll:fullscreen-comment-transparency'), '0');
  assert.equal(values.get('xscroll:fullscreen-comment-speed'), '125');
});

test('pausing fullscreen comments preserves the current comment and its remaining time', async t => {
  const storageDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const performanceDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'performance');
  const originalSetTimeout = globalThis.setTimeout;
  const originalClearTimeout = globalThis.clearTimeout;
  const values = new Map([['xscroll:fullscreen-comments', 'true']]);
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)) },
  });
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
    if (storageDescriptor) Object.defineProperty(globalThis, 'localStorage', storageDescriptor);
    else delete globalThis.localStorage;
    if (performanceDescriptor) Object.defineProperty(globalThis, 'performance', performanceDescriptor);
    else delete globalThis.performance;
  });

  const reply = {
    rest_id: '456',
    legacy: { id_str: '456', in_reply_to_status_id_str: '123', conversation_id_str: '123', full_text: 'Readable comment' },
  };
  const detail = { data: { threaded_conversation_with_injections_v2: { instructions: [{
    entries: [{ content: { itemContent: { tweet_results: { result: reply } } } }],
  }] } } };
  let visibleComment;
  const view = {
    fullscreenComments() {},
    fullscreenCommentStyle() {},
    fullscreenComment(comment) { visibleComment = comment; },
    fullscreenCommentPaused() {},
    replies: { autoScroll() {} },
  };
  const conversation = createConversation({
    client: { detail: async () => detail }, view, postActions: {}, currentVideo: () => null, align() {},
  });
  conversation.setFullscreen(true);
  conversation.setClip('123');
  await Promise.resolve();
  assert.equal(visibleComment?.text, 'Readable comment');
  const duration = Math.min(18000, 6500 + visibleComment.text.length * 25) * 100 / 75;

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

  advance(2000);
  conversation.toggleFullscreenCommentsPause();
  advance(15000);
  assert.equal(visibleComment?.text, 'Readable comment');
  conversation.toggleFullscreenCommentsPause();
  advance(duration - 2001);
  assert.equal(visibleComment?.text, 'Readable comment');
  advance(2);
  assert.equal(visibleComment, undefined);
});

test('a failed reply request clears loading state and exposes a retry', async () => {
  let requests = 0;
  const statuses = [];
  const view = {
    fullscreenComments() {},
    fullscreenCommentStyle() {},
    fullscreenComment() {},
    fullscreenCommentPaused() {},
    toggleReplies() {},
    replies: {
      autoScroll() {},
      clearReplies() {},
      appendReplies() {},
      replyStatus(...status) { statuses.push(status); },
    },
    message() {},
  };
  const conversation = createConversation({
    client: { async detail() { requests++; throw new Error('Offline'); } },
    view, postActions: {}, currentVideo: () => null, align() {},
  });
  conversation.setClip('123');
  conversation.setOpen(true, false);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(requests, 1);
  assert.ok(statuses.some(([message]) => message === 'Couldn’t load replies from X.'));

  await conversation.more();
  assert.equal(requests, 2);
  assert.ok(statuses.some(([message]) => message === 'Couldn’t load replies from X.'));
});
