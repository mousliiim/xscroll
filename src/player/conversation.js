import { extractReplies } from '../x/replies.js';
import { findPost, postStats } from '../x/model.js';
import { readSetting, saveSetting } from './settings.js';

export function createConversation({ client, view, postActions, currentVideo, align }) {
  let threads = new Map();
  let open = false, clipId, currentId;
  let automatic = readSetting('auto-replies', 'false') === 'true';
  let openOnFirstClip = automatic;

  function syncScroll() {
    const video = currentVideo();
    view.replies.autoScroll(automatic, Boolean(open && automatic && video && !video.paused && !video.seeking && video.readyState >= 3));
  }

  function renderStatus(thread) {
    if (thread.loading) view.replies.replyStatus('Loading replies…');
    else if (thread.failed) view.replies.replyStatus('Couldn’t load replies from X.', 'Try again');
    else if (!thread.items.size && !thread.cursor) view.replies.replyStatus('No replies to show.');
    else view.replies.replyStatus('', thread.cursor ? 'Load more replies' : '', false, Boolean(thread.cursor));
  }

  function threadFor(id) {
    if (!threads.has(id)) {
      if (threads.size >= 48) threads.delete(threads.keys().next().value);
      threads.set(id, { items: new Map(), cursors: new Set() });
    }
    return threads.get(id);
  }

  async function more() {
    const id = currentId;
    if (!open || !id) return;
    const thread = threadFor(id);
    if (thread.loading || (thread.loaded && !thread.cursor)) return;
    const cursor = thread.cursor;
    thread.loading = true;
    renderStatus(thread);
    const data = await client.detail(id, cursor);
    const page = extractReplies(data, id, thread.items);
    const tweet = findPost(data, id);
    if (tweet) postActions.merge(id, postStats(tweet));
    const fresh = [];
    thread.loading = false;
    thread.failed = !page;
    if (page) {
      thread.loaded = true;
      if (cursor) thread.cursors.add(cursor);
      thread.cursor = thread.cursors.has(page.cursor) ? undefined : page.cursor;
      for (const reply of page.replies) {
        if (thread.items.has(reply.id)) continue;
        thread.items.set(reply.id, reply);
        fresh.push(reply);
      }
    }
    if (open && currentId === id && threads.get(id) === thread) {
      view.replies.appendReplies(fresh);
      renderStatus(thread);
    }
  }

  function render() {
    if (!open || !clipId) return;
    currentId = clipId;
    const thread = threadFor(clipId);
    view.replies.clearReplies();
    view.replies.appendReplies([...thread.items.values()]);
    if (thread.loaded || thread.loading || thread.failed) renderStatus(thread);
    else void more();
  }

  function setOpen(visible, focus = true) {
    if (visible && !clipId) return;
    open = visible;
    view.toggleReplies(open, focus);
    align();
    if (open) render();
    syncScroll();
  }

  return {
    isOpen: () => open,
    isAuto: () => automatic,
    step(direction) {
      if (!clipId) return;
      if (!open) setOpen(true, false);
      view.replies.step(direction);
    },
    setOpen, more, syncScroll,
    setClip(id) {
      clipId = id;
      if (id && openOnFirstClip) {
        openOnFirstClip = false;
        setOpen(true, false);
      } else if (id && open && id !== currentId) render();
      else if (!id && open) setOpen(false, false);
      syncScroll();
    },
    toggleAuto() {
      automatic = !automatic;
      saveSetting('auto-replies', automatic);
      if (automatic && !open && clipId) setOpen(true, false);
      syncScroll();
    },
    reset() {
      setOpen(false, false);
      threads = new Map();
      clipId = currentId = undefined;
      openOnFirstClip = automatic;
      view.replies.clearReplies();
    },
  };
}
