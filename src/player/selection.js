import { isPostId, mediaURL } from '../x/model.js';

export function postReference(pathname) {
  const [, user, tweetId, index] = pathname?.match(/^\/([\w]+)\/status\/(\d{1,25})(?:\/video\/(\d+))?(?:\/|$)/) || [];
  return tweetId ? { tweetId, user, index: index ? Number(index) - 1 : undefined } : {};
}

function assetKey(value) {
  const trusted = mediaURL(value, 'video.twimg.com') || mediaURL(value, 'pbs.twimg.com');
  if (!trusted) return '';
  const { pathname } = new URL(trusted);
  const asset = pathname.match(/^\/(ext_tw_video|amplify_video|tweet_video)(?:_thumb)?\/([^/]+)/);
  if (asset) return `${asset[1]}:${asset[2].replace(/\.[a-z]+\d*$/i, '')}`;
  return pathname.replace(/\/\d+x\d+\//, '/');
}

function matchesAsset(selection, video) {
  const hints = [assetKey(selection.poster), assetKey(selection.source)].filter(Boolean);
  return [video.poster, video.url, ...video.variants.map(item => item.url)].some(url => {
    const key = assetKey(url);
    return key && hints.includes(key);
  });
}

export function selectVideo(selection, clips) {
  const videos = [...clips];
  const samePost = videos.filter(video => video.tweetId === selection.tweetId);
  const hasMediaHint = selection.poster || selection.source;
  if (hasMediaHint) {
    const exact = samePost.find(video => matchesAsset(selection, video)) || videos.find(video => matchesAsset(selection, video));
    if (exact) return exact;
  }
  if (Number.isInteger(selection.index) && selection.index >= 0) {
    return samePost.find(video => video.mediaIndex === selection.index);
  }
  return hasMediaHint ? undefined : samePost[0];
}

export function screenVideoSources(clip) {
  const variants = (clip?.variants || []).map(variant => ({
    url: variant.url,
    size: Number.parseInt(variant.label, 10),
    label: variant.label,
  })).filter(variant => typeof variant.url === 'string' && variant.url);
  const compatible = variants.filter(variant => variant.size > 0 && variant.size <= 480)
    .sort((a, b) => b.size - a.size);
  const known = variants.filter(variant => variant.size > 0).sort((a, b) => a.size - b.size);
  const preferred = compatible[0] || known[0] || variants.at(-1);
  const fallbacks = variants.filter(variant => variant.url !== preferred?.url &&
    (variant.size > 0 && variant.size <= 720 || variant.label === 'Original'))
    .sort((a, b) => {
      const firstGroup = a.size > 0 && a.size <= 480 ? 0 : 1;
      const secondGroup = b.size > 0 && b.size <= 480 ? 0 : 1;
      return firstGroup - secondGroup ||
        (firstGroup ? (a.size || Infinity) - (b.size || Infinity) : b.size - a.size);
    });
  return { url: preferred?.url || '', fallbacks: fallbacks.map(variant => variant.url) };
}

export function directVideo(selection) {
  const url = mediaURL(selection.source, 'video.twimg.com');
  if (!isPostId(selection.tweetId) || !url || !/\.mp4$/i.test(new URL(url).pathname)) return undefined;
  return {
    key: url, url, variants: [{ url, label: 'Original' }],
    tweetId: selection.tweetId, user: selection.user || '', poster: selection.poster || '',
  };
}
