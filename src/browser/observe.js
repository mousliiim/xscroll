import { bottomCursor, extractVideos } from '../x/model.js';
import { MUTATION_OPERATIONS, OBSERVER_CHANNEL, SITE, operationFromURL, timelineContext, watchesTimeline } from '../x/protocol.js';

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
  }, SITE);
}

window.fetch = async function (...args) {
  const context = timelineContext();
  const response = await nativeFetch.apply(this, args);
  const operation = operationFromURL(response.url);
  if (operation && response.ok && (watchesTimeline(operation.name) || MUTATION_OPERATIONS.has(operation.name))) {
    response.clone().json().then(data => relay(operation, data, context)).catch(() => {});
  }
  return response;
};

XMLHttpRequest.prototype.send = function (...args) {
  const context = timelineContext();
  this.addEventListener('load', () => {
    const operation = operationFromURL(this.responseURL);
    if (!operation || this.status < 200 || this.status >= 300 || (!watchesTimeline(operation.name) && !MUTATION_OPERATIONS.has(operation.name))) return;
    try {
      const data = this.responseType === '' || this.responseType === 'text' ? JSON.parse(this.responseText) : this.response;
      relay(operation, data, context);
    } catch {
      // Other X endpoints can return a response format the observer does not consume.
    }
  }, { once: true });
  return nativeSend.apply(this, args);
};
