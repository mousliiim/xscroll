import assert from 'node:assert/strict';
import test from 'node:test';
import { actionRequest, createPostActions } from '../src/x/actions.js';
import { createXClient, parseOperations } from '../src/x/client.js';
import { acceptClips, extractVideos, postStats } from '../src/x/model.js';
import { operationFromURL } from '../src/x/protocol.js';
import { extractReplies } from '../src/x/replies.js';
import { pickVariant } from '../src/player/media.js';
import { captionCues } from '../src/player/captions.js';

const video = {
  rest_id: '1',
  legacy: {
    created_at: 'Wed Nov 27 10:24:00 +0000 2026',
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
  assert.equal(clip.date, 'Wed Nov 27 10:24:00 +0000 2026');
  assert.equal(acceptClips([clip])[0].date, clip.date);
  assert.deepEqual(clip.variants.map(value => value.label), ['720p', '360p']);
  assert.equal(acceptClips([{ ...clip, variants: [{ label: '720p', url: 'https://example.org/clip.mp4' }] }]).length, 0);
  assert.equal(pickVariant(clip, 'auto', 500).label, '360p');
  assert.equal(pickVariant(clip, 'best').label, '720p');
});

test('keeps replies in the selected branch and carries the original timestamp and profile fields', () => {
  const date = '2026-11-27T10:24:00Z';
  const item = (id, parent) => ({ item: { itemContent: { tweet_results: { result: {
    rest_id: id, counts: { bookmark_count: 4 },
    core: { user_results: { result: { core: { name: 'A', screen_name: 'alice' }, legacy: { description: 'Profile' } } } },
    legacy: { conversation_id_str: '1', in_reply_to_status_id_str: parent, created_at: date, full_text: 'Reply', favorite_count: 7, retweet_count: 3 },
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
  assert.equal(result.replies[0].likeCount, 7);
  assert.equal(result.replies[0].repostCount, 3);
  assert.equal(result.replies[0].bookmarkCount, 4);
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

test('adds and removes a bookmark through the current X client and requires an acknowledgement', async t => {
  const base = 'https://abs.twimg.com/x-web/x-web/';
  const entry = base + 'entry-client-test.js';
  const bookmarks = base + 'assets/bookmarks-test.js';
  const previous = globalThis.document;
  globalThis.document = { cookie: 'ct0=fixture', scripts: [{ src: entry }] };
  t.after(() => {
    if (previous === undefined) delete globalThis.document;
    else globalThis.document = previous;
  });

  const writes = [];
  let rejectAdd = false;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    if (url === entry) return new Response('import{actions}from"./assets/bookmarks-test.js";');
    if (url === bookmarks) return new Response([
      'const auth = `Bearer fixture-token`;',
      'params:{id:`add`,metadata:{},name:`BookmarkAdd`,operationKind:`mutation`,text:null}',
      'params:{id:`remove`,metadata:{},name:`BookmarkDelete`,operationKind:`mutation`,text:null}',
    ].join('\n'));
    writes.push([url.href, options.credentials, JSON.parse(options.body)]);
    return Response.json(url.pathname.endsWith('/BookmarkDelete') ? { tweet_bookmark_delete: 'Done' } :
      { data: { tweet_bookmark_put: rejectAdd ? 'Error' : 'Done' } });
  });

  const actions = createPostActions(createXClient(), () => {});
  actions.merge('123', postStats({ perspective: { bookmarked: false }, counts: { bookmark_count: 4 } }));
  assert.equal(await actions.toggle('123', 'bookmark', true), true);
  assert.equal(actions.read('123').stats.bookmarkCount, 5);
  assert.equal(await actions.toggle('123', 'bookmark', false), false);
  assert.equal(actions.read('123').stats.bookmarkCount, 4);
  assert.deepEqual(writes, [
    ['https://api.x.com/graphql/add/BookmarkAdd', 'include', { queryId: 'add', variables: { tweetId: '123' } }],
    ['https://api.x.com/graphql/remove/BookmarkDelete', 'include', { queryId: 'remove', variables: { tweetId: '123' } }],
  ]);
  assert.equal(operationFromURL(writes[0][0]).name, 'BookmarkAdd');
  assert.equal(operationFromURL('https://example.test/graphql/add/BookmarkAdd'), null);
  rejectAdd = true;
  await assert.rejects(actions.toggle('123', 'bookmark', true), /did not confirm/);
  assert.equal(actions.read('123').stats.bookmark, false);
});

test('reads the current X conversation format and extracts playable WebVTT cues', () => {
  const response = { data: { threaded_conversation_with_injections_v2: { instructions: [{ entries: [
    { content: { items: [{ item: { content: { tweet_results: { result: {
      rest_id: '345', reply_to_results: { rest_id: '123' }, details: { full_text: 'Reply from X' },
    } } } } }] } },
    { content: { content: { cursor_type: 'Bottom', value: 'next' } } },
  ] }] } } };
  assert.equal(extractReplies(response, '123').replies[0].text, 'Reply from X');
  assert.equal(extractReplies(response, '123').cursor, 'next');
  assert.deepEqual(captionCues('WEBVTT\n\n00:00.500 --> 00:02.000\nHello\n'), [[.5, 2, 'Hello']]);
});
