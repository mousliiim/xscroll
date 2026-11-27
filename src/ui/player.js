import { attribute, language, localizeMarkup, refreshLanguage, text, translate } from '../../remote/language.mjs';
import { icon } from './icons.js';
import { button, choice, menu, menuButton, rateLabel, shortcuts } from './components.js';
import { createOverlays } from './overlays.js';
import { createRepliesView } from './replies.js';
import { postURL } from '../x/model.js';
import { createSpeedControls, speedPanel } from './speed-controls.js';
import styles from './player.css';
import brand from '../../static/icons/icon48.png';
import wordmark from '../../static/icons/wordmark.png';

export function createPlayerView(actions) {
  const host = document.createElement('div');
  host.id = 'xscroll-player';
  host.hidden = true;
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = `
    <style>${styles}</style>
    <div class="shell" role="dialog" aria-label="XScroll" tabindex="-1">
      <header class="top">
        <div class="brand"><img class="mark" src="${brand}" alt=""><img class="brand-wordmark" src="${wordmark}" alt="XScroll"></div>
        <div class="tools">
          ${button('float', 'Open floating player', 'Mini player')}
          ${menuButton('appearance', 'Player settings', icon('appearance'))}
          ${button('close', 'Close XScroll (Esc)')}
        </div>
      </header>
      <main class="layout">
        <section class="viewer-column" aria-label="Video and post actions">
        <div class="stage" id="video-stage" tabindex="-1">
          <div class="track" aria-label="Video feed">
            <div class="empty">${icon('reels')}<span role="status">Looking for unseen videos…</span><button type="button" class="button" data-action="retry" hidden>Find more</button></div>
          </div>
          <aside class="fullscreen-comment" aria-label="On-screen comments" hidden>
            <header class="fullscreen-comment-head">
              <div class="fullscreen-comment-avatar"><span></span><img alt="" hidden></div>
              <div class="fullscreen-comment-identity"><strong></strong><span class="fullscreen-comment-handle"></span></div>
              <time></time>
            </header>
            <p></p>
            <div class="fullscreen-comment-likes">${icon('like')}<span></span></div>
          </aside>
          <div class="controls" hidden>
            <div class="seekbar">
              <input class="seek" type="range" min="0" max="0" step="0.1" value="0" aria-label="Seek video" disabled>
              <i class="loop-mark" hidden></i><i class="loop-mark" hidden></i>
            </div>
            <div class="control-row">
              ${button('play', 'Play (Space)')}
              <div class="sound">${button('volume', 'Mute (M)')}<input class="volume" type="range" min="0" max="1" step="0.05" value="1" aria-label="Volume"></div>
              <span class="time">0:00 / 0:00</span>
              ${menuButton('speed', 'Playback speed', '<span>1×</span>')}
              <div class="stage-nav" aria-label="Navigate videos">
                ${button('up', 'Previous video (↑)')}
                ${button('down', 'Next video (↓)')}
              </div>
              ${button('framing', 'Fill video frame (V)', 'Fit')}
              ${button('captions', 'Subtitles')}
              ${button('fullscreen-comments', 'Show on-screen comments', 'On-screen comments')}
              ${button('fullscreen', 'Fullscreen')}
            </div>
          </div>
          ${menu('speed', 'Playback speed', speedPanel)}
          <div class="notice" role="status" hidden></div>
        </div>
        <div class="engagement" aria-label="Post actions" hidden>
          ${button('like', 'Like', 'Like')}
          ${button('repost', 'Repost', 'Repost')}
          ${button('bookmark', 'Bookmark', 'Save')}
          ${button('replies', 'Show replies', 'Replies')}
          ${button('share', 'Copy post link', 'Share')}
        </div>
        </section>
        <aside class="rail" aria-label="Current post">
          <div class="post" hidden>
            <div class="post-header">
              <div class="post-avatar" aria-hidden="true"></div>
              <div class="post-identity"><a class="author" target="_blank" rel="noopener"></a><span class="post-handle"></span></div>
              <a class="button external" target="_blank" rel="noopener" title="Open post on X" aria-label="Open post on X">${icon('external')}</a>
            </div>
            <p class="caption"></p>
          </div>
        </aside>
        <div class="split" role="separator" aria-label="Video and replies split" aria-controls="video-stage" aria-orientation="horizontal" aria-valuemin="24" aria-valuemax="72" aria-valuenow="40" tabindex="0"></div>
        <section class="thread" id="thread" aria-labelledby="thread-title" hidden>
          <header class="thread-header">
            <div><h2 id="thread-title">Replies</h2><span class="thread-author"></span></div>
            <div class="thread-actions">
              ${button('auto', 'Auto-scroll replies (A)', 'Auto-scroll')}
              <a class="button thread-open" target="_blank" rel="noopener" title="Open conversation on X" aria-label="Open conversation on X">${icon('external')}</a>
              <button type="button" class="button" data-action="hide-replies" title="Close replies (Esc)" aria-label="Close replies (Esc)">${icon('close')}</button>
            </div>
          </header>
          <div class="thread-scroll" role="region" aria-label="Replies list" tabindex="0">
            <ul class="reply-list"></ul>
            <p class="thread-status" role="status" hidden></p>
            <button type="button" class="button more" data-action="more" hidden></button>
          </div>
          <a class="button thread-link" target="_blank" rel="noopener">Open conversation on X${icon('external')}</a>
        </section>
      </main>
      ${menu('quality', 'Video quality', '<div class="quality-options"></div>')}
      ${menu('appearance', 'Player settings', `
        ${menuButton('quality', 'Video quality', `${icon('quality')}<span>Video quality</span><small class="quality-label">Auto</small>`)}
        ${button('download', 'Download video', 'Download video')}
        ${menuButton('size', 'Mini player size and framing', `${icon('size')}<span>Mini player size</span>`)}
        <button type="button" class="choice" data-action="auto-next" aria-pressed="false">${icon('auto')}<span>Play next video automatically</span>${icon('check')}</button>
        <p class="flyout-heading flyout-section">Appearance</p>
        ${choice('theme', 'system', 'System', 'system')}
        ${choice('theme', 'light', 'Light', 'sun')}
        ${choice('theme', 'dark', 'Dark', 'appearance')}
        <p class="flyout-heading flyout-section">Language</p>
        ${choice('language', 'en', 'English')}
        ${choice('language', 'fr', 'Français')}
        ${menuButton('help', 'Keyboard shortcuts (?)', `${icon('shortcuts')}<span>Keyboard shortcuts</span><kbd>?</kbd>`)}
      `)}
      ${menu('size', 'Window size', `
        ${choice('resize', 'compact', 'Compact')}
        ${choice('resize', 'balanced', 'Balanced')}
        ${choice('resize', 'large', 'Large')}
        <p class="flyout-heading flyout-section">Video framing</p>
        ${choice('fit', 'contain', 'Fit')}
        ${choice('fit', 'fill', 'Fill')}
      `)}
      ${menu('help', 'Keyboard shortcuts', `
        <dl class="shortcut-list">${shortcuts.map(([task, key]) => `<div><dt>${task}</dt><dd><kbd>${key}</kbd></dd></div>`).join('')}</dl>
      `)}
      <section class="flyout profile-card" id="menu-profile" aria-label="Profile preview" hidden>
        <div class="profile-header">
          <div class="profile-photo"></div>
          <div><strong class="profile-name"></strong><span class="profile-handle"></span></div>
        </div>
        <p class="profile-bio" hidden></p>
        <div class="profile-footer">
          <span class="profile-followers" hidden></span>
          <a class="button" target="_blank" rel="noopener">View profile${icon('external')}</a>
        </div>
      </section>
    </div>`;
  host.lang = language();
  localizeMarkup(shadow);
  const get = selector => shadow.querySelector(selector);
  const control = name => get(`button[data-action="${name}"]`);
  const track = get('.track');
  const seek = get('.seek');
  const volume = get('.volume');
  const layout = get('.layout');
  const split = get('.split');
  const thread = get('.thread');
  const answersButton = control('replies');
  const notice = get('.notice');
  const fullscreenComment = get('.fullscreen-comment');
  const fullscreenCommentImage = get('.fullscreen-comment-avatar img');
  const fullscreenCommentInitial = get('.fullscreen-comment-avatar span');
  const fullscreenCommentName = get('.fullscreen-comment-identity strong');
  const fullscreenCommentHandle = get('.fullscreen-comment-handle');
  const fullscreenCommentTime = get('.fullscreen-comment time');
  const fullscreenCommentText = get('.fullscreen-comment > p');
  const fullscreenCommentLikes = get('.fullscreen-comment-likes');
  const fullscreenCommentLikeCount = get('.fullscreen-comment-likes span');
  const fullscreenCommentButton = control('fullscreen-comments');
  fullscreenCommentButton.hidden = true;
  fullscreenCommentImage.addEventListener('error', () => {
    fullscreenCommentImage.hidden = true;
    fullscreenCommentImage.removeAttribute('src');
  });
  const shell = get('.shell');
  const speedControls = createSpeedControls(shadow, actions.speed, actions.speedPreview);
  const menuTrigger = name => get(`[data-menu="${name}"]`);
  const counters = Object.fromEntries(['en', 'fr'].map(locale => [locale, new Intl.NumberFormat(locale, { notation: 'compact' })]));
  const countLabel = value => counters[language()].format(value);
  answersButton.setAttribute('aria-expanded', 'false');
  answersButton.setAttribute('aria-controls', 'thread');
  let noticeTimer, qualityMarkup;
  const overlays = createOverlays(shadow, menuTrigger);
  const replies = createRepliesView(host, overlays, actions.more);
  const { show: showMenu, dismiss: dismissMenu, place: placeMenu, current: opened } = overlays;
  const setPressed = (name, value) => {
    for (const button of shadow.querySelectorAll(`[data-action="${name}"][aria-pressed]`)) {
      button.setAttribute('aria-pressed', String(button.dataset.value === String(value)));
    }
  };
  setPressed('language', language());
  const setControl = (name, glyph, title) => {
    const el = control(name);
    if (el.title !== translate(title)) el.querySelector('svg').outerHTML = icon(glyph);
    attribute(el, 'title', title);
    attribute(el, 'aria-label', title);
  };
  const clock = time => {
    if (!Number.isFinite(time)) return '0:00';
    const seconds = String(Math.floor(time % 60)).padStart(2, '0');
    const minutes = Math.floor(time / 60) % 60;
    return time < 3600 ? `${minutes}:${seconds}` : `${Math.floor(time / 3600)}:${String(minutes).padStart(2, '0')}:${seconds}`;
  };
  const syncLinks = id => {
    for (const link of [get('.author'), get('.external'), get('.thread-link'), get('.thread-open')]) {
      if (id) link.href = postURL(id);
      else link.removeAttribute('href');
    }
  };

  for (const el of [control('down'), control('up'), control('download'), answersButton]) el.disabled = true;
  shadow.addEventListener('click', e => {
    const trigger = e.target.closest('[data-menu]');
    if (trigger) {
      const name = trigger.dataset.menu;
      if (opened()?.name === name) dismissMenu(true);
      else {
        const anchor = name === 'appearance' || name === 'speed' ? trigger : menuTrigger('appearance');
        showMenu(name, anchor);
      }
      return;
    }
    const button = e.target.closest('[data-action]');
    if (!button) return;
    const { action, value } = button.dataset;
    if (['quality', 'theme', 'resize', 'fit', 'download'].includes(action)) dismissMenu(true);
    actions[action](value);
  });
  seek.addEventListener('input', () => actions.seek(Number(seek.value)));
  volume.addEventListener('input', () => actions.setVolume(Number(volume.value)));
  track.addEventListener('scrollend', () => actions.scroll(), { passive: true });
  track.addEventListener('wheel', e => {
    if (e.ctrlKey || Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    e.preventDefault();
    actions.scrub(e.deltaX / 20);
  }, { passive: false });

  const updateSplit = (value, commit) => {
    const percent = Math.min(72, Math.max(24, Math.round(value)));
    layout.style.setProperty('--video-share', `${percent}%`);
    split.setAttribute('aria-valuenow', String(percent));
    actions.split(percent, commit);
  };
  split.addEventListener('pointerdown', e => { if (e.button === 0) split.setPointerCapture(e.pointerId); });
  split.addEventListener('pointermove', e => {
    if (!split.hasPointerCapture(e.pointerId)) return;
    const rect = layout.getBoundingClientRect();
    updateSplit((e.clientY - rect.top) / rect.height * 100, false);
  });
  split.addEventListener('lostpointercapture', () => actions.split(Number(split.getAttribute('aria-valuenow')), true));
  split.addEventListener('keydown', e => {
    const direction = { ArrowUp: -1, ArrowDown: 1 }[e.key];
    if (!direction) return;
    e.preventDefault();
    updateSplit(Number(split.getAttribute('aria-valuenow')) + direction * 5, true);
  });

  return {
    host, shadow, track, replies,
    empty(message, retry = '', values) {
      text(get('.empty span'), message, values);
      control('retry').hidden = !retry;
      if (retry) text(control('retry'), retry);
    },
    language(locale) {
      host.lang = locale;
      setPressed('language', locale);
      refreshLanguage(shadow);
      placeMenu();
    },
    stage: get('.stage'), float: control('float'), dismissMenu, placeMenu,
    focus: () => (shadow.fullscreenElement || shell).focus({ preventScroll: true }),
    help: () => opened()?.name === 'help' ? dismissMenu(true) : showMenu('help', menuTrigger(shadow.fullscreenElement ? 'speed' : 'appearance')),
    menuFocusables: () => overlays.focusables(),
    appearance(theme, effective) {
      host.dataset.theme = effective;
      setPressed('theme', theme);
    },
    quality(options, selected, label) {
      const choices = get('.quality-options');
      const markup = options.map(([key, text]) => choice('quality', key, text)).join('');
      if (qualityMarkup !== markup) {
        choices.innerHTML = markup;
        localizeMarkup(choices);
        qualityMarkup = markup;
        placeMenu();
      }
      setPressed('quality', selected);
      text(get('.quality-label'), label);
    },
    speed(rate) {
      text(menuTrigger('speed').querySelector('span'), () => rateLabel(rate));
      setPressed('speed', rate);
      speedControls.setTarget(rate);
    },
    actualSpeed: speedControls.setActual,
    autoNext(enabled) { control('auto-next').setAttribute('aria-pressed', String(enabled)); },
    captions(available, enabled) {
      control('captions').hidden = !available;
      control('captions').setAttribute('aria-pressed', String(enabled));
    },
    loop(loop, duration) {
      const values = [loop?.start, loop?.end];
      for (const [index, key] of ['loop-start', 'loop-end'].entries()) {
        const mark = shadow.querySelectorAll('.loop-mark')[index];
        const value = values[index];
        mark.hidden = value === undefined || !duration;
        if (!mark.hidden) mark.style.left = `${value / duration * 100}%`;
        text(control(key).lastElementChild, value === undefined ? (index ? 'Set end' : 'Set start') :
          `${clock(value)}.${Math.floor(value * 10) % 10}`);
      }
      control('loop-start').disabled = !duration;
      control('loop-end').disabled = !duration || loop?.start === undefined;
      control('loop-clear').disabled = loop?.start === undefined;
    },
    windowSettings(size, fit, splitValue) {
      setPressed('resize', size);
      setPressed('fit', fit);
      host.dataset.fit = fit;
      const framing = control('framing');
      const fill = fit === 'fill';
      framing.setAttribute('aria-pressed', String(fill));
      attribute(framing, 'title', fill ? 'Fill · Cropped to frame (V)' : 'Fit · Whole image (V)');
      text(framing.querySelector('span'), fill ? 'Fill' : 'Fit');
      if (splitValue !== undefined) {
        layout.style.setProperty('--video-share', `${splitValue}%`);
        split.setAttribute('aria-valuenow', String(splitValue));
      }
    },
    post(video) {
      get('.post').hidden = !video;
      get('.controls').hidden = !video;
      get('.empty').hidden = Boolean(video);
      answersButton.disabled = !video?.tweetId;
      control('download').disabled = !video;
      get('.engagement').hidden = !video?.tweetId;
      const handle = video?.user ? `@${video.user}` : '';
      const avatar = get('.post-avatar');
      const initial = (video?.name || video?.user || 'X').slice(0, 1).toUpperCase();
      avatar.replaceChildren(initial);
      if (video?.avatar) {
        const photo = host.ownerDocument.createElement('img');
        photo.alt = '';
        photo.addEventListener('error', () => {
          if (avatar.firstElementChild === photo) avatar.replaceChildren(initial);
        }, { once: true });
        photo.src = video.avatar;
        avatar.replaceChildren(photo);
      }
      text(get('.author'), () => video?.name || handle || translate('Post on X'));
      get('.post-handle').textContent = video?.name ? handle : '';
      get('.thread-author').textContent = video?.user ? handle : '';
      get('.caption').textContent = video?.text || '';
      get('.caption').hidden = !video?.text;
      const count = video?.replyCount;
      text(answersButton.querySelector('span'), () => count > 0 ? countLabel(count) : translate('Replies'));
      attribute(answersButton, 'aria-label', () => count > 0 ? translate('Show {count} replies', { count: countLabel(count) }) : translate('Show replies'));
      syncLinks(video?.tweetId);
    },
    playback(video, muted = video?.muted) {
      const duration = Number.isFinite(video?.duration) ? video.duration : 0;
      const sound = muted || video?.volume === 0;
      seek.max = duration;
      seek.value = video?.currentTime || 0;
      seek.disabled = !duration;
      seek.style.setProperty('--progress', `${duration ? video.currentTime / duration * 100 : 0}%`);
      get('.time').textContent = `${clock(video?.currentTime)} / ${clock(duration)}`;
      attribute(seek, 'aria-valuetext', '{time} of {duration}', { time: clock(video?.currentTime), duration: clock(duration) });
      volume.value = sound ? 0 : video?.volume ?? 1;
      setControl('play', video?.paused ? 'play' : 'pause', video?.paused ? 'Play (Space)' : 'Pause (Space)');
      setControl('volume', sound ? 'mute' : 'volume', sound ? 'Unmute (M)' : 'Mute (M)');
    },
    floating(active, supported) {
      dismissMenu();
      replies.resetWindow();
      host.toggleAttribute('data-floating', active);
      shell.setAttribute('aria-modal', String(!active));
      control('float').hidden = !supported;
      control('fullscreen').hidden = active;
      menuTrigger('size').hidden = !active;
      setControl('float', active ? 'restore' : 'float', active ? 'Return player to tab' : 'Open floating player');
      text(control('float').querySelector('span'), active ? 'Return to tab' : 'Mini player');
    },
    full(active) {
      fullscreenCommentButton.hidden = !active;
      setControl('fullscreen', active ? 'shrink' : 'fullscreen', active ? 'Exit fullscreen' : 'Fullscreen');
    },
    fullscreenComments(enabled) {
      fullscreenCommentButton.setAttribute('aria-pressed', String(enabled));
      setControl('fullscreen-comments', 'fullscreen-comments', enabled ? 'Hide on-screen comments' : 'Show on-screen comments');
    },
    fullscreenComment(reply) {
      fullscreenComment.hidden = !reply;
      if (!reply) return;
      fullscreenCommentName.textContent = reply.name || (reply.handle ? '@' + reply.handle : translate('X user'));
      fullscreenCommentHandle.textContent = reply.name && reply.handle ? `@${reply.handle}` : '';
      fullscreenCommentInitial.textContent = (reply.name || reply.handle || 'X').slice(0, 1).toUpperCase();
      fullscreenCommentImage.hidden = !reply.avatar;
      if (reply.avatar && fullscreenCommentImage.src !== reply.avatar) fullscreenCommentImage.src = reply.avatar;
      else if (!reply.avatar) fullscreenCommentImage.removeAttribute('src');
      fullscreenCommentText.textContent = reply.text || '';
      const timestamp = reply.date && Date.parse(reply.date);
      fullscreenCommentTime.hidden = !Number.isFinite(timestamp);
      if (Number.isFinite(timestamp)) {
        const date = new Date(timestamp);
        fullscreenCommentTime.dateTime = date.toISOString();
        fullscreenCommentTime.textContent = new Intl.DateTimeFormat(language(), {
          dateStyle: 'medium', timeStyle: 'short',
        }).format(date);
      } else {
        fullscreenCommentTime.removeAttribute('datetime');
        fullscreenCommentTime.textContent = '';
      }
      fullscreenCommentLikes.hidden = !Number.isSafeInteger(reply.likeCount);
      fullscreenCommentLikeCount.textContent = Number.isSafeInteger(reply.likeCount) ? countLabel(reply.likeCount) : '';
    },
    presentation(enabled) {
      host.toggleAttribute('data-presentation', enabled);
      this.full(enabled);
    },
    navigate(prev, next) {
      control('up').disabled = !prev;
      control('down').disabled = !next;
    },
    downloading(active, hasVideo = true) {
      control('download').disabled = active || !hasVideo;
      control('download').setAttribute('aria-busy', String(active));
    },
    message(message) {
      clearTimeout(noticeTimer);
      text(notice, message);
      notice.hidden = !message;
      if (message) noticeTimer = setTimeout(() => { notice.hidden = true; }, 2600);
    },
    toggleReplies(active, focus) {
      thread.hidden = !active;
      layout.classList.toggle('show-thread', active);
      if (!active && opened()?.name === 'profile') dismissMenu();
      answersButton.setAttribute('aria-expanded', String(active));
      if (focus) (active ? control('hide-replies') : answersButton).focus();
    },

    engagement(record) {
      for (const [kind, verb, inverse, plain] of [
        ['like', 'Like', 'Unlike', 'Like'],
        ['repost', 'Repost', 'Undo repost', 'Repost'],
        ['bookmark', 'Bookmark', 'Remove bookmark', 'Save'],
      ]) {
        const button = control(kind);
        const pressed = record?.stats[kind] === true;
        const count = record?.stats[`${kind}Count`];
        const busy = Boolean(record?.pending.has(kind));
        button.disabled = !record || busy;
        button.setAttribute('aria-pressed', String(pressed));
        button.setAttribute('aria-busy', String(busy));
        const title = pressed ? inverse : verb;
        attribute(button, 'aria-label', title);
        attribute(button, 'title', title);
        text(button.querySelector('span'), () => {
          if (kind === 'bookmark') return translate(pressed ? 'Saved' : plain);
          return count > 0 ? countLabel(count) : translate(plain);
        });
      }
    },
  };
}
