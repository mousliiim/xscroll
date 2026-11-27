import { findPost, isPostId, postStats } from './model.js';

const ACTIONS = {
  like: { on: 'FavoriteTweet', off: 'UnfavoriteTweet', native: ['like', 'unlike'] },
  repost: { on: 'CreateRetweet', off: 'DeleteRetweet', native: ['retweet', 'unretweet'] },
  bookmark: { on: 'CreateBookmark', off: 'DeleteBookmark', native: ['bookmark', 'removeBookmark'] },
};

export function actionRequest(kind, enabled, id) {
  if (!Object.hasOwn(ACTIONS, kind) || !isPostId(id)) return null;
  const name = ACTIONS[kind][enabled ? 'on' : 'off'];
  const variables = name === 'DeleteRetweet' ? { source_tweet_id: id } :
    name === 'CreateRetweet' ? { tweet_id: id, dark_request: false } : { tweet_id: id };
  return { name, variables };
}

function nativePost(id) {
  for (const article of document.querySelectorAll('article')) {
    const href = article.querySelector('a[href*="/status/"] time')?.closest('a')?.pathname;
    if (href?.match(/\/status\/(\d+)/)?.[1] === id) return article;
  }
  return null;
}

function nativeButton(article, kind, enabled) {
  const legacy = article?.querySelector(`[data-testid="${ACTIONS[kind].native[Number(enabled)]}"]`);
  return legacy || (kind === 'bookmark' && article?.querySelector(`[data-engagement-action="bookmark"] button[aria-pressed="${enabled}"]`));
}

function waitForDOM(read, timeout) {
  return new Promise(resolve => {
    const value = read();
    if (value) { resolve(value); return; }
    const observer = new MutationObserver(() => {
      const result = read();
      if (result) finish(result);
    });
    let timer;
    function finish(result) {
      clearTimeout(timer);
      observer.disconnect();
      resolve(result);
    }
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-testid', 'aria-pressed'] });
    timer = setTimeout(() => finish(null), timeout);
  });
}

async function nativeToggle(id, kind, enabled) {
  const article = nativePost(id);
  if (!article) return false;
  if (nativeButton(article, kind, enabled)) return true;
  const button = nativeButton(article, kind, !enabled);
  if (!button) return false;
  button.click();
  if (kind === 'repost') {
    const testId = enabled ? 'retweetConfirm' : 'unretweetConfirm';
    const confirmation = await waitForDOM(() => document.querySelector(`[data-testid="${testId}"]`), 1300);
    if (!confirmation) return false;
    confirmation.click();
  }
  return Boolean(await waitForDOM(() => nativeButton(nativePost(id), kind, enabled), 2500));
}

export function createPostActions(client, notify) {
  const posts = new Map();

  function record(id) {
    if (!posts.has(id)) {
      if (posts.size >= 1200) {
        for (const [key, entry] of posts) {
          if (!entry.pending.size) { posts.delete(key); break; }
        }
      }
      posts.set(id, { stats: {}, pending: new Set(), confirmed: new Set() });
    }
    return posts.get(id);
  }

  function merge(id, values, overwrite = false) {
    if (!isPostId(id) || !values) return;
    const item = record(id);
    let changed = false;
    for (const [key, value] of Object.entries(values)) {
      const kind = key.endsWith('Count') ? key.slice(0, -5) : key;
      if (value === undefined || item.confirmed.has(kind)) continue;
      if ((overwrite || item.stats[key] === undefined) && item.stats[key] !== value) {
        item.stats[key] = value;
        changed = true;
      }
    }
    if (changed) notify(id);
  }

  return {
    merge,
    read(id) {
      return isPostId(id) ? record(id) : null;
    },
    async toggle(id, kind, desired) {
      if (!actionRequest(kind, true, id)) return;
      const item = record(id);
      if (item.pending.has(kind)) return;
      item.pending.add(kind);
      notify(id);
      try {
        if (item.stats[kind] === undefined) {
          const article = nativePost(id);
          if (nativeButton(article, kind, true)) item.stats[kind] = true;
          else if (nativeButton(article, kind, false)) item.stats[kind] = false;
          else {
            const tweet = findPost(await client.detail(id), id);
            if (tweet) merge(id, postStats(tweet), true);
          }
        }
        const enabled = desired ?? !item.stats[kind];
        if (item.stats[kind] === enabled) return enabled;
        const { name, variables } = actionRequest(kind, enabled, id);
        try {
          await client.mutate(name, variables);
        } catch (error) {
          // For an unavailable operation X's own post controls can handle the action when present.
          // Avoid retrying a delivered request with an uncertain server outcome.
          if (error.code !== 'unavailable' || !await nativeToggle(id, kind, enabled)) throw error;
        }
        item.stats[kind] = enabled;
        const count = `${kind}Count`;
        if (Number.isFinite(item.stats[count])) item.stats[count] = Math.max(0, item.stats[count] + (enabled ? 1 : -1));
        item.confirmed.add(kind);
        return enabled;
      } finally {
        item.pending.delete(kind);
        notify(id);
      }
    },
  };
}
