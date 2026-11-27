const VALID_POST = /^\d{1,25}$/;
const VALID_HANDLE = /^[\w]{1,15}$/;

export const isPostId = value => typeof value === 'string' && VALID_POST.test(value);
export const isHandle = value => typeof value === 'string' && VALID_HANDLE.test(value);

export function mediaURL(value, host) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === host && !url.username && !url.password ? url.href : '';
  } catch {
    return '';
  }
}

export function postURL(id) {
  return `https://x.com/i/status/${encodeURIComponent(id)}`;
}

export function postText(value) {
  return (typeof value === 'string' ? value : '').slice(0, 18000)
    .replace(/\s*https:\/\/t\.co\/\w+$/, '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

export function* objects(root) {
  const stack = [root];
  const seen = new WeakSet();
  while (stack.length) {
    const value = stack.pop();
    if (!value || typeof value !== 'object' || seen.has(value)) continue;
    seen.add(value);
    yield value;
    const children = Object.values(value);
    for (let index = children.length - 1; index >= 0; index--) stack.push(children[index]);
  }
}

export function identity(tweet) {
  const user = tweet.core?.user_results?.result;
  const handle = user?.core?.screen_name || user?.legacy?.screen_name;
  const name = user?.core?.name || user?.legacy?.name;
  return {
    handle: isHandle(handle) ? handle : '',
    name: typeof name === 'string' ? name.slice(0, 80) : '',
    avatar: mediaURL(user?.avatar?.image_url || user?.legacy?.profile_image_url_https, 'pbs.twimg.com'),
    bio: postText(user?.profile_bio?.description || user?.legacy?.description),
    followers: counter(user?.legacy?.followers_count),
    userId: user?.rest_id,
    protected: user?.privacy?.protected === true || user?.legacy?.protected === true,
  };
}

function counter(value) {
  return Number.isSafeInteger(value) && value >= 0 ? value : undefined;
}

export function postStats(tweet) {
  const legacy = tweet.legacy || {};
  const flag = value => typeof value === 'boolean' ? value : undefined;
  return {
    like: flag(legacy.favorited ?? tweet.favorited),
    repost: flag(legacy.retweeted ?? tweet.retweeted),
    bookmark: flag(legacy.bookmarked ?? tweet.perspective?.bookmarked ?? tweet.bookmarked),
    likeCount: counter(legacy.favorite_count),
    repostCount: counter(legacy.retweet_count),
    bookmarkCount: counter(legacy.bookmark_count ?? tweet.counts?.bookmark_count),
    replyCount: counter(legacy.reply_count),
  };
}

export function findPost(root, id) {
  for (const node of objects(root)) {
    if ((node.legacy || node.__typename === 'Tweet') && (node.rest_id || node.legacy?.id_str) === id) return node;
  }
  return undefined;
}

export function extractVideos(root) {
  const found = new Map();
  for (const tweet of objects(root)) {
    const legacy = tweet.legacy;
    const id = tweet.rest_id || legacy?.id_str;
    if (!isPostId(id) || legacy?.retweeted_status_result || !Array.isArray(legacy?.extended_entities?.media)) continue;
    const user = identity(tweet);
    const text = postText(tweet.note_tweet?.note_tweet_results?.result?.text || legacy.full_text);
    const stats = postStats(tweet);
    const screenRestricted = user.protected || Boolean(tweet.exclusive_tweet_info || tweet.exclusiveTweetInfo ||
      legacy.withheld_in_countries?.length);
    for (const [mediaIndex, media] of legacy.extended_entities.media.entries()) {
      const values = media.video_info?.variants;
      if (!Array.isArray(values)) continue;
      const variants = values.filter(value => value?.content_type === 'video/mp4')
        .map(value => ({ url: mediaURL(value.url, 'video.twimg.com'), bitrate: value.bitrate || 0 }))
        .filter(value => value.url).sort((a, b) => b.bitrate - a.bitrate).map(({ url }) => {
          const resolution = url.match(/\/(\d+)x(\d+)\//);
          return { url, label: resolution ? `${Math.min(Number(resolution[1]), Number(resolution[2]))}p` : 'Original' };
        });
      if (!variants.length) continue;
      const key = typeof media.id_str === 'string' && /^[\w-]{1,80}$/.test(media.id_str) ? media.id_str : variants[0].url;
      found.set(key, {
        key, tweetId: id, mediaIndex, screenRestricted, poster: mediaURL(media.media_url_https, 'pbs.twimg.com'),
        url: variants[0].url, variants, captionPlaylist: values.map(value => mediaURL(value?.url, 'video.twimg.com'))
          .find(url => /\.m3u8(?:\?|$)/i.test(url)), user: user.handle, userId: user.userId,
        name: user.name, avatar: user.avatar, text,
        date: typeof legacy.created_at === 'string' ? legacy.created_at :
          Number.isFinite(tweet.details?.created_at_ms) ? new Date(tweet.details.created_at_ms).toJSON() || '' : '',
        replyCount: stats.replyCount, stats,
      });
    }
  }
  return [...found.values()];
}

export function acceptClips(values) {
  if (!Array.isArray(values)) return [];
  const clips = [];
  for (const value of values.slice(0, 300)) {
    if (!isPostId(value?.tweetId) || typeof value.key !== 'string' || value.key.length > 500 || !Array.isArray(value.variants)) continue;
    const variants = value.variants.slice(0, 16).flatMap(variant => {
      const url = mediaURL(variant?.url, 'video.twimg.com');
      return url && /^(?:\d{1,4}p|Original)$/.test(variant.label) ? [{ url, label: variant.label }] : [];
    });
    if (!variants.length) continue;
    const stats = {};
    for (const key of ['like', 'repost', 'bookmark']) if (typeof value.stats?.[key] === 'boolean') stats[key] = value.stats[key];
    for (const key of ['likeCount', 'repostCount', 'bookmarkCount', 'replyCount']) stats[key] = counter(value.stats?.[key]);
    clips.push({
      key: value.key, tweetId: value.tweetId, mediaIndex: counter(value.mediaIndex), screenRestricted: value.screenRestricted === true, variants, url: variants[0].url,
      captionPlaylist: mediaURL(value.captionPlaylist, 'video.twimg.com'),
      user: isHandle(value.user) ? value.user : '', name: typeof value.name === 'string' ? value.name.slice(0, 80) : '',
      poster: mediaURL(value.poster, 'pbs.twimg.com'), avatar: mediaURL(value.avatar, 'pbs.twimg.com'),
      text: typeof value.text === 'string' ? value.text.slice(0, 18000) : '',
      date: typeof value.date === 'string' ? value.date.slice(0, 80) : '',
      replyCount: counter(value.replyCount), stats,
    });
  }
  return clips;
}

export function bottomCursor(root) {
  for (const node of objects(root)) {
    if (node.cursorType === 'Bottom' && typeof node.value === 'string') return node.value;
  }
  return undefined;
}
