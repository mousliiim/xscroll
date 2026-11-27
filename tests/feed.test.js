import assert from 'node:assert/strict';
import test from 'node:test';
import { createFeed } from '../src/player/feed.js';
import { createWatchHistory } from '../src/player/history.js';
import { extractVideos } from '../src/x/model.js';

function tweet(id) {
  return { rest_id: id, legacy: { extended_entities: { media: [{ id_str: `clip-${id}`,
    video_info: { variants: [{ content_type: 'video/mp4', url: `https://video.twimg.com/${id}/1280x720/clip.mp4` }] },
  }] } } };
}

function makeHistory() {
  const storage = new Map();
  return createWatchHistory({
    load: key => storage.get(key) || '[]',
    save: (key, value) => storage.set(key, value),
    now: () => 1700000000000,
  });
}

test('a new Home session skips clips already played before mixing the feed', () => {
  const history = makeHistory();
  const feed = createFeed({ client: {}, history, getContext: () => '/home', random: () => .999, onClips() {}, onPost() {} });
  const source = extractVideos([tweet('1'), tweet('2'), tweet('3')]);
  feed.ingest(source);
  const first = feed.start(null);
  assert.deepEqual(first.clips.map(item => item.tweetId), ['1', '2', '3']);
  feed.mark(first.clips[0]);
  feed.mark(first.clips[1]);
  feed.stop();
  assert.deepEqual(feed.start(null).clips.map(item => item.tweetId), ['3']);
});

test('an explicit video stays first and related pagination crosses pages of already viewed clips', async () => {
  const history = makeHistory();
  const clips = extractVideos([tweet('1'), tweet('2')]);
  for (const clip of clips) history.mark(clip);
  const calls = [];
  const client = { async query(name, variables) {
    calls.push([name, variables.pinned_tweet_id, variables.cursor]);
    if (variables.pinned_tweet_id !== '1') return undefined;
    return variables.cursor ? { data: [tweet('3'), tweet('4')] } :
      { data: [tweet('1'), tweet('2'), { cursorType: 'Bottom', value: 'next' }] };
  } };
  const feed = createFeed({ client, history, getContext: () => '/home', onClips() {}, onPost() {} });
  const session = feed.start(clips[0]);
  assert.deepEqual(session.clips.map(item => item.tweetId), ['1']);
  await feed.replenish(0);
  assert.deepEqual(session.clips.map(item => item.tweetId), ['1', '3', '4']);
  assert.deepEqual(calls.slice(0, 2), [['ImmersiveMedia', '1', undefined], ['ImmersiveMedia', '1', 'next']]);
  assert.ok(calls.length <= 5);
});

test('Home mixers can skip a stale page and follow its next cursor for fresh videos', async () => {
  const history = makeHistory();
  const [old] = extractVideos([tweet('1')]);
  history.mark(old);
  const calls = [];
  const client = { async query(name, variables) {
    calls.push([name, variables.cursor]);
    if (name !== 'TVHomeMixer') return undefined;
    return variables.cursor ? { data: [tweet('2')] } : { data: [tweet('1'), { cursorType: 'Bottom', value: 'more' }] };
  } };
  const feed = createFeed({
    client, history, getContext: () => '/home', advanceTimeline() {}, onClips() {}, onPost() {},
  });
  feed.ingest([old]);
  const session = feed.start(null);
  assert.equal(session.clips.length, 0);
  await feed.replenish(0);
  assert.deepEqual(session.clips.map(item => item.tweetId), ['2']);
  assert.deepEqual(calls.slice(0, 2), [['TVHomeMixer', undefined], ['TVHomeMixer', 'more']]);
});

test('deduplicates a CDN asset under a new tweet or quality variant while mixing Home', () => {
  const history = makeHistory();
  const [watched, first, second] = extractVideos([tweet('1'), tweet('2'), tweet('3')]);
  const asset = 'https://video.twimg.com/ext_tw_video/731/pu/vid/';
  history.mark({ ...watched, url: asset + '960x540/stream.mp4' });
  const republished = { ...watched, key: 'new-media', tweetId: '100', url: asset + '640x360/medium.mp4' };
  const feed = createFeed({ client: {}, history, getContext: () => '/home', random: () => 0, onClips() {}, onPost() {} });
  feed.ingest([first, second, republished]);
  assert.deepEqual(feed.start(null).clips.map(clip => clip.tweetId), ['3', '2']);
});

test('preserves fresh history in memory if local writes are blocked', () => {
  const history = createWatchHistory({ load: () => '[]', save: () => { throw new Error('blocked'); } });
  history.mark({ key: 'seen' });
  assert.equal(history.snapshot().has('seen'), true);
});

test('waits for the requested media instead of playing the first related result', async () => {
  const selected = tweet('1');
  selected.legacy.extended_entities.media[0].media_url_https = 'https://pbs.twimg.com/ext_tw_video_thumb/812/pu/img/p.jpg';
  selected.legacy.extended_entities.media[0].video_info.variants[0].url = 'https://video.twimg.com/ext_tw_video/812/pu/vid/720x1280/exact.mp4';
  const other = tweet('2');
  const stages = [];
  const client = {
    async detail() { return { other }; },
    async query() { return { data: [other, selected] }; },
  };
  const feed = createFeed({ client, history: makeHistory(), getContext: () => '/home',
    onClips: () => stages.push(session.clips.map(clip => clip.tweetId)), onPost() {} });
  const seed = feed.seedFor({
    tweetId: '1', user: 'example', poster: 'https://pbs.twimg.com/ext_tw_video_thumb/812/pu/img/p.jpg?name=small',
  });
  const session = feed.start(seed);
  feed.ingest(extractVideos([other]), session.context);
  assert.deepEqual(session.clips, []);
  await feed.replenish(0);
  assert.deepEqual(session.clips.map(clip => clip.tweetId), ['1', '2']);
  assert.ok(stages.every(ids => ids[0] === '1'));
});

test('selects the video identified by a poster even within a multi-video post', () => {
  const selected = tweet('1');
  const two = tweet('2');
  two.legacy.extended_entities.media[0].media_url_https = 'https://pbs.twimg.com/amplify_video_thumb/892/img/target.jpg';
  two.legacy.extended_entities.media[0].video_info.variants[0].url = 'https://video.twimg.com/amplify_video/892/vid/avc1/720x1280/target.mp4';
  selected.legacy.extended_entities.media.push(two.legacy.extended_entities.media[0]);
  const feed = createFeed({ client: {}, history: makeHistory(), getContext: () => '/home', onClips() {}, onPost() {} });
  feed.ingest(extractVideos([selected]));
  const seed = feed.seedFor({
    tweetId: '1', poster: 'https://pbs.twimg.com/amplify_video_thumb/892/img/target.jpg?name=small',
  });
  assert.equal(feed.start(seed).clips[0].key, 'clip-2');
});

test('remote shuffle starts in any X context and skips videos already played', () => {
  const history = makeHistory();
  const [old, fresh] = extractVideos([tweet('1'), tweet('2')]);
  history.mark(old);
  const feed = createFeed({ client: {}, history, getContext: () => '/profile', onClips() {}, onPost() {} });
  feed.ingest([old, fresh]);
  const session = feed.start(undefined, { command: 'shuffle' });
  assert.deepEqual(session.clips.map(clip => clip.tweetId), ['2']);
});

test('remote topic search starts on the first matching video and paginates within the same query', async () => {
  const calls = [];
  const client = { async query(name, variables) {
    calls.push([name, variables.rawQuery, variables.cursor]);
    return variables.cursor ? { data: [tweet('3')] } :
      { data: [tweet('2'), { cursorType: 'Bottom', value: 'more' }] };
  } };
  const feed = createFeed({ client, history: makeHistory(), getContext: () => '/home', advanceTimeline() {},
    onClips() {}, onPost() {} });
  feed.ingest(extractVideos([tweet('1')]));
  const session = feed.start(undefined, { command: 'search', topic: 'photo de rue' });
  assert.deepEqual(session.clips, []);
  await feed.prime();
  assert.deepEqual(session.clips.map(clip => clip.tweetId), ['2', '3']);
  assert.deepEqual(calls, [
    ['SearchTimeline', 'photo de rue filter:native_video', undefined],
    ['SearchTimeline', 'photo de rue filter:native_video', 'more'],
  ]);
});

test('a return from an obsolete remote search does not change the active feed', async () => {
  let returnSearch;
  const feed = createFeed({
    client: { query() { return new Promise(resolve => { returnSearch = resolve; }); } },
    history: makeHistory(), getContext: () => '/home', onClips() {}, onPost() {},
  });
  const older = feed.start(undefined, { command: 'search', topic: 'old' });
  const inFlight = feed.prime();
  const latest = feed.start(undefined, { command: 'search', topic: 'new' });
  returnSearch({ data: [tweet('1')] });
  await inFlight;
  assert.deepEqual(older.clips, []);
  assert.deepEqual(latest.clips, []);
});

test('native search uses X’s pages and closes the temporary source on completion', async () => {
  const cursors = [];
  let closed = false;
  const [first, second] = extractVideos([tweet('20'), tweet('21')]);
  const feed = createFeed({
    client: { query() { assert.fail('Native search performs the X requests'); } },
    history: makeHistory(), onClips() {}, onPost() {},
    openSearch(topic) {
      assert.equal(topic, 'basket');
      return {
        async page(cursor) {
          cursors.push(cursor);
          return cursor ? { clips: [second] } : { cursor: 'page-2', clips: [first] };
        },
        close() { closed = true; },
      };
    },
  });
  const session = feed.start(undefined, { command: 'search', topic: 'basket' });
  await feed.prime();
  assert.deepEqual(cursors, [undefined, 'page-2']);
  assert.deepEqual(session.clips.map(clip => clip.tweetId), ['20', '21']);
  assert.equal(closed, true);
});
