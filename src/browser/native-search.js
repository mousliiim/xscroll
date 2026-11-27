import { OBSERVER_CHANNEL, SITE, SEARCH_HELPER, SEARCH_MARKER } from '../x/protocol.js';

export const isSearchHelper = location.pathname === '/search' && location.hash === SEARCH_MARKER;

export function openNativeSearch(topic) {
  const port = chrome.runtime.connect({ name: SEARCH_HELPER });
  let pending, closed = false;
  const keepAlive = setInterval(() => {
    if (closed) return;
    try { port.postMessage({ type: 'ping' }); } catch { close(); }
  }, 18000);
  function finish(result) {
    const resolve = pending;
    pending = undefined;
    resolve?.(result);
  }
  function close() {
    if (closed) return;
    closed = true;
    clearInterval(keepAlive);
    finish();
    port.disconnect();
  }
  port.onDisconnect.addListener(close);
  port.onMessage.addListener(result => finish(Array.isArray(result?.clips) ? result : undefined));
  return {
    page(cursor) {
      if (closed || pending) return Promise.resolve(undefined);
      return new Promise(resolve => {
        pending = resolve;
        try { port.postMessage({ type: 'page', topic, cursor }); }
        catch { close(); }
      });
    },
    close,
  };
}

export function listenForNativeResults() {
  window.addEventListener('message', event => {
    const data = event.data;
    if (event.source !== window || event.origin !== SITE || data?.channel !== OBSERVER_CHANNEL ||
        data.name !== 'SearchTimeline' || !data.context?.startsWith('search:')) return;
    if (!Array.isArray(data.clips)) return;
    void chrome.runtime.sendMessage({
      channel: SEARCH_HELPER, clips: data.clips.slice(0, 300), cursor: data.cursor, from: data.from,
    }).catch(() => {});
  });
  chrome.runtime.onMessage.addListener((message, sender, respond) => {
    if (sender.id !== chrome.runtime.id || message?.channel !== SEARCH_HELPER || message.type !== 'next') return;
    const articles = document.querySelectorAll('main article');
    articles[articles.length - 1]?.scrollIntoView({ block: 'end', behavior: 'instant' });
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' });
    respond(true);
  });
}
