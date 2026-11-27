import { extractReplies } from '../x/replies.js';
import { findPost, postStats } from '../x/model.js';
import { readSetting, saveSetting } from './settings.js';

const PHONE_PAGE = 24;
const settingValue = (key, fallback, minimum, maximum) => {
  const value = Number(readSetting(key, String(fallback)));
  return Number.isInteger(value) ?
    minimum + Math.round((Math.max(minimum, Math.min(maximum, value)) - minimum) / 5) * 5 : fallback;
};

export function createConversation({ client, view, postActions, currentVideo, align }) {
  let threads = new Map();
  let open = false, clipId, currentId;
  let phoneOpen = false, phoneOffset = 0;
  let automatic = readSetting('auto-replies', 'false') === 'true';
  let overlayEnabled = readSetting('fullscreen-comments', 'false') === 'true';
  let overlaySize = settingValue('fullscreen-comment-size', 100, 80, 130);
  let overlayTransparency = settingValue('fullscreen-comment-transparency', 30, 5, 65);
  let fullscreen = false, overlayTimer, repliesShownBeforePage = 0;
  const shownComments = new Set();
  let openOnFirstClip = automatic;
  view.fullscreenComments(overlayEnabled);
  view.fullscreenCommentStyle(overlaySize, overlayTransparency);

  const showingOverlay = () => fullscreen && overlayEnabled && Boolean(clipId);

  function clearOverlay() {
    clearTimeout(overlayTimer);
    overlayTimer = undefined;
    repliesShownBeforePage = 0;
    shownComments.clear();
    view.fullscreenComment();
  }

  function showNextComment() {
    if (!showingOverlay() || overlayTimer !== undefined) return;
    const thread = threadFor(clipId);
    for (const reply of thread.items.values()) {
      if (!reply.text.trim() || shownComments.has(reply.id)) continue;
      shownComments.add(reply.id);
      view.fullscreenComment(reply);
      overlayTimer = setTimeout(() => {
        view.fullscreenComment();
        overlayTimer = setTimeout(() => {
          overlayTimer = undefined;
          showNextComment();
        }, 650);
      }, Math.min(9500, 4800 + reply.text.length * 13));
      return;
    }
    if (thread.loading || thread.failed) return;
    if (!thread.loaded || (thread.cursor && shownComments.size > repliesShownBeforePage)) {
      repliesShownBeforePage = shownComments.size;
      void more();
    }
  }

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
    const id = clipId;
    if ((!open && !phoneOpen && !showingOverlay()) || !id) return;
    const thread = threadFor(id);
    if (thread.loading || (thread.loaded && !thread.cursor)) return;
    const cursor = thread.cursor;
    thread.loading = true;
    if (open) renderStatus(thread);
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
    if (clipId === id && threads.get(id) === thread) showNextComment();
  }

  function loadPhoneThread() {
    if (phoneOpen && clipId && !threadFor(clipId).loaded) void more();
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
    setFullscreen(value) {
      if (fullscreen === value) return;
      fullscreen = value;
      clearOverlay();
      showNextComment();
    },
    fullscreenComments: () => overlayEnabled,
    fullscreenCommentSize: () => overlaySize,
    fullscreenCommentTransparency: () => overlayTransparency,
    setFullscreenCommentSize(value) {
      if (!Number.isInteger(value) || (value - 80) % 5 !== 0 || value < 80 || value > 130) return;
      overlaySize = value;
      saveSetting('fullscreen-comment-size', String(overlaySize));
      view.fullscreenCommentStyle(overlaySize, overlayOpacity);
    },
    setFullscreenCommentTransparency(value) {
      if (!Number.isInteger(value) || (value - 5) % 5 !== 0 || value < 5 || value > 65) return;
      overlayTransparency = value;
      saveSetting('fullscreen-comment-transparency', String(overlayTransparency));
      view.fullscreenCommentStyle(overlaySize, overlayTransparency);
    },
    toggleFullscreenComments() {
      overlayEnabled = !overlayEnabled;
      saveSetting('fullscreen-comments', overlayEnabled);
      view.fullscreenComments(overlayEnabled);
      clearOverlay();
      if (showingOverlay() && threadFor(clipId).failed) void more();
      else showNextComment();
    },
    setPhoneOpen(value) {
      phoneOpen = value;
      phoneOffset = 0;
      loadPhoneThread();
    },
    phoneComments() {
      if (!phoneOpen || !clipId) return null;
      const thread = threadFor(clipId);
      return {
        id: clipId,
        phase: thread.loading ? 'loading' : thread.failed ? 'error' : thread.items.size ? 'ready' : 'empty',
        more: thread.items.size > phoneOffset + PHONE_PAGE || Boolean(thread.cursor),
        items: [...thread.items.values()].slice(phoneOffset, phoneOffset + PHONE_PAGE).map(reply => ({ ...reply, author: reply.handle })),
      };
    },
    async phoneMore() {
      if (!phoneOpen || !clipId) return;
      const id = clipId;
      const thread = threadFor(id);
      const next = phoneOffset + PHONE_PAGE;
      if (thread.items.size <= next) await more();
      if (phoneOpen && clipId === id && thread.items.size > next) phoneOffset = next;
    },
    setClip(id) {
      if (clipId !== id) {
        phoneOffset = 0;
        clearOverlay();
      }
      clipId = id;
      if (id && openOnFirstClip) {
        openOnFirstClip = false;
        setOpen(true, false);
      } else if (id && open && id !== currentId) render();
      else if (!id && open) setOpen(false, false);
      loadPhoneThread();
      showNextComment();
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
      phoneOffset = 0;
      clearOverlay();
      openOnFirstClip = automatic;
      view.replies.clearReplies();
    },
  };
}
