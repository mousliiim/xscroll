import assert from 'node:assert/strict';
import { once } from 'node:events';
import http from 'node:http';
import test from 'node:test';
import { relayScreenMedia, serveScreenMedia } from '../remote/screen-media.mjs';

test('screen media is relayed locally with every sanitized fallback candidate', () => {
  const media = relayScreenMedia({
    url: 'https://video.twimg.com/ext_tw_video/123/pu/vid/avc1/1280x720/high.mp4?tag=12&token=secret',
    fallbacks: [
      'https://video.twimg.com/ext_tw_video/123/pu/vid/avc1/320x180/low.mp4?tag=12',
      'https://example.org/not-a-video.mp4',
    ],
  });
  assert.equal(media.url, '/api/screen/media?url=https%3A%2F%2Fvideo.twimg.com%2Fext_tw_video%2F123%2Fpu%2Fvid%2Favc1%2F1280x720%2Fhigh.mp4%3Ftag%3D12');
  assert.deepEqual(media.fallbacks, [
    '/api/screen/media?url=https%3A%2F%2Fvideo.twimg.com%2Fext_tw_video%2F123%2Fpu%2Fvid%2Favc1%2F320x180%2Flow.mp4%3Ftag%3D12',
  ]);
  assert.equal(relayScreenMedia({ url: 'https://example.org/video.mp4' }).unavailable, true);
});

test('the TV media relay forwards byte ranges and streams only authorized X MP4s', async t => {
  let upstreamRequest;
  const server = http.createServer((request, response) => serveScreenMedia(request, response, {
    authorized: request.headers.cookie === 'screen=paired',
    fetchMedia: async (url, options) => {
      upstreamRequest = { url, options };
      return new Response(new Uint8Array([1, 2, 3]), {
        status: 206,
        headers: { 'Content-Type': 'video/mp4', 'Content-Length': '3', 'Content-Range': 'bytes 4-6/20' },
      });
    },
  }));
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => server.close(resolve)));

  const origin = `http://127.0.0.1:${server.address().port}`;
  const source = 'https://video.twimg.com/clip.mp4?tag=12&token=secret';
  const response = await fetch(`${origin}/api/screen/media?url=${encodeURIComponent(source)}`, {
    headers: { cookie: 'screen=paired', range: 'bytes=4-6' },
  });
  assert.equal(response.status, 206);
  assert.equal(response.headers.get('accept-ranges'), 'bytes');
  assert.equal(response.headers.get('content-range'), 'bytes 4-6/20');
  assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], [1, 2, 3]);
  assert.equal(upstreamRequest.url, 'https://video.twimg.com/clip.mp4?tag=12');
  assert.equal(upstreamRequest.options.headers.range, 'bytes=4-6');
  assert.equal(upstreamRequest.options.redirect, 'error');

  const denied = await fetch(`${origin}/api/screen/media?url=${encodeURIComponent(source)}`);
  assert.equal(denied.status, 403);
  const invalid = await fetch(`${origin}/api/screen/media?url=${encodeURIComponent('https://example.org/clip.mp4')}`, {
    headers: { cookie: 'screen=paired' },
  });
  assert.equal(invalid.status, 400);
});
