import { pageLanguage, text as write } from './language.mjs';
import { screenClock } from './screen-clock.mjs';

const find = selector => document.querySelector(selector);
const lobby = find('#lobby');
const code = find('#screen-code');
const lobbyStatus = find('#lobby-status');
const newCode = find('#new-code');
const viewer = find('#viewer');
const video = find('#display-video');
const wait = find('#wait');
const caption = find('#caption');
const author = find('#author');
const authorName = find('#author-name');
const avatar = find('#author-avatar');
const initial = find('#avatar-letter');
const text = find('#text');
const audio = find('#screen-audio');
const fullscreen = find('#fullscreen');
let phase = '', playback, received = 0, polling = false, pairing = false;
let audioAllowed = false, reportedAudio = false, audioRequest = false;
let playBlocked = false, playAttempt;
let stream, streamSeen = 0, streamRetry = 0, lastStatusPoll = 0;
let clipKey, fallbackSource, appliedJump, needsPosition = false, bufferingSince, stalledSince;
const SNAPSHOT_TIMEOUT = 8000;
const BUFFER_LIMIT = 2800;

function raw(el, message) {
  if (el.textContent !== message) el.textContent = message;
}

async function call(action, data) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);
  try {
    const response = await fetch(`/api/screen/${action}`, {
      ...(data ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) } : { cache: 'no-store' }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error('Écran XScroll indisponible.');
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function reportAudio() {
  const enabled = Boolean(audioAllowed && playback?.media?.url && !video.error && video.readyState >= 2 && !playBlocked);
  if (phase !== 'connected' || audioRequest || reportedAudio === enabled) return;
  audioRequest = true;
  void call('audio', { enabled }).then(() => { reportedAudio = enabled; }).catch(() => {}).finally(() => {
    audioRequest = false;
  });
}

function setAudio() {
  video.muted = Boolean(!audioAllowed || playback?.muted);
  if (playback?.volume !== undefined && video.volume !== playback.volume) {
    try { video.volume = playback.volume; } catch {}
  }
  audio.setAttribute('aria-pressed', String(audioAllowed));
  write(audio, playBlocked ? 'Lancer la vidéo' : audioAllowed ? 'Couper le son ici' : 'Activer le son');
  reportAudio();
}

function tryPlay() {
  if (video.paused && !playBlocked && !playAttempt) {
    playAttempt = video.play().catch(error => {
      if (error.name === 'NotAllowedError') playBlocked = true;
      setAudio();
    }).finally(() => { playAttempt = undefined; });
  }
}

function loadSource(url) {
  if (video.getAttribute('src') === url) return;
  needsPosition = true;
  bufferingSince = performance.now();
  playBlocked = false;
  video.src = url;
}

function useFallback() {
  const fallback = playback?.media?.fallback;
  if (!fallback || fallbackSource || !video.getAttribute('src')) return false;
  fallbackSource = fallback;
  loadSource(fallbackSource);
  return true;
}

function waitingMessage(message = '') {
  wait.hidden = !message;
  write(wait, message);
}

function syncVideo() {
  const media = playback?.media;
  if (!media?.url) return;
  const now = performance.now();
  if (now - received > SNAPSHOT_TIMEOUT) {
    video.pause();
    waitingMessage('Reconnexion à XScroll…');
    return;
  }
  const buffering = bufferingSince !== undefined && video.readyState < 3;
  if (buffering && !playback.paused && now - bufferingSince > BUFFER_LIMIT && useFallback()) return;
  if (video.error) {
    waitingMessage('Cet écran ne peut pas lire cette vidéo.');
    return;
  }
  waitingMessage(buffering && !playback.paused && now - bufferingSince > 650 ? 'La vidéo se charge…' : '');
  if (video.readyState === 0) return;

  const holdForDesktop = stalledSince !== undefined && now - stalledSince >= 360;
  const state = media.stalled && !holdForDesktop ? { ...playback, media: { ...media, stalled: false } } : playback;
  const forceSeek = needsPosition || appliedJump !== media.jump;
  const plan = screenClock(state, now - received, video.currentTime, video.duration, forceSeek);
  if (!video.seeking && (forceSeek || video.readyState >= 3 || !plan.running)) {
    if (plan.seek !== undefined) video.currentTime = plan.seek;
    appliedJump = media.jump;
    needsPosition = false;
  }
  if (video.playbackRate !== plan.rate) {
    try { video.playbackRate = plan.rate; } catch {}
  }
  setAudio();
  if (plan.running) tryPlay();
  else video.pause();
}

function showPlayback(value) {
  playback = value;
  received = performance.now();
  const media = value?.media;
  if (!media?.url) {
    if (video.getAttribute('src')) {
      video.pause();
      video.removeAttribute('src');
      video.load();
    }
    caption.hidden = true;
    if (avatar.hasAttribute('src')) avatar.removeAttribute('src');
    avatar.hidden = true;
    clipKey = fallbackSource = bufferingSince = stalledSince = undefined;
    waitingMessage(media?.unavailable ? 'Cette vidéo est disponible sur l’ordinateur.' : 'En attente d’une vidéo sur XScroll…');
    reportAudio();
    return;
  }
  const key = media.key || media.url;
  if (clipKey !== key) {
    clipKey = key;
    fallbackSource = appliedJump = stalledSince = undefined;
  }
  if (media.stalled) stalledSince ??= received;
  else stalledSince = undefined;
  loadSource(fallbackSource || media.url);
  video.dataset.fit = media.fit;
  caption.hidden = !media.author && !media.name && !media.text;
  const handle = media.author ? '@' + media.author : '';
  raw(authorName, media.name || handle || 'X');
  raw(author, media.name ? handle : '');
  raw(initial, (media.name || media.author || 'X').slice(0, 1).toUpperCase());
  if ((avatar.getAttribute('src') || '') !== media.avatar) {
    avatar.hidden = !media.avatar;
    if (media.avatar) avatar.src = media.avatar;
    else avatar.removeAttribute('src');
  }
  raw(text, media.text);
  syncVideo();
}

function render(result) {
  const previous = phase;
  phase = result.phase;
  lobby.hidden = phase === 'connected';
  viewer.hidden = !lobby.hidden;
  raw(code, result.code || '');
  if (lobby.hidden) {
    if (previous !== 'connected') reportedAudio = false;
    showPlayback(result.playback);
    openStream();
  } else {
    closeStream();
    showPlayback();
    write(lobbyStatus, phase === 'expired' ? 'Le code a expiré ou la diffusion a été arrêtée.' : '');
    newCode.hidden = phase !== 'expired';
  }
}

async function start() {
  if (pairing) return;
  pairing = true;
  newCode.disabled = true;
  try { render(await call('request', {})); }
  catch {
    write(lobbyStatus, 'Impossible de contacter XScroll.');
    newCode.hidden = false;
  } finally {
    pairing = false;
    newCode.disabled = false;
  }
}

function closeStream() {
  stream?.close();
  stream = undefined;
}

function openStream() {
  if (stream || typeof EventSource === 'undefined' || performance.now() < streamRetry) return;
  const next = new EventSource('/api/screen/events');
  stream = next;
  streamSeen = performance.now();
  next.onmessage = event => {
    if (stream !== next) return;
    try {
      const result = JSON.parse(event.data);
      streamSeen = performance.now();
      render(result);
    } catch {}
  };
  next.onerror = () => {
    if (stream !== next) return;
    closeStream();
    streamRetry = performance.now() + 5000;
    void poll();
  };
}

async function poll() {
  const now = performance.now();
  if (polling || pairing || (stream && now - lastStatusPoll < 5000)) return;
  const channel = stream;
  lastStatusPoll = now;
  polling = true;
  try {
    const result = await call('status');
    if (channel && stream === channel && result.phase === 'connected') return;
    if (!phase && result.phase === 'expired') await start();
    else render(result);
  } catch {
    if (phase !== 'connected') write(lobbyStatus, 'Impossible de contacter XScroll.');
  } finally {
    polling = false;
  }
}

avatar.addEventListener('error', () => { avatar.hidden = true; });
video.addEventListener('loadedmetadata', syncVideo);
video.addEventListener('canplay', () => {
  bufferingSince = undefined;
  syncVideo();
});
video.addEventListener('waiting', () => { bufferingSince ??= performance.now(); });
video.addEventListener('seeked', syncVideo);
video.addEventListener('error', () => {
  if (!video.getAttribute('src')) return;
  if (!useFallback()) waitingMessage('Cet écran ne peut pas lire cette vidéo.');
  reportAudio();
});
audio.addEventListener('click', () => {
  audioAllowed = playBlocked || !audioAllowed;
  playBlocked = false;
  setAudio();
  if (playback?.media?.url && !playback.paused) tryPlay();
});
newCode.addEventListener('click', () => { void start(); });
const requestFullscreen = viewer.requestFullscreen || viewer.webkitRequestFullscreen;
fullscreen.hidden = !requestFullscreen;
fullscreen.addEventListener('click', () => {
  if (document.fullscreenElement) void document.exitFullscreen?.();
  else void requestFullscreen?.call(viewer)?.catch?.(() => {});
});

window.addEventListener('pagehide', () => {
  closeStream();
  if (phase === 'connected' && reportedAudio && navigator.sendBeacon) {
    navigator.sendBeacon('/api/screen/audio', new Blob(['{"enabled":false}'], { type: 'application/json' }));
  }
});
window.addEventListener('pageshow', event => {
  if (event.persisted) {
    reportedAudio = false;
    void poll();
  }
});
pageLanguage();
void poll();
setInterval(() => {
  if (stream && performance.now() - streamSeen > 6200) {
    closeStream();
    streamRetry = performance.now() + 5000;
  }
  if (phase === 'connected') syncVideo();
  void poll();
}, 720);
