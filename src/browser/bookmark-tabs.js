import { isPostId, postURL } from '../x/model.js';
import { BOOKMARK_MARKER } from '../x/protocol.js';

const jobs = new Map();

export async function bookmarkInTab(postId, enabled, windowId) {
  if (!isPostId(postId) || (enabled !== undefined && typeof enabled !== 'boolean')) return null;
  const tab = await chrome.tabs.create({ windowId, active: false, url: 'about:blank' });
  let timeout;
  try {
    return await new Promise((resolve, reject) => {
      jobs.set(tab.id, { postId, enabled, resolve, started: false });
      timeout = setTimeout(() => resolve(jobs.get(tab.id)?.started ? { failed: true } : null), 18000);
      chrome.tabs.update(tab.id, { url: postURL(postId) + BOOKMARK_MARKER }).catch(reject);
    }).catch(() => null);
  } finally {
    clearTimeout(timeout);
    jobs.delete(tab.id);
    await chrome.tabs.remove(tab.id).catch(() => {});
  }
}

export function bookmarkTabReply(message, sender) {
  const job = jobs.get(sender.tab?.id);
  if (!job || !sender.url) return null;
  const id = new URL(sender.url).pathname.match(/\/status\/(\d+)(?:\/|$)/)?.[1];
  if (id !== job.postId) return null;
  if (message.type === 'ready' && !job.started) {
    job.started = true;
    return { postId: job.postId, enabled: job.enabled };
  }
  if (message.type === 'result' && job.started) {
    const result = message.result;
    job.resolve(result?.failed === true ? { failed: true } : typeof result?.enabled === 'boolean' ? { enabled: result.enabled } : null);
  }
  return null;
}
