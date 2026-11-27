import { attribute, text } from '../../remote/language.mjs';
import { MAX_RATE, MIN_RATE, normalizeRate } from '../player/rate.js';
import { rateLabel } from './components.js';
import { icon } from './icons.js';

const presets = [MIN_RATE, .5, .75, 1, 1.5, MAX_RATE];

export const speedPanel = `
  <div class="speed-header">
    <div class="speed-display">
      <span class="speed-mode">Normal speed</span>
      <span class="speed-value" aria-label="Current playback speed">1×</span>
    </div>
    <button type="button" class="button speed-reset" data-action="speed" data-value="1" aria-label="Reset playback speed" title="Back to 1×">${icon('reset')}</button>
  </div>
  <div class="speed-dial">
    <div class="speed-notches" aria-hidden="true"></div>
    <input class="speed-range" type="range" min="${MIN_RATE}" max="${MAX_RATE}" step=".01" value="1" autofocus aria-label="Playback speed">
  </div>
  <div class="rate-choices" aria-label="Speed presets">
    ${presets.map(rate => `<button type="button" class="button" data-action="speed" data-value="${rate}" aria-pressed="${rate === 1}">${rateLabel(rate)}</button>`).join('')}
  </div>
  <div class="speed-holds" aria-label="Hold to temporarily change speed">
    <button type="button" class="button" data-hold-rate="0.5" aria-label="Hold for half speed">${icon('turtle')}<span>Hold ½×</span></button>
    <button type="button" class="button" data-hold-rate="2" aria-label="Hold for double speed">${icon('rabbit')}<span>Hold 2×</span></button>
  </div>
  <div class="flyout-row loop-heading"><p class="flyout-heading">Loop a section</p>
    <button type="button" class="button" data-action="loop-clear" aria-label="Clear loop" title="Clear loop">${icon('reset')}</button>
  </div>
  <div class="loop-choices">
    <button type="button" class="button" data-action="loop-start"><span>A</span><span>Set start</span></button>
    <button type="button" class="button" data-action="loop-end"><span>B</span><span>Set end</span></button>
  </div>
`;

export function createSpeedControls(root, adjust, preview) {
  const panel = root.querySelector('#menu-speed');
  const range = panel.querySelector('.speed-range');
  const readout = panel.querySelector('.speed-value');
  const mode = panel.querySelector('.speed-mode');
  const dial = panel.querySelector('.speed-dial');
  for (const button of panel.querySelectorAll('[data-action="speed"][aria-pressed]')) {
    text(button, () => rateLabel(Number(button.dataset.value)));
  }
  const normal = 100 * (1 - MIN_RATE) / (MAX_RATE - MIN_RATE);
  dial.style.setProperty('--speed-normal', `${normal}%`);
  let held;

  function setTarget(rate) {
    const percent = 100 * (rate - MIN_RATE) / (MAX_RATE - MIN_RATE);
    range.value = rate;
    attribute(range, 'aria-valuetext', () => rateLabel(rate));
    dial.style.setProperty('--speed-start', `${Math.min(normal, percent)}%`);
    dial.style.setProperty('--speed-end', `${Math.max(normal, percent)}%`);
    dial.dataset.rate = rate < 1 ? 'slow' : rate > 1 ? 'fast' : 'normal';
  }

  function setActual(rate) {
    text(readout, () => rateLabel(normalizeRate(rate)));
    text(mode, rate < 1 ? 'Slow motion' : rate > 1 ? 'Fast forward' : 'Normal speed');
  }

  function release() {
    if (!held) return;
    const { button, listeners } = held;
    held = undefined;
    listeners.abort();
    delete button.dataset.held;
    preview();
  }

  function hold(button, input) {
    release();
    const listeners = new AbortController();
    held = { button, input, listeners };
    button.dataset.held = '';
    button.ownerDocument.defaultView.addEventListener('blur', release, { once: true, signal: listeners.signal });
    preview(Number(button.dataset.holdRate));
  }

  range.addEventListener('input', () => adjust(range.valueAsNumber));
  panel.addEventListener('beforetoggle', event => { if (event.newState === 'closed') release(); });
  for (const button of panel.querySelectorAll('[data-hold-rate]')) {
    button.addEventListener('pointerdown', event => {
      if (!event.isPrimary || event.button !== 0) return;
      button.setPointerCapture(event.pointerId);
      hold(button, event.pointerId);
    });
    button.addEventListener('lostpointercapture', event => {
      if (held?.button === button && held.input === event.pointerId) release();
    });
    button.addEventListener('keydown', event => {
      if (event.key !== ' ' && event.key !== 'Enter') return;
      event.preventDefault();
      if (!event.repeat) hold(button, event.key);
    });
    button.addEventListener('keyup', event => {
      if (held?.button === button && held.input === event.key) release();
    });
    button.addEventListener('blur', () => { if (held?.button === button) release(); });
  }

  setTarget(1);
  return { setTarget, setActual };
}
