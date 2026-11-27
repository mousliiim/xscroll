import { readSetting, saveSetting } from './settings.js';

const SIZES = {
  compact: { width: 360, landscape: 370, portrait: 475 },
  balanced: { width: 460, landscape: 430, portrait: 590 },
  large: { width: 620, landscape: 560, portrait: 725 },
};
const SIZE_NAMES = Object.keys(SIZES);

export function createPlayerWindow({ view, deck, handleKeys, isOpen, onMove }) {
  const supported = 'documentPictureInPicture' in window;
  let floating;
  let changing = false;
  let size = readSetting('pip-size', 'balanced');
  if (!SIZE_NAMES.includes(size)) size = 'balanced';
  let fit = readSetting('video-fit', 'contain') === 'fill' ? 'fill' : 'contain';
  const initialSplit = Math.min(72, Math.max(24, Number(readSetting('split', '40')) || 40));
  view.floating(false, supported);
  view.windowSettings(size, fit, initialSplit);

  function dimensions(name) {
    const video = deck.video();
    const preset = SIZES[name];
    return { width: preset.width, height: video?.videoWidth > video?.videoHeight ? preset.landscape : preset.portrait };
  }

  function move(doc, mini) {
    view.floating(mini, supported);
    deck.move(() => doc.body.append(view.host));
    if (isOpen()) view.focus();
    onMove();
  }

  function align() {
    deck.jump();
    view.placeMenu();
  }

  function resize(name) {
    if (!floating || !SIZE_NAMES.includes(name)) return;
    const { width, height } = dimensions(name);
    try {
      const frameWidth = Math.max(0, floating.outerWidth - floating.innerWidth);
      const frameHeight = Math.max(0, floating.outerHeight - floating.innerHeight);
      floating.resizeTo(width + frameWidth, height + frameHeight);
      size = name;
      saveSetting('pip-size', size);
      view.windowSettings(size, fit);
    } catch {
      view.message('Drag an edge of the window to resize it.');
    }
  }

  async function toggle() {
    if (floating) { floating.close(); return; }
    if (changing || !supported || view.shadow.fullscreenElement) return;
    changing = view.float.disabled = true;
    try {
      const pip = await window.documentPictureInPicture.requestWindow(dimensions(size));
      if (!isOpen()) { pip.close(); return; }
      floating = pip;
      pip.document.title = 'XScroll';
      pip.addEventListener('keydown', handleKeys, true);
      pip.addEventListener('resize', align);
      pip.addEventListener('pagehide', () => {
        floating = undefined;
        move(document, false);
      }, { once: true });
      move(pip.document, true);
    } catch {
      if (isOpen()) view.message('The mini player couldn’t open.');
    } finally {
      changing = view.float.disabled = false;
    }
  }

  async function fullscreen() {
    if (floating) return;
    view.dismissMenu();
    try {
      if (view.shadow.fullscreenElement) await document.exitFullscreen();
      else await view.stage.requestFullscreen();
    } catch {
      if (isOpen()) view.message('Fullscreen isn’t available.');
    }
  }

  window.addEventListener('resize', () => { if (isOpen() && !floating) align(); });
  document.addEventListener('fullscreenchange', () => {
    if (!isOpen()) return;
    align();
    view.full(Boolean(view.shadow.fullscreenElement));
    view.focus();
  });

  function setFit(value) {
    if (value !== 'contain' && value !== 'fill') return;
    fit = value;
    saveSetting('video-fit', value);
    view.windowSettings(size, fit);
  }

  return {
    toggle, resize, fullscreen,
    active: () => Boolean(floating),
    focus: () => floating?.focus(),
    closeMini: () => floating?.close(),
    resizeNext: () => resize(SIZE_NAMES[(SIZE_NAMES.indexOf(size) + 1) % SIZE_NAMES.length]),
    fit: setFit,
    toggleFit: () => setFit(fit === 'fill' ? 'contain' : 'fill'),
    split(value, commit) {
      align();
      if (commit) saveSetting('split', value);
    },
  };
}
