import { remoteTopic } from '../../remote/protocol.mjs';
import { acceptClips } from '../x/model.js';
import { SEARCH_HELPER, SEARCH_MARKER, SITE } from '../x/protocol.js';

const jobs = new Map();
const senderURL = sender => {
  try { return new URL(sender?.url); } catch { return null; }
};
const allowedCursor = value => typeof value === 'string' && value.length > 0 && value.length <= 3000 ? value : undefined;

export function nativeSearchResults(message, sender) {
  const job = jobs.get(sender?.tab?.id);
  const url = senderURL(sender);
  if (!job || sender.frameId !== 0 || url?.origin !== SITE || url.pathname !== '/search') return;
  job.receive({
    clips: acceptClips(message.clips),
    cursor: allowedCursor(message.cursor),
    from: allowedCursor(message.from),
  });
}

export function connectSearchTabs(port) {
  const sender = port.sender;
  const url = senderURL(sender);
  if (port.name !== SEARCH_HELPER || sender?.id !== chrome.runtime.id || sender.frameId !== 0 ||
      url?.origin !== SITE || url.hash === SEARCH_MARKER || !Number.isInteger(sender.tab?.id)) return;
  let closed = false, tab, topic, expected, pending = false, timer;
  const pages = new Map();

  function close() {
    if (closed) return;
    closed = true;
    clearTimeout(timer);
    if (tab !== undefined) {
      jobs.delete(tab);
      void chrome.tabs.remove(tab).catch(() => {});
    }
    port.disconnect();
  }

  function answer(result) {
    if (closed) return;
    pending = false;
    try { port.postMessage(result || {}); }
    catch { close(); return; }
    clearTimeout(timer);
    timer = setTimeout(close, result?.cursor ? 120000 : 0);
  }

  const job = {
    receive(result) {
      if (pending && result.from === expected) answer(result);
      else if (pages.size < 4) pages.set(result.from, result);
    },
  };

  async function page(message) {
    if (closed || pending) return;
    const subject = remoteTopic(message.topic);
    if (!subject || (topic && subject !== topic)) return close();
    topic = subject;
    expected = allowedCursor(message.cursor);
    pending = true;
    clearTimeout(timer);
    timer = setTimeout(() => answer(), tab === undefined ? 18000 : 7500);
    if (pages.has(expected)) {
      const cached = pages.get(expected);
      pages.delete(expected);
      answer(cached);
      return;
    }
    if (tab === undefined) {
      const created = await chrome.tabs.create({ active: false, url: 'about:blank', windowId: sender.tab.windowId });
      if (closed) {
        void chrome.tabs.remove(created.id).catch(() => {});
        return;
      }
      tab = created.id;
      jobs.set(tab, job);
      const search = new URL('/search', SITE);
      search.search = new URLSearchParams({ q: `${topic} filter:native_video`, src: 'typed_query', f: 'video' });
      search.hash = SEARCH_MARKER;
      await chrome.tabs.update(tab, { url: search.href });
      return;
    }
    await chrome.tabs.sendMessage(tab, { channel: SEARCH_HELPER, type: 'next' });
  }

  port.onMessage.addListener(message => {
    if (message?.type === 'page') void page(message).catch(() => answer());
  });
  port.onDisconnect.addListener(close);
}
