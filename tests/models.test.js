import assert from 'node:assert/strict';
import test from 'node:test';
import { actionRequest, createPostActions } from '../src/x/actions.js';
import { parseOperations } from '../src/x/client.js';
import { acceptClips, extractVideos } from '../src/x/model.js';
import { extractReplies } from '../src/x/replies.js';
import { pickVariant } from '../src/player/media.js';

const video = {
  rest_id: '1',
  legacy: {
    full_text: 'One &amp; two https://t.co/abc',
    favorited: true, retweeted: false, bookmarked: false, favorite_count: 5,
    extended_entities: { media: [{ id_str: 'v1', video_info: { variants: [
      { content_type: 'video/mp4', url: 'https://video.twimg.com/1/640x360/clip.mp4', bitrate: 100 },
      { content_type: 'video/mp4', url: 'https://video.twimg.com/1/1280x720/clip.mp4', bitrate: 200 },
      { content_type: 'video/mp4', url: 'https://example.test/1/1600x900/clip.mp4', bitrate: 300 },
    ] } }] },
  },
};

test('normalizes playable media, avoids duplicate or untrusted media and retains viewer state', () => {
  const [clip, ...duplicates] = extractVideos({ items: [video, video] });
  assert.deepEqual(duplicates, []);
  assert.equal(clip.text, 'One & two');
  assert.equal(clip.stats.like, true);
  assert.equal(clip.stats.likeCount, 5);
  assert.deepEqual(clip.variants.map(value => value.label), ['720p', '360p']);
  assert.equal(acceptClips([{ ...clip, variants: [{ label: '720p', url: 'https://example.org/clip.mp4' }] }]).length, 0);
  assert.equal(pickVariant(clip, 'auto', 500).label, '360p');
  assert.equal(pickVariant(clip, 'best').label, '720p');
});

test('keeps replies in the selected branch and carries the original timestamp and profile fields', () => {
  const date = '2026-11-27T10:24:00Z';
  const item = (id, parent) => ({ item: { itemContent: { tweet_results: { result: {
    rest_id: id, core: { user_results: { result: { core: { name: 'A', screen_name: 'alice' }, legacy: { description: 'Profile' } } } },
    legacy: { conversation_id_str: '1', in_reply_to_status_id_str: parent, created_at: date, full_text: 'Reply' },
  } } } } });
  const payload = { data: { threaded_conversation_with_injections_v2: { instructions: [
    { entries: [
      { content: { items: [item('3', '2'), item('4', '3'), item('5', '1')] } },
      { content: { cursorType: 'Bottom', value: 'more' } },
    ] },
  ] } } };
  const result = extractReplies(payload, '2');
  assert.deepEqual(result.replies.map(reply => reply.id), ['3', '4']);
  assert.equal(result.replies[0].date, date);
  assert.equal(result.replies[0].bio, 'Profile');
  assert.equal(result.cursor, 'more');
});

test('discovers allowlisted queries and writes with distinct operation variables', () => {
  const { operations } = parseOperations([
    'queryId:"read",operationName:"TweetDetail",operationType:"query",metadata:{featureSwitches:["flag"],fieldToggles:[]}',
    'queryId:"write",operationName:"CreateBookmark",operationType:"mutation"',
    'queryId:"ignored",operationName:"DeleteTweet",operationType:"mutation"',
  ]);
  assert.equal(operations.get('TweetDetail').features, '{"flag":true}');
  assert.equal(operations.get('CreateBookmark').id, 'write');
  assert.equal(operations.has('DeleteTweet'), false);
  assert.deepEqual(actionRequest('repost', false, '1'), { name: 'DeleteRetweet', variables: { source_tweet_id: '1' } });
  assert.equal(actionRequest('other', true, '1'), null);
});

test('only updates a post after X confirms and deduplicates simultaneous clicks', async () => {
  const calls = [];
  let succeed;
  const client = { mutate(name, variables) {
    calls.push([name, variables]);
    return new Promise((resolve, reject) => {
      succeed = value => value ? resolve({ data: {} }) : reject(new Error('Network'));
    });
  } };
  const actions = createPostActions(client, () => {});
  actions.merge('1', { like: false, likeCount: 4 });
  const request = actions.toggle('1', 'like');
  await actions.toggle('1', 'like');
  assert.equal(calls.length, 1);
  assert.equal(actions.read('1').stats.like, false);
  succeed(true);
  assert.equal(await request, true);
  assert.equal(actions.read('1').stats.likeCount, 5);
  const failure = actions.toggle('1', 'like');
  succeed(false);
  await assert.rejects(failure, /Network/);
  assert.equal(actions.read('1').stats.like, true);
  assert.equal(actions.read('1').pending.size, 0);
});

test('an explicit remote action is idempotent when the post already has the requested state', async () => {
  const calls = [];
  const actions = createPostActions({ async mutate(name, variables) { calls.push({ name, variables }); } }, () => {});
  actions.merge('123', { bookmark: false });
  assert.equal(await actions.toggle('123', 'bookmark', true), true);
  assert.equal(await actions.toggle('123', 'bookmark', true), true);
  assert.deepEqual(calls, [{ name: 'CreateBookmark', variables: { tweet_id: '123' } }]);
});
