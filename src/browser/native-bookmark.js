import { BOOKMARK_HELPER, BOOKMARK_MARKER, OBSERVER_CHANNEL, SITE } from '../x/protocol.js';
import { nativePost, nativeButton, waitForDOM } from '../x/actions.js';

export const isBookmarkHelper = location.hash === BOOKMARK_MARKER;

async function applyNativeBookmark(id, desired, wait) {
  function find() {
    const article = nativePost(id);
    const button = nativeButton(article, 'bookmark', true) || nativeButton(article, 'bookmark', false);
    return button && !button.disabled ? { button, active: nativeButton(article, 'bookmark', true) === button } : null;
  }

  const target = wait ? await waitForDOM(find, 6500) : find();
  if (!target) return null;
  const enabled = desired ?? !target.active;
  if (enabled === target.active) return { enabled };
  return new Promise(resolve => {
    const listener = event => {
      if (event.source !== window || event.origin !== SITE || event.data?.channel !== OBSERVER_CHANNEL) return;
      const result = event.data.bookmark;
      if (result?.id === id && result.enabled === enabled) done(result.ok === true ? { enabled } : { failed: true });
    };
    const timer = setTimeout(() => done({ failed: true }), 7500);
    function done(result) {
      clearTimeout(timer);
      window.removeEventListener('message', listener);
      resolve(result);
    }
    window.addEventListener('message', listener);
    target.button.click();
  });
}

export async function bookmarkFromPlayer(postId, enabled) {
  const result = await applyNativeBookmark(postId, enabled, false) ||
    await chrome.runtime.sendMessage({ channel: BOOKMARK_HELPER, type: 'open', postId, enabled }).catch(() => null);
  if (result?.failed) throw new Error('X did not confirm this bookmark.');
  return typeof result?.enabled === 'boolean' ? result : null;
}

export function listenForBookmarkJob() {
  if (!/\/status\/\d+(?:\/|$)/.test(location.pathname)) return;
  void chrome.runtime.sendMessage({ channel: BOOKMARK_HELPER, type: 'ready' }).then(async job => {
    if (!job?.postId) return;
    const result = await applyNativeBookmark(job.postId, job.enabled, true).catch(() => ({ failed: true }));
    await chrome.runtime.sendMessage({ channel: BOOKMARK_HELPER, type: 'result', result });
  }).catch(() => {});
}
