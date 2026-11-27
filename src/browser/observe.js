import { bottomCursor, extractVideos } from '../x/model.js';
import { bookmarkConfirmed, bookmarkDirection, MUTATION_OPERATIONS, OBSERVER_CHANNEL, SITE, operationFromURL, timelineContext, watchesTimeline } from '../x/protocol.js';

const nativeFetch = window.fetch;
const nativeSend = XMLHttpRequest.prototype.send;

function relay(request, data, context) {
  const clips = watchesTimeline(request.name) ? extractVideos(data) : [];
  const { name, id, url } = request;
  const search = name === 'SearchTimeline';
  let from;
  if (search) {
    try { from = JSON.parse(url.searchParams.get('variables'))?.cursor; } catch {}
  }
  window.postMessage({
    channel: OBSERVER_CHANNEL, name, id, context, clips, ...(search && { from, cursor: bottomCursor(data) }),
    features: url.searchParams.get('features'),
    toggles: url.searchParams.get('fieldToggles'),
    relay: url.origin === 'https://api.x.com',
    ...(name === 'TweetDetail' && { variables: url.searchParams.get('variables') }),
  }, SITE);
}

function reportBookmark(operation, body, payload, ok) {
  const enabled = bookmarkDirection(operation?.name);
  if (enabled === undefined) return;
  try {
    const { variables } = JSON.parse(body);
    const id = variables?.tweetId ?? variables?.tweet_id;
    if (typeof id === 'string' && /^\d{1,25}$/.test(id)) window.postMessage({
      channel: OBSERVER_CHANNEL, bookmark: { id, enabled, ok: ok && bookmarkConfirmed(payload, enabled) },
    }, SITE);
  } catch { /* Other requests do not carry a bookmark identifier. */ }
}

window.fetch = async function (...args) {
  const context = timelineContext();
  const operationBefore = operationFromURL(args[0]?.url || args[0]);
  const body = bookmarkDirection(operationBefore?.name) !== undefined &&
    (typeof args[1]?.body === 'string' ? args[1].body : args[0] instanceof Request ? args[0].clone().text().catch(() => '') : '');
  const response = await nativeFetch.apply(this, args);
  const operation = operationFromURL(response.url);
  if (operation && (watchesTimeline(operation.name) || MUTATION_OPERATIONS.has(operation.name))) {
    response.clone().json().catch(() => null).then(async data => {
      if (response.ok) relay(operation, data, context);
      if (body) reportBookmark(operation, await body, data, response.ok);
    }).catch(() => {});
  }
  return response;
};

XMLHttpRequest.prototype.send = function (...args) {
  const context = timelineContext();
  this.addEventListener('load', () => {
    const operation = operationFromURL(this.responseURL);
    if (!operation || (!watchesTimeline(operation.name) && !MUTATION_OPERATIONS.has(operation.name))) return;
    const ok = this.status >= 200 && this.status < 300;
    let data;
    try {
      data = this.responseType === '' || this.responseType === 'text' ? JSON.parse(this.responseText) : this.response;
      if (ok) relay(operation, data, context);
    } catch {
      // Other X endpoints can return a response format the observer does not consume.
    }
    if (typeof args[0] === 'string') reportBookmark(operation, args[0], data, ok);
  }, { once: true });
  return nativeSend.apply(this, args);
};
