import { bottomCursor, extractVideos } from '../x/model.js';
import { timelineContext } from '../x/protocol.js';
import { clipIdentities, createWatchHistory } from './history.js';
import { directVideo, selectVideo } from './selection.js';

const RETAINED_CONTEXTS = 16;
const CONTEXT_LIMIT = 180;
const VIDEO_INDEX_LIMIT = 1400;
const PREFILL = 5;
const SCAN_BUDGET = 5;
const HOME_MIXERS = ['TVHomeMixer', 'MediaTabVideoMixer'];

function sourcesFor(context, seed, discovery) {
  if (discovery?.command === 'search') return [createSource('SearchTimeline')];
  return !seed && context === '/home' ? HOME_MIXERS.map(createSource) : [];
}

function boundedSet(map, key, value, limit) {
  map.delete(key);
  map.set(key, value);
  if (map.size > limit) map.delete(map.keys().next().value);
}

function rememberCursor(source, next) {
  if (next && !source.seenCursors.has(next)) {
    source.seenCursors.add(next);
    source.cursor = next;
    return;
  }
  source.cursor = undefined;
  source.done = true;
}

function createSource(name) {
  return { name, cursor: undefined, seenCursors: new Set(), done: false };
}

export function createFeed({
  client, onClips, onPost, onStatus = () => {},
  getContext = timelineContext,
  advanceTimeline = () => window.scrollTo(0, document.documentElement.scrollHeight),
  history = createWatchHistory(), random = Math.random, openSearch,
}) {
  const contexts = new Map();
  const byMedia = new Map();
  let session;
  let lastNativeScroll = -Infinity;

  function mix(clips) {
    const items = [...clips];
    for (let index = items.length - 1; index > 0; index--) {
      const choice = Math.min(index, Math.floor(random() * (index + 1)));
      [items[index], items[choice]] = [items[choice], items[index]];
    }
    return items;
  }

  function append(active, clips, force = false) {
    let count = 0;
    for (const clip of clips) {
      const aliases = clipIdentities(clip);
      if (aliases.some(key => active.keys.has(key) || (!force && active.seenBefore.has(key)))) continue;
      for (const alias of aliases) active.keys.add(alias);
      active.clips.push(clip);
      count++;
    }
    return count;
  }

  function cache(clips, context) {
    if (!clips.length) return;
    const list = contexts.get(context) || new Map();
    for (const clip of clips) {
      boundedSet(list, clip.key, clip, CONTEXT_LIMIT);
      boundedSet(byMedia, clip.key, clip, VIDEO_INDEX_LIMIT);
      onPost(clip.tweetId, clip.stats);
    }
    boundedSet(contexts, context, list, RETAINED_CONTEXTS);
  }

  function pinSelection(active, clip) {
    if (!active.awaitingSeed || !clip) return 0;
    active.awaitingSeed = false;
    active.seed = clip;
    return append(active, [clip], true) + append(active, contexts.get(active.context)?.values() || []);
  }

  function ingest(clips, context = getContext(), expected = session) {
    cache(clips, context);
    if (!expected || expected !== session) return 0;
    let inserted = 0;
    if (expected.awaitingSeed) {
      inserted += pinSelection(expected, selectVideo(expected.seed, clips));
    }
    if (!expected.awaitingSeed && expected.context === context) {
      inserted += append(expected, expected.mix ? mix(clips) : clips);
    }
    if (inserted) onClips();
    return inserted;
  }

  function nextRelated(active, index) {
    if (active.related && !active.related.done) return active.related;
    const options = active.awaitingSeed ? [active.seed] : [
      active.seed, active.clips[index], active.clips.at(-1),
      ...[...active.suggestions.values()].reverse(),
      ...[...contexts.get(active.context)?.values() || []].reverse(),
    ];
    const anchor = options.find(clip => clip?.tweetId && !active.usedAnchors.has(clip.tweetId));
    if (!anchor) return undefined;
    active.usedAnchors.add(anchor.tweetId);
    active.related = { ...createSource('ImmersiveMedia'), anchor };
    return active.related;
  }

  async function scan(active, index, forced, opening) {
    active.loading = true;
    active.failed = false;
    const sizeBefore = active.clips.length;
    onStatus({ loading: true });
    try {
      if (active.awaitingSeed && active.seed.tweetId) {
        const detail = await client.detail(active.seed.tweetId);
        if (active !== session) return;
        if (active.awaitingSeed) {
          const clip = selectVideo(active.seed, extractVideos(detail));
          if (clip) ingest([clip], active.context, active);
        }
      }

      if (!active.seed && active.discovery?.command !== 'search' && getContext() === active.context &&
          (forced || performance.now() - lastNativeScroll > 1000)) {
        lastNativeScroll = performance.now();
        advanceTimeline();
      }

      for (let request = 0; request < SCAN_BUDGET && active === session; request++) {
        if (active.clips.length - index >= PREFILL && !(opening && request === 0)) break;
        let source = active.mixers.find(item => !item.done);
        if (!source && (active.seed || active.context === '/home')) source = nextRelated(active, index);
        if (!source) break;

        const { name, cursor, anchor } = source;
        const variables = cursor ? { cursor } : {};
        if (name === 'SearchTimeline') Object.assign(variables, {
          rawQuery: `${active.discovery.topic} filter:native_video`, querySource: 'typed_query', product: 'Top', count: 20,
        });
        if (anchor) Object.assign(variables, {
          pinned_tweet_id: anchor.tweetId, page_name: anchor.user || '', includePromotedContent: false,
        });
        const native = name === 'SearchTimeline' && openSearch;
        if (native && !active.search) active.search = openSearch(active.discovery.topic);
        const payload = native ? await active.search.page(cursor) : await client.query(name, variables);
        if (active !== session) return;
        if (name === 'SearchTimeline' && !payload) {
          active.failed = true;
          source.done = true;
          active.search?.close();
          active.search = undefined;
          break;
        }
        rememberCursor(source, native ? payload.cursor : bottomCursor(payload));
        if (native && source.done) {
          active.search.close();
          active.search = undefined;
        }
        const clips = native ? payload.clips : extractVideos(payload);
        for (const clip of clips) boundedSet(active.suggestions, clip.key, clip, CONTEXT_LIMIT);
        ingest(clips, active.context, active);
      }
    } finally {
      active.loading = false;
      if (session === active) {
        active.scannedAt = active.clips.length === sizeBefore ? index : -1;
        onStatus({ loading: false, added: active.clips.length > sizeBefore });
      }
    }
  }

  return {
    ingest,
    seedFor(selection) {
      const { tweetId, poster, source } = selection;
      if (!tweetId && !poster && !source) return null;
      return selectVideo(selection, byMedia.values()) || directVideo(selection) || selection;
    },
    start(seed, discovery) {
      session?.search?.close();
      const shuffled = discovery?.command === 'shuffle';
      const searching = discovery?.command === 'search';
      const context = searching ? `search:remote:${discovery.topic}` : shuffled ? '/home' :
        seed ? `immersive:${seed.tweetId}` : getContext();
      session = {
        context, seed, discovery, awaitingSeed: Boolean(seed && !seed.url), mix: !seed && context === '/home',
        clips: [], keys: new Set(), seenBefore: history.snapshot(), mixers: sourcesFor(context, seed, discovery),
        suggestions: new Map(), usedAnchors: new Set(), related: undefined, scannedAt: -1,
      };
      if (seed?.url) append(session, [seed], true);
      for (const clip of byMedia.values()) {
        if (!session.seenBefore.has(clip.key)) continue;
        for (const alias of clipIdentities(clip)) session.seenBefore.add(alias);
      }
      const cached = contexts.get(context)?.values() || [];
      if (shuffled) {
        const pool = [...byMedia.values()].slice(-CONTEXT_LIMIT);
        const candidates = new Map([...cached, ...pool].map(clip => [clip.key, clip]));
        append(session, mix(candidates.values()));
        for (const clip of pool) boundedSet(session.suggestions, clip.key, clip, CONTEXT_LIMIT);
      } else if (!session.awaitingSeed) append(session, session.mix ? mix(cached) : cached);
      return session;
    },
    prime() {
      const active = session;
      if (!active || active.loading || (!active.seed && !active.discovery && active.context !== '/home')) return;
      return scan(active, 0, false, true);
    },
    stop() { session?.search?.close(); session = undefined; },
    mark: clip => history.mark(clip),
    replenish(index, forced = false) {
      const active = session;
      if (!active || active.loading || active.clips.length - index >= PREFILL || (!forced && active.scannedAt >= index)) return;
      if (forced && active.mixers.every(source => source.done) && (!active.related || active.related.done)) {
        active.search?.close();
        active.search = undefined;
        active.mixers = sourcesFor(active.context, active.seed, active.discovery);
        active.usedAnchors.clear();
        active.related = undefined;
      }
      return scan(active, index, forced);
    },
  };
}
