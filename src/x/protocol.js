export const SITE = 'https://x.com';
export const SEARCH_HELPER = 'xscroll.search.native';
export const SEARCH_MARKER = '#xscroll-video-search';
export const BOOKMARK_HELPER = 'xscroll.bookmark.native';
export const BOOKMARK_MARKER = '#xscroll-bookmark';
export const OBSERVER_CHANNEL = 'xscroll.timeline.v1';

export const QUERY_OPERATIONS = new Set(['ImmersiveMedia', 'TweetDetail', 'TVHomeMixer', 'MediaTabVideoMixer', 'SearchTimeline']);
export const BOOKMARK_OPERATIONS = { CreateBookmark: 'BookmarkAdd', DeleteBookmark: 'BookmarkDelete' };
export const bookmarkDirection = name => ['CreateBookmark', 'BookmarkAdd'].includes(name) ? true :
  ['DeleteBookmark', 'BookmarkDelete'].includes(name) ? false : undefined;

export function bookmarkConfirmed(payload, enabled) {
  const field = enabled ? 'tweet_bookmark_put' : 'tweet_bookmark_delete';
  return !payload?.errors?.length && (payload?.data ?? payload)?.[field] === 'Done';
}
export const MUTATION_OPERATIONS = new Set([
  'FavoriteTweet', 'UnfavoriteTweet', 'CreateRetweet', 'DeleteRetweet', 'CreateBookmark', 'DeleteBookmark',
  ...Object.values(BOOKMARK_OPERATIONS),
]);

const TIMELINE_OPERATIONS = /^(?:Home(?:Latest)?Timeline|User(?:Tweets(?:AndReplies)?|Media|HighlightsTweets|Likes)|SearchTimeline|Community\w*Timeline|List(?:Latest)?TweetsTimeline|TweetResultByRestId|Bookmarks|Explore\w*Timeline)$/;

export function watchesTimeline(name) {
  return QUERY_OPERATIONS.has(name) || TIMELINE_OPERATIONS.test(name);
}

export function timelineContext(url = location.href) {
  const current = new URL(url);
  if (current.pathname === '/search') {
    return `search:${current.searchParams.get('q') || ''}:${current.searchParams.get('f') || ''}`;
  }
  return current.pathname;
}

export function operationFromURL(value) {
  try {
    const url = new URL(value, SITE);
    const path = url.origin === SITE && url.pathname.startsWith('/i/api/') ? url.pathname.slice(6) :
      url.origin === 'https://api.x.com' ? url.pathname : '';
    const [, id, name] = path.match(/^\/graphql\/([\w-]{1,80})\/(\w+)$/) || [];
    return name ? { id, name, url } : null;
  } catch {
    return null;
  }
}
