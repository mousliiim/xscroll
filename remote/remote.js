import { attribute, language, pageLanguage, text as write } from './language.mjs';

const find = selector => document.querySelector(selector);
const pairing = find('#pairing');
const form = find('#pair');
const code = find('#code');
const slots = [...form.querySelectorAll('.code-slots span')];
const pairError = find('#pair-error');
const pairSubmit = form.querySelector('button');
const pairLabel = pairSubmit.querySelector('span');
const player = find('#player');
const status = find('#status');
const connectionLabel = status.querySelector('.connection-label');
const connectionIcon = status.querySelector('use');
const hint = find('#player-hint');
const notice = find('#notice');
const search = find('#search');
const topic = find('#topic');
const searchButton = search.querySelector('button');
const shuffle = find('#shuffle');
const discoverStatus = find('#discover-status');
const speedRange = find('#speed-range');
const speedTrack = find('.speed-track');
const speedOutput = find('#speed-output');
const remoteAuthor = find('#remote-author');
const postFeedback = find('#post-feedback');
const postButtons = [...player.querySelectorAll('[data-post]')];
const postLabels = { like: ['J’aime', 'Aimé'], bookmark: ['Enregistrer', 'Enregistré'], repost: ['Reposter', 'Reposté'] };
const postErrors = {
  changed: 'La vidéo a changé. Réessaie sur le post affiché.',
  busy: 'Cette action est déjà en cours.',
  session: 'Connecte-toi à X sur l’ordinateur.',
  failed: 'X n’a pas confirmé cette action. Réessaie.',
};
const pendingPosts = new Map();
let post, postResults = [];
const previews = [...player.querySelectorAll('[data-preview-rate]')];
const screenDialog = find('#screen-dialog');
const screenBadge = find('#screen-badge');
const screenLink = find('#screen-link');
const copyScreen = find('#copy-screen');
const screenPair = find('#screen-pair');
const externalCode = find('#external-code');
const screenSubmit = screenPair.querySelector('button');
const disconnectScreen = find('#disconnect-screen');
const screenFeedback = find('#screen-feedback');
const buttons = new Map([...player.querySelectorAll('[data-command]')].map(button => [button.dataset.command, button]));
const rateFormats = Object.fromEntries(['en', 'fr'].map(locale => [locale, new Intl.NumberFormat(locale, { maximumFractionDigits: 2 })]));
const speedLabel = rate => `${rateFormats[language()].format(rate)}×`;
let paired = false, available = false, playable = false, online = false;
let polling = false, pairingNow = false, discoverySending = false, revision = 0;
let pending, discovery;
let editingUntil = 0, held, speedTimer, speedInFlight = false, nextRateAt = 0;
const pendingRates = new Map();
let screenConnected = false, screenSending = false;
screenLink.value = new URL('/screen', location.origin).href;

function raw(element, message) {
  if (element.textContent !== message) element.textContent = message;
}

function connection(state, label) {
  status.dataset.state = state;
  connectionIcon.setAttribute('href', state === 'ready' ? '#link-status' : state === 'waiting' ? '#wait-status' : '#off-status');
  write(connectionLabel, label);
}

function renderPost() {
  const id = post?.id;
  raw(remoteAuthor, post?.author ? '@' + post.author : '');
  remoteAuthor.hidden = !post?.author;
  for (const [key, request] of pendingPosts) {
    const result = postResults.find(item => item.id === request.id);
    const expired = Date.now() - request.started > 18000;
    if (!result && !expired) continue;
    pendingPosts.delete(key);
    if (request.postId === id && !result?.ok) {
      write(postFeedback, postErrors[result?.error] || 'Le lecteur n’a pas confirmé cette action.');
    }
  }
  for (const button of postButtons) {
    const kind = button.dataset.post;
    const busy = pendingPosts.has(`${id}:${kind}`) || post?.pending?.includes(kind) === true;
    const pressed = post?.[kind] === true;
    button.disabled = !playable || !id || busy;
    button.setAttribute('aria-busy', String(busy));
    button.setAttribute('aria-pressed', String(pressed));
    write(button.querySelector('span'), postLabels[kind][Number(pressed)]);
  }
}

async function sendPost(kind) {
  if (!playable || !post?.id) return;
  const key = `${post.id}:${kind}`;
  if (pendingPosts.has(key)) return;
  const request = { postId: post.id, started: Date.now() };
  const enabled = !post[kind];
  pendingPosts.set(key, request);
  write(postFeedback, '');
  renderPost();
  try {
    const result = await call('command', { command: 'post-action', kind, postId: request.postId, enabled });
    request.id = result.id;
    setTimeout(update, 330);
  } catch (error) {
    pendingPosts.delete(key);
    if (post?.id === request.postId) write(postFeedback, error.message);
    void update();
  } finally {
    renderPost();
  }
}

async function call(action, data) {
  const response = await fetch(`/api/${action}`, data ? {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  } : { cache: 'no-store' });
  const result = await response.json();
  if (!response.ok) {
    const error = new Error(result.error);
    error.status = response.status;
    throw error;
  }
  return result;
}

function renderCode() {
  const digits = code.value.replace(/[^0-9]/g, '').slice(0, slots.length);
  if (code.value !== digits) code.value = digits;
  const cursor = Math.min(code.selectionStart ?? digits.length, slots.length - 1);
  for (const [index, slot] of slots.entries()) {
    raw(slot, digits[index] || '');
    slot.toggleAttribute('data-caret', index === cursor);
  }
  pairSubmit.disabled = !online || pairingNow || digits.length !== slots.length;
}

function renderDiscovery() {
  if (pending && discovery?.id === pending.id) pending = undefined;
  if (pending && Date.now() - pending.started > 10000) {
    pending = undefined;
    write(notice, 'Le lecteur n’a pas confirmé la demande. Réessaie.');
  }
  const current = pending || discovery;
  const phase = current?.phase || '';
  const isSearch = current?.command === 'search';
  const messages = {
    loading: isSearch ? 'Recherche « {topic} » sur X…' : 'Recherche de vidéos inédites…',
    ready: isSearch ? 'Fil « {topic} » lancé sur l’ordinateur.' : 'Nouveau fil lancé sur l’ordinateur.',
    empty: isSearch ? 'Aucune nouvelle vidéo pour « {topic} ».' : 'Aucune nouvelle vidéo pour le moment.',
    error: 'X n’a pas chargé la recherche. Réessaie dans un instant.',
  };
  discoverStatus.dataset.phase = phase;
  write(discoverStatus, available ? messages[phase] || '' : '', { topic: current?.topic });
}

function renderControls() {
  for (const button of [...buttons.values(), ...previews]) button.disabled = !playable;
  speedRange.disabled = !playable;
  hint.hidden = !paired || available;
  shuffle.disabled = !available || discoverySending;
  topic.disabled = !available;
  searchButton.disabled = !available || discoverySending || !topic.value.trim();
  renderDiscovery();
  renderPost();
  renderScreen();
}

function render(result) {
  online = true;
  paired = Boolean(result.paired);
  available = paired && Boolean(result.active);
  playable = available && (result.state?.playable ?? true);
  discovery = result.state?.discovery;
  if (post?.id !== result.state?.post?.id) write(postFeedback, '');
  post = result.state?.post;
  postResults = result.state?.postResults || [];
  screenConnected = result.state?.screenConnected === true;
  if (!paired) pending = undefined;
  pairing.hidden = paired;
  player.hidden = !paired;
  if (!paired && screenDialog.open) screenDialog.close();
  code.disabled = pairingNow;
  connection(available ? 'ready' : paired ? 'offline' : 'waiting',
    available ? 'Lecteur connecté' : paired ? 'Lecteur déconnecté' : 'Prêt à jumeler');
  renderCode();
  renderControls();
  if (!result.state) return;
  const { paused, muted, rate, rateTarget, replies, autoReplies } = result.state;
  const play = buttons.get('toggle-play');
  play.querySelector('use').setAttribute('href', paused ? '#play' : '#pause');
  write(play.querySelector('.play-label'), paused ? 'Lire' : 'Pause');
  buttons.get('toggle-mute').setAttribute('aria-pressed', String(muted));
  write(buttons.get('toggle-mute'), muted ? 'Son coupé' : 'Son');
  buttons.get('replies').setAttribute('aria-pressed', String(replies));
  buttons.get('replies-auto').setAttribute('aria-pressed', String(autoReplies));
  if (!held && Date.now() >= editingUntil) drawSpeed(rate, rateTarget ?? rate);
}

async function update() {
  if (polling || pairingNow) return;
  polling = true;
  const request = revision;
  try {
    const result = await call('status');
    if (request === revision) render(result);
  } catch {
    if (request !== revision) return;
    online = available = playable = false;
    code.disabled = true;
    connection('offline', 'Relais indisponible');
    renderCode();
    renderControls();
  } finally {
    polling = false;
  }
}

function renderScreen() {
  screenBadge.toggleAttribute('data-connected', screenConnected);
  write(screenBadge, screenConnected ? 'Connecté' : 'Configurer');
  screenSubmit.disabled = !paired || !online || screenSending || externalCode.value.length !== 6;
  disconnectScreen.disabled = !online || screenSending;
  disconnectScreen.hidden = !screenConnected;
}

async function manageScreen(action, data) {
  if (!online || !paired || screenSending) return;
  screenSending = true;
  renderScreen();
  write(screenFeedback, '');
  try {
    const result = await call(`screen/${action}`, data);
    screenConnected = result.connected;
    if (result.connected) screenPair.reset();
    write(screenFeedback, result.connected ? 'Écran associé.' : 'Diffusion arrêtée.');
  } catch (error) {
    write(screenFeedback, error.message);
  } finally {
    screenSending = false;
    renderScreen();
  }
}

find('#open-screen').addEventListener('click', () => screenDialog.showModal());
copyScreen.addEventListener('click', async () => {
  try {
    if (navigator.clipboard) await navigator.clipboard.writeText(screenLink.value);
    else {
      screenLink.focus();
      screenLink.select();
      if (!document.execCommand('copy')) throw new Error();
    }
    write(screenFeedback, 'Adresse copiée.');
  } catch {
    screenLink.focus();
    screenLink.select();
    write(screenFeedback, 'Sélectionne l’adresse pour la copier.');
  }
});
externalCode.addEventListener('input', () => {
  externalCode.value = externalCode.value.replace(/[^0-9]/g, '').slice(0, 6);
  renderScreen();
});
screenPair.addEventListener('submit', event => {
  event.preventDefault();
  if (!screenSubmit.disabled) void manageScreen('approve', { code: externalCode.value });
});
disconnectScreen.addEventListener('click', () => { void manageScreen('disconnect', {}); });

code.addEventListener('input', () => {
  code.removeAttribute('aria-invalid');
  write(pairError, '');
  renderCode();
});
for (const event of ['focus', 'click', 'keyup', 'select']) code.addEventListener(event, renderCode);
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (pairSubmit.disabled) return;
  pairingNow = true;
  revision++;
  renderCode();
  write(pairLabel, 'Connexion…');
  write(pairError, '');
  try {
    const result = await call('pair', { code: code.value });
    form.reset();
    code.removeAttribute('aria-invalid');
    render(result);
  } catch (error) {
    if (error.status === 401) code.setAttribute('aria-invalid', 'true');
    write(pairError, error.message);
  } finally {
    pairingNow = false;
    write(pairLabel, 'Connecter');
    code.disabled = !online;
    renderCode();
  }
});

async function send(command, options) {
  const subject = options?.topic;
  const speedChange = command === 'speed' || command === 'speed-preview';
  const discovering = command === 'shuffle' || command === 'search';
  if (discovering ? !available || discoverySending : !playable) return;
  if (discovering) {
    discoverySending = true;
    renderControls();
  }
  write(notice, '');
  try {
    const result = await call('command', { command, ...options });
    if (result.id) pending = { id: result.id, command, topic: subject, phase: 'loading', started: Date.now() };
    if (command === 'search' && topic.value.trim() === subject) topic.blur();
    if (!speedChange) setTimeout(update, 330);
  } catch (error) {
    write(notice, error.message);
    void update();
  } finally {
    if (discovering) {
      discoverySending = false;
      renderControls();
    }
  }
}

function drawSpeed(rate, position = rate) {
  const normal = 100 * .75 / 1.75;
  const percent = 100 * (position - .25) / 1.75;
  speedRange.value = position;
  attribute(speedRange, 'aria-valuetext', () => speedLabel(position));
  write(speedOutput, () => speedLabel(rate));
  speedTrack.dataset.rate = rate < 1 ? 'slow' : rate > 1 ? 'fast' : 'normal';
  speedTrack.style.setProperty('--speed-start', `${Math.min(normal, percent)}%`);
  speedTrack.style.setProperty('--speed-end', `${Math.max(normal, percent)}%`);
}

function scheduleRate() {
  if (speedTimer || speedInFlight || !pendingRates.size) return;
  speedTimer = setTimeout(async () => {
    speedTimer = undefined;
    if (!playable) { pendingRates.clear(); return; }
    const [command, rate] = pendingRates.entries().next().value;
    pendingRates.delete(command);
    speedInFlight = true;
    nextRateAt = performance.now() + 100;
    try { await send(command, { rate }); }
    finally {
      speedInFlight = false;
      scheduleRate();
    }
  }, Math.max(0, nextRateAt - performance.now()));
}

function queueRate(command, rate) {
  pendingRates.set(command, rate);
  scheduleRate();
}

speedRange.addEventListener('input', () => {
  const rate = speedRange.valueAsNumber;
  editingUntil = Date.now() + 1250;
  drawSpeed(rate);
  queueRate('speed', rate);
});

function releaseHold() {
  if (!held) return;
  const { button, timer } = held;
  held = undefined;
  clearInterval(timer);
  delete button.dataset.held;
  editingUntil = Date.now() + 1250;
  drawSpeed(speedRange.valueAsNumber);
  queueRate('speed-preview', null);
}

function holdRate(button, trigger) {
  releaseHold();
  const rate = Number(button.dataset.previewRate);
  button.dataset.held = '';
  held = { button, trigger, timer: setInterval(() => queueRate('speed-preview', rate), 1100) };
  drawSpeed(rate, speedRange.valueAsNumber);
  queueRate('speed-preview', rate);
}

for (const button of previews) {
  button.addEventListener('pointerdown', event => {
    if (!playable || event.button !== 0 || !event.isPrimary) return;
    button.setPointerCapture(event.pointerId);
    holdRate(button, event.pointerId);
  });
  button.addEventListener('lostpointercapture', event => {
    if (held?.button === button && held.trigger === event.pointerId) releaseHold();
  });
  button.addEventListener('keydown', event => {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    event.preventDefault();
    if (!event.repeat && playable) holdRate(button, event.key);
  });
  button.addEventListener('keyup', event => {
    if (held?.button === button && held.trigger === event.key) releaseHold();
  });
  button.addEventListener('blur', () => { if (held?.button === button) releaseHold(); });
}
window.addEventListener('blur', releaseHold);

for (const button of postButtons) button.addEventListener('click', () => { void sendPost(button.dataset.post); });

player.addEventListener('click', event => {
  const command = event.target.closest('[data-command]')?.dataset.command;
  if (command === 'reset-speed') {
    editingUntil = Date.now() + 1250;
    drawSpeed(1);
    queueRate('speed', 1);
  } else if (command) void send(command);
});
shuffle.addEventListener('click', () => { void send('shuffle'); });
topic.addEventListener('input', renderControls);
search.addEventListener('submit', event => {
  event.preventDefault();
  const subject = topic.value.trim();
  if (subject) void send('search', { topic: subject });
});
document.addEventListener('keydown', event => {
  if (screenDialog.open || event.target.closest('input, button, select') || event.metaKey || event.ctrlKey || event.altKey) return;
  const command = {
    ' ': 'toggle-play', ArrowUp: 'previous', ArrowDown: 'next', ArrowLeft: 'rewind',
    ArrowRight: 'forward', m: 'toggle-mute', r: 'replies', '+': 'faster', '-': 'slower',
  }[event.key];
  if (command && playable) { event.preventDefault(); void send(command); }
});

pageLanguage();
void update();
setInterval(() => { if (!document.hidden) void update(); }, 1200);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) releaseHold();
  else void update();
});
