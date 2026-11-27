import assert from 'node:assert/strict';
import test from 'node:test';
import { remoteCommand, remoteStatus, screenMedia, screenMediaURL } from '../remote/protocol.mjs';

const id = '0123456789abcdef';
test('accepts existing playback commands and validates discovery payloads', () => {
  assert.equal(remoteCommand('next'), 'next');
  assert.equal(remoteCommand('search'), null);
  assert.deepEqual(remoteCommand({ command: 'shuffle', id, extra: 'ignored' }), { command: 'shuffle', id });
  assert.deepEqual(remoteCommand({ command: 'search', id, topic: '  photo   de rue\n ' }),
    { command: 'search', id, topic: 'photo de rue' });
  for (const topic of [' ', 'x'.repeat(121), null]) assert.equal(remoteCommand({ command: 'search', id, topic }), null);
  assert.equal(remoteCommand({ command: 'search', id: 'bad', topic: 'cats' }), null);
});

test('reports discovery progress even when the open player has no video yet', () => {
  const discovery = { command: 'search', id, topic: 'photo', phase: 'loading' };
  const state = remoteStatus({ ready: true, playable: false, discovery });
  assert.equal(state.ready, true);
  assert.equal(state.playable, false);
  assert.deepEqual(state.discovery, discovery);
  assert.equal(remoteStatus({ discovery: { ...discovery, phase: 'other' } }).discovery, null);
  assert.equal(remoteStatus({ ready: true }).playable, true);
});

test('the display only receives native X MP4 URLs and strips access parameters', () => {
  assert.equal(screenMediaURL('https://video.twimg.com/1/clip.mp4?tag=12&token=secret#x'),
    'https://video.twimg.com/1/clip.mp4?tag=12');
  assert.equal(screenMediaURL('https://video.twimg.com.evil.example/clip.mp4'), '');
  assert.equal(screenMediaURL('https://video.twimg.com/1/clip.m3u8'), '');
  assert.equal(screenMediaURL('https://user:pass@video.twimg.com/clip.mp4'), '');
  assert.deepEqual(remoteStatus({ ready: true, media: { unavailable: true, text: 'private' } }).media, { unavailable: true });
});

test('validates live speed and momentary previews separately from discovery', () => {
  assert.deepEqual(remoteCommand({ command: 'speed', rate: 1.253 }), { command: 'speed', rate: 1.25 });
  assert.equal(remoteCommand({ command: 'speed', rate: 100 }), null);
  assert.deepEqual(remoteCommand({ command: 'speed-preview', rate: null }), { command: 'speed-preview', rate: null });
  assert.equal(remoteCommand({ command: 'speed-preview', rate: 1.1 }), null);
  assert.equal(remoteCommand('replies-auto'), 'replies-auto');
  assert.equal(remoteCommand('fullscreen-comments-pause'), 'fullscreen-comments-pause');
  assert.equal(remoteStatus({ autoReplies: true, rate: .55, rateTarget: 1.5 }).rateTarget, 1.5);
});

test('a phone action identifies the exact post and its intended state', () => {
  const input = { command: 'post-action', id, postId: '137', kind: 'bookmark', enabled: false };
  assert.deepEqual(remoteCommand(input), input);
  assert.equal(remoteCommand({ ...input, enabled: 'false' }), null);
  assert.equal(remoteCommand({ ...input, postId: '/not-a-post' }), null);
  assert.equal(remoteCommand({ ...input, kind: 'unrelated' }), null);
  const status = remoteStatus({
    ready: true,
    post: { id: '137', like: true, pending: ['bookmark', 'unrelated'] },
    postResults: [{ ...input, error: 'changed' }],
  });
  assert.deepEqual(status.post.pending, ['bookmark']);
  assert.equal(status.post.like, true);
  assert.equal(status.postResults[0].error, 'changed');
});

test('validates remote playback settings and keeps comments bounded', () => {
  assert.deepEqual(remoteCommand({ command: 'volume', volume: .437 }), { command: 'volume', volume: .44 });
  assert.equal(remoteCommand({ command: 'volume', volume: 2 }), null);
  assert.deepEqual(remoteCommand({ command: 'comment-size', value: 125 }), { command: 'comment-size', value: 125 });
  assert.deepEqual(remoteCommand({ command: 'comment-size', value: 50 }), { command: 'comment-size', value: 50 });
  assert.equal(remoteCommand({ command: 'comment-size', value: 145 }), null);
  assert.equal(remoteCommand({ command: 'comment-size', value: 83 }), null);
  assert.deepEqual(remoteCommand({ command: 'comment-transparency', value: 45 }), { command: 'comment-transparency', value: 45 });
  assert.deepEqual(remoteCommand({ command: 'comment-transparency', value: 90 }), { command: 'comment-transparency', value: 90 });
  assert.equal(remoteCommand({ command: 'comment-transparency', value: 95 }), null);
  assert.equal(remoteCommand({ command: 'comment-transparency', value: 44 }), null);
  assert.deepEqual(remoteCommand({ command: 'comment-speed', value: 125 }), { command: 'comment-speed', value: 125 });
  assert.equal(remoteCommand({ command: 'comment-speed', value: 203 }), null);
  assert.equal(remoteCommand({ command: 'comment-speed', value: 128 }), null);
  assert.equal(remoteCommand('fullscreen-comments-pause'), 'fullscreen-comments-pause');
  assert.equal(remoteCommand({ command: 'phone-replies', open: 'yes' }), null);
  assert.deepEqual(remoteCommand({ command: 'phone-replies', open: true }), { command: 'phone-replies', open: true });
  const state = remoteStatus({ ready: true, fullscreen: true, fullscreenCommentsPaused: true,
    fullscreenCommentSpeed: 125, autoNext: true, fit: 'fill', captionsAvailable: true,
    comments: { id: '123', phase: 'ready', items: [{ id: '456', author: 'alice', text: 'x'.repeat(500) }, { id: 'bad', text: 'ignored' }] } });
  assert.equal(state.fullscreen, true);
  assert.equal(state.fullscreenCommentSize, 100);
  assert.equal(state.fullscreenCommentTransparency, 30);
  assert.equal(state.fullscreenCommentSpeed, 125);
  assert.equal(state.fullscreenCommentsPaused, true);
  const clampedCard = remoteStatus({ fullscreenCommentSize: 200, fullscreenCommentTransparency: 0, fullscreenCommentSpeed: 220 });
  assert.equal(clampedCard.fullscreenCommentSize, 140);
  assert.equal(clampedCard.fullscreenCommentTransparency, 0);
  assert.equal(clampedCard.fullscreenCommentSpeed, 200);
  assert.equal(state.autoNext, true);
  assert.equal(state.fit, 'fill');
  assert.equal(state.comments.items.length, 1);
  assert.equal(state.comments.items[0].text.length, 440);
});

test('a display avatar uses the public profile CDN path without parameters', () => {
  const url = 'https://video.twimg.com/public.mp4';
  assert.equal(screenMedia({ url, avatar: 'https://pbs.twimg.com/profile_images/1/face_normal.jpg?token=secret' }).avatar,
    'https://pbs.twimg.com/profile_images/1/face_normal.jpg');
  for (const avatar of ['https://host.example/profile_images/1/face.jpg', 'https://pbs.twimg.com/media/face.jpg']) {
    assert.equal(screenMedia({ url, avatar }).avatar, '');
  }
});

test('screen playback keeps a bounded list of trusted MP4 fallback variants', () => {
  const media = screenMedia({
    url: 'https://video.twimg.com/current.mp4',
    fallback: 'https://video.twimg.com/fallback.mp4',
    fallbacks: [
      'https://video.twimg.com/low.mp4?tag=4&token=secret',
      'https://evil.example/clip.mp4',
      'https://video.twimg.com/current.mp4',
    ],
  });
  assert.deepEqual(media.fallbacks, [
    'https://video.twimg.com/fallback.mp4',
    'https://video.twimg.com/low.mp4?tag=4',
  ]);
});

test('a fullscreen reply is safely included in the external screen video state', () => {
  const media = screenMedia({
    url: 'https://video.twimg.com/public.mp4',
    screenComment: {
      id: '456', handle: 'alice', name: 'Alice', text: 'Readable reply',
      date: 'Wed Nov 27 10:24:00 +0000 2026', likeCount: 1234,
      repostCount: 5, bookmarkCount: 2,
      avatar: 'https://pbs.twimg.com/profile_images/1/alice.jpg?token=private',
    },
  });
  assert.deepEqual(media.screenComment, {
    id: '456', author: 'alice', name: 'Alice', text: 'Readable reply',
    date: 'Wed Nov 27 10:24:00 +0000 2026', likeCount: 1234,
    repostCount: 5, bookmarkCount: 2,
    avatar: 'https://pbs.twimg.com/profile_images/1/alice.jpg',
  });
  assert.equal(screenMedia({ url: 'https://video.twimg.com/public.mp4',
    screenComment: { id: 'bad', text: 'ignored' } }).screenComment, null);
});
