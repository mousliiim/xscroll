import { icon } from './icons.js';

export const button = (name, title, label = '') =>
  `<button type="button" class="button" data-action="${name}" title="${title}" aria-label="${title}">${icon(name)}${label ? `<span>${label}</span>` : ''}</button>`;
export const menuButton = (name, title, content) =>
  `<button type="button" class="button" data-menu="${name}" aria-controls="menu-${name}" aria-expanded="false" title="${title}" aria-label="${title}">${content}</button>`;
export const choice = (name, value, label, glyph) =>
  `<button type="button" class="choice" data-action="${name}" data-value="${value}" aria-pressed="false">${glyph ? icon(glyph) : ''}<span>${label}</span>${icon('check')}</button>`;
export const menu = (name, title, content) =>
  `<section class="flyout" id="menu-${name}" aria-label="${title}" hidden><p class="flyout-heading">${title}</p>${content}</section>`;
export const rateLabel = value => `${value}×`;
export const shortcuts = [
  ['Play / pause', 'Space'], ['Previous / next video', '↑ / ↓ · K / J'], ['Seek 5 seconds', '← / →'],
  ['Slower / faster', 'Shift + ← / →'], ['Reset playback speed', '0'], ['Mute / unmute', 'M'],
  ['Replies', 'R'], ['Auto-scroll replies', 'A'], ['Mini player / return', 'P'],
  ['Change mini player size', 'Z'], ['Light / dark mode', 'T'], ['Fullscreen in tab', 'F'], ['Fit / fill the video frame', 'V'],
  ['Close menu / panel', 'Esc'],
];
