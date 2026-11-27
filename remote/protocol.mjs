export const REMOTE_PORT = 4781;
export const REMOTE_ORIGIN = 'http://127.0.0.1:4781';
export const REMOTE_PERMISSION = 'http://127.0.0.1/*';
export const MAX_TOPIC_LENGTH = 120;

const playback = new Set(['previous', 'next', 'toggle-play', 'toggle-mute', 'rewind', 'forward', 'slower', 'faster', 'reset-speed', 'replies', 'replies-auto', 'replies-up', 'replies-down', 'fullscreen', 'fullscreen-comments', 'fullscreen-comments-pause', 'fit', 'fill', 'auto-next', 'captions', 'phone-replies-more']);
export const POST_ACTIONS = ['like', 'bookmark', 'repost'];
const postId = value => typeof value === 'string' && /^\d{1,25}$/.test(value);
const requestId = value => typeof value === 'string' && /^[a-f0-9]{16}$/.test(value);
const handle = value => typeof value === 'string' && /^\w{1,15}$/.test(value) ? value : '';
const postErrors = new Set(['changed', 'busy', 'session', 'failed']);
const phases = new Set(['loading', 'ready', 'empty', 'error']);
const settingPercent = (value, minimum, maximum, fallback) => Number.isFinite(value) ?
  minimum + Math.round((Math.max(minimum, Math.min(maximum, value)) - minimum) / 5) * 5 : fallback;

export function remoteTopic(value) {
  if (typeof value !== 'string' || value.length > MAX_TOPIC_LENGTH) return '';
  return value.replace(/[\u0000-\u001f\u007f\s]+/g, ' ').trim();
}

export function remoteCommand(value) {
  if (playback.has(value)) return value;
  if (value?.command === 'volume') {
    return Number.isFinite(value.volume) && value.volume >= 0 && value.volume <= 1 ?
      { command: 'volume', volume: Math.round(value.volume * 100) / 100 } : null;
  }
  if (value?.command === 'phone-replies') {
    return typeof value.open === 'boolean' ? { command: 'phone-replies', open: value.open } : null;
  }
  if (['comment-size', 'comment-transparency', 'comment-speed'].includes(value?.command)) {
    const [minimum, maximum] = value.command === 'comment-size' ? [50, 140] :
      value.command === 'comment-transparency' ? [0, 90] : [25, 200];
    return Number.isInteger(value.value) && value.value >= minimum && value.value <= maximum && (value.value - minimum) % 5 === 0 ?
      { command: value.command, value: value.value } : null;
  }
  if (value?.command === 'speed') {
    const rate = value.rate;
    return Number.isFinite(rate) && rate >= .25 && rate <= 2 ?
      { command: 'speed', rate: Math.round(rate * 100) / 100 } : null;
  }
  if (value?.command === 'speed-preview') {
    return [.5, 2, null].includes(value.rate) ? { command: 'speed-preview', rate: value.rate } : null;
  }
  if (!requestId(value?.id)) return null;
  if (value.command === 'post-action') {
    const { command, id, kind, enabled } = value;
    return POST_ACTIONS.includes(kind) && postId(value.postId) && typeof enabled === 'boolean' ?
      { command, id, kind, postId: value.postId, enabled } : null;
  }
  const { command, id } = value;
  if (command === 'shuffle') return { command, id };
  const topic = command === 'search' ? remoteTopic(value.topic) : '';
  return topic ? { command, id, topic } : null;
}

export function remoteStatus(value) {
  const ready = value?.ready === true;
  const query = remoteCommand(value?.discovery);
  const discovery = (query?.command === 'search' || query?.command === 'shuffle') && phases.has(value.discovery.phase) ?
    { ...query, phase: value.discovery.phase } : null;
  return {
    ready,
    playable: ready && value.playable !== false,
    paused: value?.paused !== false,
    muted: value?.muted === true,
    rate: Number.isFinite(value?.rate) ? Math.max(.25, Math.min(2, value.rate)) : 1,
    rateTarget: Number.isFinite(value?.rateTarget) ? Math.max(.25, Math.min(2, value.rateTarget)) :
      Number.isFinite(value?.rate) ? Math.max(.25, Math.min(2, value.rate)) : 1,
    replies: value?.replies === true,
    autoReplies: value?.autoReplies === true,
    autoNext: value?.autoNext === true,
    fullscreen: value?.fullscreen === true,
    fullscreenComments: value?.fullscreenComments === true,
    fullscreenCommentSize: settingPercent(value?.fullscreenCommentSize, 50, 140, 100),
    fullscreenCommentTransparency: settingPercent(value?.fullscreenCommentTransparency, 0, 90, 30),
    fullscreenCommentSpeed: settingPercent(value?.fullscreenCommentSpeed, 25, 200, 75),
    fullscreenCommentsPaused: value?.fullscreenCommentsPaused === true,
    fullscreenFailed: value?.fullscreenFailed === true,
    fit: value?.fit === 'fill' ? 'fill' : 'contain',
    captions: value?.captions === true,
    captionsAvailable: value?.captionsAvailable === true,
    comments: ready ? remoteComments(value.comments) : null,
    discovery,
    post: ready ? remotePost(value.post) : null,
    postResults: Array.isArray(value?.postResults) ? value.postResults.slice(-8).flatMap(entry => {
      if (!requestId(entry?.id) || !postId(entry.postId) || !POST_ACTIONS.includes(entry.kind)) return [];
      const error = postErrors.has(entry.error) ? entry.error : '';
      return entry.ok === true || error ? [{ id: entry.id, postId: entry.postId, kind: entry.kind, ok: !error, error }] : [];
    }) : [],
    volume: Number.isFinite(value?.volume) ? Math.max(0, Math.min(1, value.volume)) : 1,
    media: ready ? screenMedia(value.media) : null,
  };
}

function remoteComments(value) {
  if (!postId(value?.id) || !phases.has(value.phase)) return null;
  return {
    id: value.id,
    phase: value.phase,
    more: value.more === true,
    items: Array.isArray(value.items) ? value.items.slice(0, 32).flatMap(reply => {
      if (!postId(reply?.id) || typeof reply.text !== 'string') return [];
      return [{ id: reply.id, author: handle(reply.author), name: typeof reply.name === 'string' ? reply.name.slice(0, 70) : '',
        nested: reply.nested === true, text: reply.text.slice(0, 440) }];
    }) : [],
  };
}

function remotePost(value) {
  if (!postId(value?.id)) return null;
  return {
    id: value.id, author: handle(value.author),
    ...Object.fromEntries(POST_ACTIONS.map(kind => [kind, value[kind] === true])),
    pending: Array.isArray(value.pending) ? POST_ACTIONS.filter(kind => value.pending.includes(kind)) : [],
  };
}

function screenAvatar(value) {
  if (typeof value !== 'string' || value.length > 420) return '';
  try {
    const url = new URL(value);
    if (url.origin !== 'https://pbs.twimg.com' || url.username || url.password ||
        !/^\/(?:profile_images|sticky\/default_profile_images)\//.test(url.pathname)) return '';
    return url.origin + url.pathname;
  } catch {
    return '';
  }
}

export function screenMediaURL(value) {
  if (typeof value !== 'string' || value.length > 750) return '';
  try {
    const url = new URL(value);
    if (url.origin !== 'https://video.twimg.com' || url.username || url.password || !/\.mp4$/i.test(url.pathname)) return '';
    const tag = url.searchParams.get('tag');
    url.search = /^\d{1,4}$/.test(tag || '') ? `?tag=${tag}` : '';
    url.hash = '';
    return url.href;
  } catch {
    return '';
  }
}

function screenComment(value) {
  if (!postId(value?.id) || typeof value.text !== 'string') return null;
  return {
    id: value.id,
    author: handle(value.handle),
    name: typeof value.name === 'string' ? value.name.slice(0, 80) : '',
    avatar: screenAvatar(value.avatar),
    text: value.text.slice(0, 1200),
    date: typeof value.date === 'string' && value.date.length <= 80 ? value.date : '',
    ...Object.fromEntries(['likeCount', 'repostCount', 'bookmarkCount'].map(key =>
      [key, Number.isSafeInteger(value[key]) && value[key] >= 0 ? value[key] : undefined])),
  };
}

export function screenMedia(value) {
  if (value?.unavailable === true) return { unavailable: true };
  const url = screenMediaURL(value?.url);
  if (!url) return null;
  const fallback = screenMediaURL(value.fallback);
  const fallbacks = Array.isArray(value.fallbacks) ? value.fallbacks.slice(0, 12)
    .map(screenMediaURL).filter(candidate => candidate && candidate !== url) : [];
  return {
    url,
    fallback: fallback !== url ? fallback : '',
    fallbacks: [...new Set([fallback, ...fallbacks])].filter(candidate => candidate && candidate !== url),
    key: typeof value.key === 'string' && /^\d{1,25}:\d{1,4}$/.test(value.key) ? value.key : '',
    jump: Number.isSafeInteger(value.jump) && value.jump >= 0 ? value.jump : 0,
    time: Number.isFinite(value.time) ? Math.max(0, value.time) : 0,
    duration: Number.isFinite(value.duration) ? Math.max(0, value.duration) : 0,
    stalled: value.stalled === true,
    loop: value.loop !== false,
    fit: value.fit === 'fill' ? 'fill' : 'contain',
    text: typeof value.text === 'string' ? value.text.slice(0, 320) : '',
    subtitle: typeof value.subtitle === 'string' ? value.subtitle.slice(0, 400) : '',
    author: handle(value.author),
    name: typeof value.name === 'string' ? value.name.slice(0, 80) : '',
    avatar: screenAvatar(value.avatar),
    screenComment: screenComment(value.screenComment),
  };
}
