import assert from 'node:assert/strict';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import { createRemoteServer } from '../remote/server.mjs';

const source = await readFile(new URL('../remote/screen-boot.js', import.meta.url), 'utf8');

function setup({ eventStream = false } = {}) {
  function element() {
    return {
      textContent: '',
      hidden: false,
      paused: true,
      readyState: 2,
      currentTime: 0,
      duration: 30,
      listeners: {},
      attributes: {},
      addEventListener(type, callback) { this.listeners[type] = callback; },
      setAttribute(name, value) { this.attributes[name] = value; },
      getAttribute(name) { return name === 'src' ? this.src || null : this.attributes[name] || null; },
      removeAttribute(name) { delete this.attributes[name]; if (name === 'src') this.src = ''; },
      load() { this.loaded = true; },
      play() { this.paused = false; return Promise.resolve(); },
      pause() { this.paused = true; },
    };
  }
  const ids = [
    'screen-code', 'lobby-status', 'new-code', 'lobby', 'viewer', 'display-video', 'wait',
    'caption', 'subtitle', 'author', 'author-name', 'author-avatar', 'avatar-letter', 'text',
    'screen-audio', 'fullscreen', 'screen-comment', 'comment-letter', 'comment-avatar',
    'comment-name', 'comment-handle', 'comment-time', 'comment-text',
  ];
  const elements = Object.fromEntries(ids.map(id => [id, element()]));
  const statSpans = ['likeCount', 'repostCount', 'bookmarkCount'].map(key => {
    const count = element();
    return {
      hidden: true,
      getAttribute(name) { return name === 'data-comment-stat' ? key : null; },
      getElementsByTagName(name) { return name === 'b' ? [count] : []; },
    };
  });
  elements['comment-stats'] = {
    hidden: true,
    getElementsByTagName(name) { return name === 'span' ? statSpans : []; },
  };
  elements['new-code'].hidden = true;
  elements['lobby-status'].textContent = 'Loading screen code…';
  const requests = [];
  const streams = [];
  let interval;
  class XMLHttpRequest {
    constructor() { requests.push(this); }
    open(method, url) { this.method = method; this.url = url; }
    setRequestHeader() {}
    send(body) { this.body = body; }
    respond(status, body) {
      this.status = status;
      this.responseText = JSON.stringify(body);
      this.onload();
    }
  }
  const window = {
    setInterval(callback) { interval = callback; return 1; },
    clearInterval() {},
  };
  if (eventStream) {
    window.EventSource = class {
      constructor(url) { this.url = url; streams.push(this); }
      close() { this.closed = true; }
    };
  }
  const document = { getElementById: id => elements[id] };
  vm.runInNewContext(source, { window, document, XMLHttpRequest });
  return { elements, requests, statSpans, streams, window, tick: () => interval() };
}

test('screen code is fetched by the classic bootstrap and shared with the module', () => {
  const { elements, requests, window } = setup();
  assert.equal(requests.length, 1);
  assert.equal(requests[0].method, 'POST');
  assert.equal(requests[0].url, '/api/screen/request');

  let moduleResult;
  window.xscrollScreenRequest((error, result) => { moduleResult = { error, result }; });
  requests[0].respond(200, { phase: 'pending', code: '482731' });

  assert.equal(elements['screen-code'].textContent, '482731');
  assert.equal(elements['lobby-status'].textContent, '');
  assert.equal(elements['new-code'].hidden, true);
  assert.equal(moduleResult.error, null);
  assert.equal(JSON.stringify(moduleResult.result), '{"phase":"pending","code":"482731"}');
});

test('screen bootstrap reports request failures and exposes retry', () => {
  const { elements, requests } = setup();
  requests[0].respond(503, { error: 'unavailable' });
  assert.equal(elements['screen-code'].textContent, '');
  assert.equal(elements['lobby-status'].textContent, 'Impossible de contacter XScroll.');
  assert.equal(elements['new-code'].hidden, false);
});

test('classic fallback switches to the video player after screen approval', () => {
  const { elements, requests, statSpans, tick } = setup();
  requests[0].respond(200, { phase: 'pending', code: '482731' });
  tick();
  assert.equal(requests[1].method, 'GET');
  assert.equal(requests[1].url, '/api/screen/status');
  requests[1].respond(200, {
    phase: 'connected',
    playback: {
      paused: false, muted: false, rate: 1, volume: 0.8, age: 100,
      media: {
        url: 'https://video.twimg.com/ext_tw_video/123/pu/vid/avc1/320x180/clip.mp4',
        time: 4, duration: 30, loop: true, fit: 'contain', author: 'creator',
        name: 'Creator', text: 'A test video', avatar: '',
        screenComment: {
          id: '456', author: 'alice', name: 'Alice', text: 'A readable reply',
          likeCount: 1234, repostCount: 5, bookmarkCount: 2,
        },
      },
    },
  });
  assert.equal(elements.lobby.hidden, true);
  assert.equal(elements.viewer.hidden, false);
  assert.match(elements['display-video'].src, /^https:\/\/video\.twimg\.com\//);
  assert.equal(elements['display-video'].paused, false);
  assert.equal(elements['display-video'].currentTime, 4.1);
  assert.equal(elements['author-name'].textContent, 'Creator');
  assert.equal(elements.text.textContent, 'A test video');
  assert.equal(elements['screen-comment'].hidden, false);
  assert.equal(elements['comment-name'].textContent, 'Alice');
  assert.equal(elements['comment-text'].textContent, 'A readable reply');
  assert.equal(statSpans[0].hidden, false);
  assert.equal(statSpans[0].getElementsByTagName('b')[0].textContent, '1234');
});

test('classic fallback uses the live screen event stream for comment and playback updates', () => {
  const { elements, requests, streams, tick } = setup({ eventStream: true });
  requests[0].respond(200, { phase: 'pending', code: '482731' });
  tick();
  requests[1].respond(200, {
    phase: 'connected',
    playback: {
      paused: false, muted: true, rate: 1, age: 0,
      media: {
        url: 'https://video.twimg.com/ext_tw_video/123/pu/vid/avc1/320x180/clip.mp4',
        time: 0, duration: 30, loop: true, fit: 'contain',
        screenComment: { id: '456', name: 'Alice', author: 'alice', text: 'First reply' },
      },
    },
  });
  assert.equal(streams.length, 1);
  assert.equal(streams[0].url, '/api/screen/events');
  streams[0].onmessage({ data: JSON.stringify({
    phase: 'connected',
    playback: {
      paused: false, muted: true, rate: 1, age: 0,
      media: {
        url: 'https://video.twimg.com/ext_tw_video/123/pu/vid/avc1/320x180/clip.mp4',
        time: 1, duration: 30, loop: true, fit: 'contain',
        screenComment: { id: '789', name: 'Bob', author: 'bob', text: 'Next reply' },
      },
    },
  }) });
  assert.equal(elements['comment-name'].textContent, 'Bob');
  assert.equal(elements['comment-text'].textContent, 'Next reply');
});

test('classic fallback advances through every compatible media variant after decoder errors', () => {
  const { elements, requests, tick } = setup();
  requests[0].respond(200, { phase: 'pending', code: '482731' });
  tick();
  requests[1].respond(200, {
    phase: 'connected',
    playback: {
      paused: false, muted: true, rate: 1, age: 0,
      media: {
        url: '/api/screen/media?url=high',
        fallbacks: ['/api/screen/media?url=low', '/api/screen/media?url=lowest'],
        time: 0, duration: 30, loop: true, fit: 'contain',
      },
    },
  });
  const video = elements['display-video'];
  assert.equal(video.src, '/api/screen/media?url=high');
  video.listeners.error();
  assert.equal(video.src, '/api/screen/media?url=low');
  video.listeners.error();
  assert.equal(video.src, '/api/screen/media?url=lowest');
  video.listeners.error();
  assert.equal(elements.wait.textContent, 'Cet écran ne peut pas lire la vidéo.');
});

test('remote server exposes the classic screen bootstrap to TV browsers', async t => {
  const { server } = createRemoteServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => server.close(resolve)));

  const origin = `http://127.0.0.1:${server.address().port}`;
  const [page, bootstrap] = await Promise.all([
    fetch(`${origin}/screen`),
    fetch(`${origin}/screen-boot.js`),
  ]);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /screen-boot\.js/);
  assert.equal(bootstrap.status, 200);
  assert.match(await bootstrap.text(), /xscrollScreenRequest/);
});
