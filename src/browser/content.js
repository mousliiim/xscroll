import { refreshLanguage } from '../../remote/language.mjs';
import { extensionLanguage, saveLanguage } from './language.js';
import { isSearchHelper, listenForNativeResults, openNativeSearch } from './native-search.js';
import { bookmarkFromPlayer, isBookmarkHelper, listenForBookmarkJob } from './native-bookmark.js';
import { screenMediaURL } from '../../remote/protocol.mjs';
import { createPlayerView } from '../ui/player.js';
import { createMediaDeck } from '../player/media.js';
import { createConversation } from '../player/conversation.js';
import { createFeed } from '../player/feed.js';
import { createPlayerWindow } from '../player/window.js';
import { handlePlayerKeys } from '../player/keyboard.js';
import { readSetting, saveSetting } from '../player/settings.js';
import { createXClient } from '../x/client.js';
import { createPostActions } from '../x/actions.js';
import { acceptClips, postURL } from '../x/model.js';
import { OBSERVER_CHANNEL, SITE } from '../x/protocol.js';
import { mountLaunchers, postSeed } from './launcher.js';
import { createRemoteRelay } from './remote.js';

const client = createXClient();
const system = matchMedia('(prefers-color-scheme: dark)');
const THEMES = new Set(['system', 'light', 'dark']);
let theme = readSetting('theme', 'dark');
if (!THEMES.has(theme)) theme = 'system';
let app;

const postActions = createPostActions(client, id => app?.redrawActions(id), bookmarkFromPlayer);
const feed = createFeed({
  client, openSearch: openNativeSearch,
  onClips: () => app?.refresh(),
  onPost: postActions.merge,
  onStatus: status => app?.feedStatus(status),
});

window.addEventListener('message', event => {
  const data = event.data;
  if (isSearchHelper || event.source !== window || event.origin !== SITE || data?.channel !== OBSERVER_CHANNEL ||
      typeof data.context !== 'string' || data.context.length > 1000 || !/^(?:\/|search:)/.test(data.context)) return;
  client.remember(data);
  feed.ingest(acceptClips(data.clips), data.context);
});

function mount() {
  let session, launcher, usedLauncher, previewLease;
  const postResults = new Map();
  let open = false, screenConnected = false, screenAudio = false;

  const view = createPlayerView({
    play: () => deck.togglePlay(),
    volume: () => deck.toggleMute(),
    setVolume: value => deck.setVolume(value),
    seek: time => deck.seek(time),
    scrub: time => deck.scrub(time),
    scroll: () => deck.onScroll(),
    up: () => deck.step(-1),
    down: () => deck.step(1),
    quality: value => deck.setQuality(value),
    download: () => deck.download(),
    speed: value => deck.setRate(value),
    speedPreview: value => deck.previewRate(value),
    'loop-start': () => deck.loop('start'),
    'loop-end': () => deck.loop('end'),
    'loop-clear': () => deck.loop('clear'),
    theme: setTheme,
    language: value => { void saveLanguage(value); },
    float: () => windowController.toggle(),
    fullscreen: () => windowController.fullscreen(),
    'fullscreen-comments': () => conversation.toggleFullscreenComments(),
    'fullscreen-comments-pause': () => conversation.toggleFullscreenCommentsPause(),
    resize: name => windowController.resize(name),
    fit: value => windowController.fit(value),
    framing: () => windowController.toggleFit(),
    'auto-next': () => deck.toggleAutoNext(),
    captions: () => deck.toggleCaptions(),
    split: (value, commit) => windowController.split(value, commit),
    replies: () => conversation.setOpen(!conversation.isOpen()),
    'hide-replies': () => conversation.setOpen(false),
    more: () => conversation.more(),
    auto: () => conversation.toggleAuto(),
    like: () => togglePost('like'),
    repost: () => togglePost('repost'),
    bookmark: () => togglePost('bookmark'),
    share: sharePost,
    retry: () => feed.replenish(deck.index(), true),
    close,
  });

  const deck = createMediaDeck(view, {
    onSlide(clip) {
      remote.sync();
      routeDisplay(screenConnected, screenAudio);
      feed.mark(clip);
      redrawActions(clip.tweetId);
      conversation.setClip(clip.tweetId);
      feed.replenish(deck.index());
    },
    onPlayback: () => conversation.syncScroll(),
    onEnd: () => feed.replenish(deck.index(), true),
    onSync: () => remote.sync(),
  });
  const conversation = createConversation({
    client, view, postActions, currentVideo: deck.video, align: () => deck.jump(),
  });
  const windowController = createPlayerWindow({
    view, deck, handleKeys, isOpen: () => open, onMove: () => { conversation.syncScroll(); remote.rebind(); },
    onFullscreen: conversation.setFullscreen,
  });
  const remoteActions = {
    previous: () => deck.step(-1),
    next: () => deck.step(1),
    'toggle-play': () => deck.togglePlay(),
    'toggle-mute': () => deck.toggleMute(),
    rewind: () => deck.scrub(-5),
    forward: () => deck.scrub(5),
    slower: () => deck.setRate(deck.rate() - .1),
    faster: () => deck.setRate(deck.rate() + .1),
    'reset-speed': () => deck.setRate(1),
    replies: () => conversation.setOpen(!conversation.isOpen(), false),
    'replies-auto': () => conversation.toggleAuto(),
    'replies-up': () => conversation.step(-1),
    'replies-down': () => conversation.step(1),
    fullscreen: () => { void windowController.remoteFullscreen(); },
    'fullscreen-comments': () => conversation.toggleFullscreenComments(),
    'fullscreen-comments-pause': () => conversation.toggleFullscreenCommentsPause(),
    fit: () => windowController.fit('contain'),
    fill: () => windowController.fit('fill'),
    'auto-next': () => deck.toggleAutoNext(),
    captions: () => deck.toggleCaptions(),
    'phone-replies-more': () => { void conversation.phoneMore(); },
  };
  function clearPreviewLease() {
    if (previewLease) previewLease.owner.clearTimeout(previewLease.id);
    previewLease = undefined;
  }

  function previewFromPhone(rate) {
    clearPreviewLease();
    deck.previewRate(rate ?? undefined);
    if (rate === null) return;
    const owner = view.host.ownerDocument.defaultView;
    previewLease = { owner, id: owner.setTimeout(() => previewFromPhone(null), 3500) };
  }

  function displayURL() {
    const item = deck.clip();
    return item?.screenRestricted ? '' : screenMediaURL(deck.video()?.src);
  }

  function displayFallback(clip, url) {
    const current = clip.variants.find(variant => screenMediaURL(variant.url) === url);
    const height = Number.parseInt(current?.label, 10) || 720;
    return clip.variants.find(variant => {
      const size = Number.parseInt(variant.label, 10);
      return size > 0 && size <= 720 && size < height;
    })?.url;
  }

  function routeDisplay(connected, audio) {
    screenConnected = connected;
    screenAudio = audio;
    deck.screenAudio(audio && Boolean(displayURL()));
  }

  const remote = createRemoteRelay(view.host, () => {
    const video = deck.video();
    const url = screenConnected ? displayURL() : '';
    const clip = deck.clip();
    const engagement = postActions.read(clip?.tweetId);
    const captions = deck.captions();
    return {
      ready: open, playable: Boolean(video), paused: video?.paused, muted: deck.isMuted(), volume: video?.volume,
      rate: video?.playbackRate ?? deck.rate(), rateTarget: deck.rate(), replies: conversation.isOpen(), autoReplies: conversation.isAuto(), discovery: discoveryStatus(),
      fit: view.host.dataset.fit, fullscreen: windowController.fullscreenActive(), fullscreenFailed: windowController.fullscreenFailed(),
      fullscreenComments: conversation.fullscreenComments(),
      fullscreenCommentSize: conversation.fullscreenCommentSize(),
      fullscreenCommentTransparency: conversation.fullscreenCommentTransparency(),
      fullscreenCommentSpeed: conversation.fullscreenCommentSpeed(),
      fullscreenCommentsPaused: conversation.fullscreenCommentsPaused(),
      autoNext: deck.autoNext(), captions: captions.enabled, captionsAvailable: captions.available, comments: conversation.phoneComments(),
      post: engagement ? { id: clip.tweetId, author: clip.user, ...engagement.stats, pending: [...engagement.pending] } : null,
      postResults: [...postResults.values()],
      media: url ? {
        url, fallback: displayFallback(clip, url), key: `${clip.tweetId}:${clip.mediaIndex ?? 0}`, jump: deck.seekVersion(),
        time: video.currentTime, duration: video.duration, fit: view.host.dataset.fit,
        text: clip.text, author: clip.user, name: clip.name, avatar: clip.avatar, stalled: video.readyState < 3 || video.seeking,
        subtitle: captions.cue, loop: video.loop, screenComment: conversation.fullscreenReply(),
      } : screenConnected && video ? { unavailable: true } : null,
    };
  }, command => {
    if (!open) return;
    view.activity();
    if (typeof command === 'string') remoteActions[command]?.();
    else if (command.command === 'speed') {
      clearPreviewLease();
      deck.setRate(command.rate);
    } else if (command.command === 'speed-preview') previewFromPhone(command.rate);
    else if (command.command === 'volume') deck.setVolume(command.volume);
    else if (command.command === 'comment-size') conversation.setFullscreenCommentSize(command.value);
    else if (command.command === 'comment-transparency') conversation.setFullscreenCommentTransparency(command.value);
    else if (command.command === 'comment-speed') conversation.setFullscreenCommentSpeed(command.value);
    else if (command.command === 'phone-replies') conversation.setPhoneOpen(command.open);
    else if (command.command === 'post-action') void applyPhonePostAction(command);
    else start(undefined, undefined, command);
  }, routeDisplay);
  document.body.append(view.host);
  launcher = mountLaunchers(feed, start);
  applyTheme();
  system.addEventListener('change', applyTheme);

  const commands = {
    ArrowUp: () => deck.step(-1),
    ArrowDown: () => deck.step(1),
    ArrowLeft: event => event.shiftKey ? deck.setRate(deck.rate() - 0.25) : deck.scrub(-5),
    ArrowRight: event => event.shiftKey ? deck.setRate(deck.rate() + 0.25) : deck.scrub(5),
    j: () => deck.step(1), k: () => deck.step(-1), '0': () => deck.setRate(1), ' ': () => deck.togglePlay(),
    m: () => deck.toggleMute(), f: () => windowController.fullscreen(), p: () => windowController.toggle(),
    z: () => windowController.resizeNext(), v: () => windowController.toggleFit(),
    r: () => conversation.setOpen(!conversation.isOpen(), false), a: () => conversation.toggleAuto(),
    t: () => setTheme(effectiveTheme() === 'light' ? 'dark' : 'light'), '?': view.help,
    Escape: () => {
      if (windowController.presenting()) void windowController.remoteFullscreen(false);
      else if (conversation.isOpen()) conversation.setOpen(false);
      else if (windowController.active()) windowController.closeMini();
      else close();
    },
  };
  window.addEventListener('keydown', handleKeys, true);
  document.addEventListener('play', event => {
    if (open && !windowController.active() && event.target instanceof HTMLMediaElement &&
        !event.composedPath().includes(view.host)) event.target.pause();
  }, true);

  function effectiveTheme() {
    return theme === 'system' ? (system.matches ? 'dark' : 'light') : theme;
  }

  function applyTheme() { view.appearance(theme, effectiveTheme()); }

  function setTheme(value) {
    if (!THEMES.has(value)) return;
    theme = value;
    saveSetting('theme', theme);
    applyTheme();
  }

  function handleKeys(event) {
    if (open) handlePlayerKeys(event, { view, commands, floating: windowController.active() });
  }

  function redrawActions(id) {
    if (open && deck.clip()?.tweetId === id) view.engagement(postActions.read(id));
  }

  async function togglePost(kind) {
    const id = deck.clip()?.tweetId;
    if (!id) return;
    try {
      await postActions.toggle(id, kind);
    } catch (error) {
      if (open && deck.clip()?.tweetId === id) {
        view.message(error.code === 'session' ? 'Sign in to X to use post actions.' :
          error.code === 'limited' ? error.message : 'X couldn’t confirm this action. Open the post to try there.');
      }
    }
  }

  async function applyPhonePostAction({ id, postId, kind, enabled }) {
    let error = '';
    if (deck.clip()?.tweetId !== postId) error = 'changed';
    else {
      try {
        const result = await postActions.toggle(postId, kind, enabled);
        if (result === undefined) error = 'busy';
      } catch (failure) {
        error = failure.code === 'session' ? 'session' : 'failed';
      }
    }
    postResults.set(id, { id, postId, kind, ok: !error, error });
    if (postResults.size > 8) postResults.delete(postResults.keys().next().value);
  }

  async function sharePost() {
    const id = deck.clip()?.tweetId;
    if (!id) return;
    try {
      await navigator.clipboard.writeText(postURL(id));
      view.message('Post link copied.');
    } catch {
      window.open(postURL(id), '_blank', 'noopener');
    }
  }

  function refresh() {
    if (!open) return;
    deck.update(session.clips);
    feed.replenish(deck.index());
  }

  function discoveryStatus() {
    const discovery = session?.discovery;
    if (!discovery) return null;
    const phase = session.clips.length ? 'ready' : session.loading || session.scannedAt < 0 ? 'loading' :
      session.failed ? 'error' : 'empty';
    return { ...discovery, phase };
  }

  function start(seed, source, discovery) {
    if (open && !seed && !discovery) {
      if (windowController.active()) windowController.focus();
      else view.focus();
      return;
    }
    clearPreviewLease();
    view.dismissMenu();
    conversation.reset();
    if (!discovery) usedLauncher = source || launcher;
    session = feed.start(seed, discovery);
    open = true;
    view.host.hidden = false;
    deck.reset();
    view.empty(discovery?.command === 'search' ? 'Searching X for “{topic}”…' :
      session.awaitingSeed ? 'Loading the selected video…' : 'Looking for unseen videos…', '', { topic: discovery?.topic });
    view.message('');
    document.querySelectorAll('video').forEach(video => video.pause());
    refresh();
    feed.prime();
    remote.start();
    if (discovery) return;
    if (windowController.active()) windowController.focus();
    else view.focus();
  }

  function close() {
    if (!open) return;
    open = false;
    conversation.setFullscreen(false);
    view.full(false);
    if (windowController.presenting()) void windowController.remoteFullscreen(false);
    remote.stop();
    clearPreviewLease();
    view.dismissMenu();
    conversation.reset();
    conversation.setPhoneOpen(false);
    feed.stop();
    view.host.hidden = true;
    deck.reset();
    if (view.shadow.fullscreenElement) document.exitFullscreen().catch(() => {});
    if (windowController.active()) windowController.closeMini();
    usedLauncher?.focus({ preventScroll: true });
  }

  return {
    refresh, redrawActions,
    language(locale) {
      view.language(locale);
      for (const button of document.querySelectorAll('#xscroll-launcher, .xscroll-on-video')) refreshLanguage(button);
    },
    feedStatus({ loading }) {
      if (!open || deck.clip()) return;
      if (session?.discovery?.command === 'search') {
        const topic = session.discovery.topic;
        const message = loading ? 'Searching X for “{topic}”…' :
          session.failed ? 'X couldn’t load this search. Try again in a moment.' : 'No new videos for “{topic}”.';
        view.empty(message, loading ? '' : 'Retry', { topic });
      } else if (session?.awaitingSeed) {
        view.empty(loading ? 'Loading the selected video…' : 'Couldn’t load the selected video.', loading ? '' : 'Retry');
      } else {
        view.empty(loading ? 'Looking for unseen videos…' : 'You’re caught up for now.', loading ? '' : 'Find more');
      }
    },
    state: () => ({ site: true, open, floating: windowController.active(), theme: effectiveTheme(), post: Boolean(postSeed(feed)) }),
    open: () => start(postSeed(feed), launcher),
    startRemote() { if (open) remote.start(); },
  };
}

async function initializePlayer() {
  await extensionLanguage(locale => app?.language(locale));
  app = mount();
}
listenForBookmarkJob();
if (!isBookmarkHelper) {
  if (isSearchHelper) listenForNativeResults();
  else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializePlayer, { once: true });
  else void initializePlayer();
}

chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (sender.id !== chrome.runtime.id || !message) return;
  if (message.channel === 'xscroll.remote' && message.type === 'start') {
    app?.startRemote();
    respond({ ok: true });
    return;
  }
  if (message.channel !== 'xscroll.popup') return;
  if (message.type === 'state') {
    respond(app?.state() || { site: true, ready: false });
  } else if (message.type === 'open' && app) {
    app.open();
    respond({ opened: true });
  }
});
