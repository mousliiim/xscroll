import { postURL } from '../x/model.js';

export function createRepliesView(host, overlays, onMore) {
  const root = host.shadowRoot;
  const thread = root.querySelector('.thread');
  const answerList = root.querySelector('.reply-list');
  const answerScroll = root.querySelector('.thread-scroll');
  const profile = root.querySelector('.profile-card');
  const more = root.querySelector('[data-action="more"]');
  const get = selector => root.querySelector(selector);
  const control = name => get(`[data-action="${name}"]`);
  const view = () => host.ownerDocument.defaultView;
  const numbers = new Intl.NumberFormat(undefined, { notation: 'compact' });
  const dates = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  const fullDate = new Intl.DateTimeFormat(undefined, { dateStyle: 'full', timeStyle: 'long' });
  let profilePinned, profileTimer;
  let scrollRunning = false, scrollFrame, lastTick, remainder = 0, bottomSince, pauseUntil = 0;

  const pauseScroll = () => {
    pauseUntil = performance.now() + 4500;
    bottomSince = undefined;
  };
  const scheduleScroll = () => {
    if (!scrollRunning || scrollFrame) return;
    const owner = view();
    scrollFrame = { owner, id: owner.requestAnimationFrame(scrollReplies) };
  };
  const scrollReplies = now => {
    scrollFrame = null;
    const elapsed = lastTick === undefined ? 0 : Math.min(now - lastTick, 60);
    lastTick = now;
    if (performance.now() >= pauseUntil && !overlays.current() && answerList.childElementCount) {
      const bottom = answerScroll.scrollHeight - answerScroll.clientHeight;
      if (answerScroll.scrollTop < bottom - 1) {
        bottomSince = undefined;
        remainder += elapsed * 0.022;
        const pixels = Math.floor(remainder);
        remainder -= pixels;
        if (pixels) answerScroll.scrollTop += pixels;
      } else if (more.dataset.nextPage === 'true') {
        bottomSince ??= now;
        if (now - bottomSince > 1200) {
          bottomSince = undefined;
          onMore();
        }
      }
    }
    scheduleScroll();
  };
  const resetScrollFrame = () => {
    if (scrollFrame) scrollFrame.owner.cancelAnimationFrame(scrollFrame.id);
    scrollFrame = null;
    lastTick = bottomSince = undefined;
    remainder = 0;
  };

  const clearProfileTimer = () => {
    if (profileTimer) profileTimer.owner.clearTimeout(profileTimer.id);
    profileTimer = null;
  };
  const deferProfile = (callback, delay) => {
    clearProfileTimer();
    const owner = view();
    profileTimer = { owner, id: owner.setTimeout(callback, delay) };
  };

  const hideProfile = () => {
    clearProfileTimer();
    if (!profilePinned && overlays.current()?.name === 'profile') overlays.dismiss();
  };
  const showProfile = (avatar, reply, pinned = false) => {
    if (!avatar.isConnected || thread.hidden || (overlays.current() && overlays.current().name !== 'profile' && !pinned)) return;
    if (pinned && profilePinned && overlays.current()?.anchor === avatar) {
      overlays.dismiss(true);
      return;
    }
    profilePinned = pinned;
    const photo = get('.profile-photo');
    photo.textContent = (reply.name || reply.handle)[0].toUpperCase();
    if (reply.avatar) {
      const image = host.ownerDocument.createElement('img');
      image.alt = '';
      image.addEventListener('error', () => { image.src = reply.avatar; }, { once: true });
      image.src = reply.avatar.replace(/_(?:normal|bigger|mini)(\.[a-z]+)(?=[?#]|$)/i, '_400x400$1');
      photo.replaceChildren(image);
    }
    get('.profile-name').textContent = reply.name || `@${reply.handle}`;
    get('.profile-handle').textContent = `@${reply.handle}`;
    const bio = get('.profile-bio');
    bio.textContent = reply.bio || '';
    bio.hidden = !reply.bio;
    const count = get('.profile-followers');
    count.textContent = Number.isFinite(reply.followers) ? `${numbers.format(reply.followers)} followers` : '';
    count.hidden = !count.textContent;
    profile.querySelector('a').href = `https://x.com/${encodeURIComponent(reply.handle)}`;
    overlays.show('profile', avatar, pinned);
  };
  profile.addEventListener('pointerenter', clearProfileTimer);
  profile.addEventListener('pointerleave', () => deferProfile(hideProfile, 180));

  for (const type of ['wheel', 'pointerdown', 'keydown']) {
    answerScroll.addEventListener(type, pauseScroll, { passive: true });
  }
  answerScroll.addEventListener('scroll', () => {
    if (overlays.current()?.name !== 'profile') return;
    const anchor = overlays.current().anchor.getBoundingClientRect();
    const list = answerScroll.getBoundingClientRect();
    if (anchor.bottom <= list.top || anchor.top >= list.bottom) overlays.dismiss();
    else overlays.place();
  }, { passive: true });
  return {
    resetWindow() {
      clearProfileTimer();
      resetScrollFrame();
    },
    step(direction) {
      pauseScroll();
      const atBottom = answerScroll.scrollTop >= answerScroll.scrollHeight - answerScroll.clientHeight - 2;
      if (direction > 0 && atBottom && more.dataset.nextPage === 'true') onMore();
      answerScroll.scrollBy({
        top: Math.max(80, answerScroll.clientHeight * .65) * direction,
        behavior: view().matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      });
    },
    autoScroll(enabled, running) {
      control('auto').setAttribute('aria-pressed', String(enabled));
      if (scrollRunning !== running) {
        scrollRunning = running;
        resetScrollFrame();
      }
      scheduleScroll();
    },
    clearReplies() {
      clearProfileTimer();
      if (overlays.current()?.name === 'profile') overlays.dismiss();
      answerList.replaceChildren();
      answerScroll.scrollTop = 0;
      pauseUntil = 0;
      bottomSince = undefined;
      remainder = 0;
    },
    appendReplies(replies) {
      const items = replies.map(reply => {
        const item = document.createElement('li');
        if (reply.nested) item.className = 'nested';
        const avatar = document.createElement(reply.avatar ? 'img' : 'span');
        avatar.className = 'reply-avatar';
        if (reply.avatar) {
          avatar.src = reply.avatar;
          avatar.alt = '';
          avatar.loading = 'lazy';
        } else {
          avatar.textContent = (reply.name || reply.handle || 'X')[0].toUpperCase();
          avatar.setAttribute('aria-hidden', 'true');
        }
        const body = document.createElement('div');
        body.className = 'reply-body';
        const author = document.createElement('a');
        author.className = 'reply-author';
        author.href = postURL(reply.id);
        author.target = '_blank';
        author.rel = 'noopener';
        const name = document.createElement('strong');
        name.textContent = reply.name || (reply.handle ? `@${reply.handle}` : 'X user');
        author.append(name);
        if (reply.handle && reply.name) {
          const handle = document.createElement('span');
          handle.textContent = `@${reply.handle}`;
          author.append(handle);
        }
        if (reply.date && Number.isFinite(Date.parse(reply.date))) {
          const time = document.createElement('time');
          time.className = 'reply-time';
          time.dateTime = new Date(reply.date).toISOString();
          time.textContent = dates.format(new Date(reply.date));
          time.title = fullDate.format(new Date(reply.date));
          body.append(time);
        }
        const text = document.createElement('p');
        text.textContent = reply.text || 'View this reply on X';
        body.prepend(author);
        body.append(text);
        if (/^[a-z0-9_]{1,15}$/i.test(reply.handle)) {
          const preview = host.ownerDocument.createElement('button');
          preview.className = 'avatar-trigger';
          preview.type = 'button';
          preview.setAttribute('aria-label', `Preview @${reply.handle}`);
          preview.setAttribute('aria-controls', 'menu-profile');
          preview.setAttribute('aria-expanded', 'false');
          preview.append(avatar);
          preview.addEventListener('pointerenter', () => deferProfile(() => showProfile(preview, reply), 160));
          preview.addEventListener('pointerleave', () => deferProfile(hideProfile, 200));
          preview.addEventListener('click', () => {
            clearProfileTimer();
            showProfile(preview, reply, true);
          });
          item.append(preview, body);
        } else item.append(avatar, body);
        return item;
      });
      answerList.append(...items);
    },
    replyStatus(status, next, pending = false, hasNext = false) {
      const info = get('.thread-status');
      info.textContent = status;
      info.hidden = !status;
      more.hidden = !next;
      more.disabled = pending;
      more.textContent = next || '';
      more.dataset.nextPage = String(hasNext);
    },
  };
}
