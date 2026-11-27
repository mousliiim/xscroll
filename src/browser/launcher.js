import icon from '../../static/icons/icon48.png';
import wordmark from '../../static/icons/wordmark.png';
import { mediaURL } from '../x/model.js';
import { postReference } from '../player/selection.js';

const style = `
  html:has(#xscroll-player:not([hidden])) { scrollbar-width: none; }
  #xscroll-launcher, .xscroll-on-video {
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    border: 1px solid #404040;
    background: #1a1a1a;
    color: #f7f7f7;
    font: 650 13px/1 system-ui, sans-serif;
    cursor: pointer;
    transition: background-color 150ms ease, border-color 150ms ease;
  }
  #xscroll-launcher {
    position: fixed;
    top: 14px;
    right: 16px;
    z-index: 2147483645;
    height: 42px;
    padding: 0 12px 0 7px;
    border-radius: 12px;
    box-shadow: 0 4px 14px #0f0f0f2c;
  }
  #xscroll-launcher .launcher-icon { width: 27px; height: 27px; }
  #xscroll-launcher .launcher-name { width: 68px; height: 18px; object-fit: contain; }
  #xscroll-launcher:hover, .xscroll-on-video:hover { background: #292929; border-color: #aeaeae; }
  #xscroll-launcher:focus-visible, .xscroll-on-video:focus-visible { outline: 2px solid #b2b2b2; outline-offset: 3px; }
  .xscroll-on-video { position: absolute; z-index: 5; top: 8px; right: 8px; padding: 2px; width: 34px; height: 34px; border-radius: 8px; }
  .xscroll-on-video img { width: 28px; height: 28px; }
  @media (max-width: 1090px) { #xscroll-launcher { width: 40px; padding: 0; } #xscroll-launcher .launcher-name { display: none; } }
  @media (prefers-reduced-motion: reduce) { #xscroll-launcher, .xscroll-on-video { transition: none; } }
  @media (max-width: 650px) { #xscroll-launcher { top: 8px; right: 8px; } }
`;

function logoButton(name, withWordmark = false) {
  const button = document.createElement('button');
  button.type = 'button';
  button.title = name;
  button.setAttribute('aria-label', name);
  const mark = document.createElement('img');
  mark.src = icon;
  mark.className = 'launcher-icon';
  mark.alt = '';
  button.append(mark);
  if (withWordmark) {
    const brand = document.createElement('img');
    brand.className = 'launcher-name';
    brand.src = wordmark;
    brand.alt = '';
    button.append(brand);
  }
  return button;
}

export function postSeed(feed) {
  return feed.seedFor(postReference(location.pathname));
}

export function mountLaunchers(feed, start) {
  const css = document.createElement('style');
  css.textContent = style;
  const launcher = logoButton('Open XScroll', true);
  launcher.id = 'xscroll-launcher';
  launcher.addEventListener('click', () => start(postSeed(feed), launcher));
  document.body.append(css, launcher);

  const selector = '[data-testid="videoComponent"]';
  function prepare(player) {
    if (player.querySelector(':scope > .xscroll-on-video')) return;
    const button = logoButton('Play this video in XScroll');
    button.className = 'xscroll-on-video';
    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      const video = player.querySelector('video');
      const quote = player.closest('[data-testid="quoteTweet"]');
      const scope = quote || player.closest('article');
      const url = player.closest('a[href*="/status/"]')?.pathname ||
        scope?.querySelector('a[href*="/status/"] time')?.closest('a')?.pathname ||
        (quote && scope?.querySelector('a[href*="/status/"]')?.pathname);
      const reference = postReference(url || location.pathname);
      const poster = mediaURL(video?.poster, 'pbs.twimg.com');
      const source = mediaURL(video?.currentSrc, 'video.twimg.com') || mediaURL(video?.src, 'video.twimg.com');
      const seed = feed.seedFor({ ...reference, poster, source });
      if (seed) start(seed, button);
    });
    player.append(button);
  }
  for (const player of document.querySelectorAll(selector)) prepare(player);
  const pending = new Set();
  let frame;
  new MutationObserver(records => {
    for (const record of records) for (const node of record.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE || node.classList.contains('xscroll-on-video')) continue;
      if (node.matches(selector)) pending.add(node);
      else for (const player of node.querySelectorAll(selector)) pending.add(player);
    }
    if (pending.size && !frame) frame = requestAnimationFrame(() => {
      frame = undefined;
      for (const player of pending) if (player.isConnected) prepare(player);
      pending.clear();
    });
  }).observe(document.body, { childList: true, subtree: true });
  return launcher;
}
