import { createRateRamp, normalizeRate } from './rate.js';
import { readSetting, saveSetting } from './settings.js';

const RADIUS = 2;
const STEPS = [270, 360, 480, 540, 720, 1080, 1440, 2160];

export function pickVariant(clip, quality, cap = 720) {
  const variants = clip.variants;
  const label = value => Number.parseInt(value.label, 10);
  if (quality === 'best') return variants[0];
  if (quality !== 'auto') {
    const exact = variants.find(value => value.label === quality);
    if (exact) return exact;
  }
  const ceiling = quality === 'auto' ? cap : Number.parseInt(quality, 10);
  return variants.find(value => !(label(value) > ceiling)) || variants.at(-1);
}

export function createMediaDeck(view, { onSlide, onPlayback, onSync = () => {} }) {
  const { track } = view;
  const before = track.ownerDocument.createElement('div');
  const after = track.ownerDocument.createElement('div');
  before.className = after.className = 'track-space';
  track.append(before, after);
  const mounted = new Map();
  const resume = new Map();
  const rateRamp = createRateRamp();
  const clip = () => clips[index];
  const active = () => mounted.get(index);
  const video = () => active()?.video;
  const pick = item => pickVariant(item, quality, autoCap);
  let clips = [], index = -1;
  let quality = readSetting('quality', 'auto');
  let rate = 1, previewRate, muted = false, volume = 1, screenAudio = false;
  const isMuted = () => screenAudio ? muted : video()?.muted ?? muted;
  const targetRate = () => previewRate ?? rate;
  let autoCap = 720, smoothClips = 0, lastDrop = -Infinity;
  let downloadPending = false, seekVersion = 0;

  function play(element) {
    if (!element) return;
    return element.play().catch(error => {
      if (error.name !== 'NotAllowedError' || element !== video() || element.muted) return;
      element.muted = true;
      return element.play().catch(() => {});
    });
  }

  function stopLoop(slide) {
    if (slide?.loopFrame === undefined) return;
    slide.video.cancelVideoFrameCallback(slide.loopFrame);
    slide.loopFrame = undefined;
  }

  function watchLoop(slide) {
    const { video: element, loop } = slide;
    if (element !== video() || element.paused || loop?.end === undefined || slide.loopFrame !== undefined) return;
    slide.loopFrame = element.requestVideoFrameCallback((_, frame) => {
      slide.loopFrame = undefined;
      if (element !== video() || element.paused || slide.loop !== loop) return;
      if (!element.seeking && (frame.mediaTime >= loop.end || element.currentTime < loop.start - 0.08)) {
        element.currentTime = loop.start;
      }
      watchLoop(slide);
    });
  }

  function renderMedia() {
    const element = video();
    if (!element) return;
    view.playback(element, isMuted());
    onPlayback(element);
  }

  function updateQuality() {
    const item = clip();
    const options = [...new Set(item?.variants.map(variant => variant.label))].map(label => [label, label]);
    const auto = item ? `Auto · ${pickVariant(item, 'auto', autoCap).label}` : 'Auto';
    const selected = quality === 'auto' || quality === 'best' || !item ? quality : pick(item).label;
    const label = selected === 'auto' ? auto : selected === 'best' ? 'Best' : selected;
    view.quality([['auto', auto], ['best', 'Best'], ...options], selected, label);
  }

  function setQuality(value) {
    quality = value;
    saveSetting('quality', value);
    for (const slide of mounted.values()) {
      const element = slide.video;
      const url = pick(slide.clip).url;
      if (element.src === url) continue;
      const time = element.currentTime;
      const isActive = element === video();
      const playing = isActive && !element.paused;
      element.src = url;
      element.currentTime = time;
      if (isActive) rateRamp.snap(element, targetRate());
      if (playing) play(element);
    }
    updateQuality();
  }

  function adapt(slide) {
    const element = slide.video;
    const now = performance.now();
    if (quality !== 'auto' || element !== video() || element.seeking || element.currentTime < 0.6 ||
        now - slide.startedAt < 1500 || now - lastDrop < 5000) return;
    const current = Number.parseInt(pick(slide.clip).label, 10);
    const lower = pickVariant(slide.clip, 'auto', current - 1);
    if (!(current > STEPS[0]) || lower.url === element.src) return;
    slide.stalled = true;
    smoothClips = 0;
    lastDrop = now;
    autoCap = current - 1;
    setQuality('auto');
  }

  function createFrame(item, position) {
    const doc = track.ownerDocument;
    const frame = doc.createElement('div');
    frame.className = 'frame';
    frame.dataset.index = String(position);
    const element = doc.createElement('video');
    Object.assign(element, { loop: true, playsInline: true, preload: 'auto', poster: item.poster || '', preservesPitch: true });
    frame.append(element);
    const remembered = resume.get(item.key);
    const slide = { clip: item, frame, video: element, startedAt: performance.now(), loop: remembered?.loop };
    if (remembered?.time) {
      element.addEventListener('loadedmetadata', () => {
        if (element.currentTime === 0) element.currentTime = Math.min(remembered.time, Math.max(0, element.duration - 0.1));
      }, { once: true });
    }
    frame.addEventListener('click', () => { if (element === video()) togglePlay(); });
    for (const event of ['play', 'durationchange', 'timeupdate', 'volumechange']) {
      element.addEventListener(event, () => {
        if (element !== video()) return;
        renderMedia();
        if (event !== 'timeupdate') onSync();
      });
    }
    for (const event of ['playing', 'pause', 'waiting', 'seeking', 'seeked', 'emptied']) {
      element.addEventListener(event, () => {
        if (element !== video()) return;
        if (event === 'seeking') seekVersion++;
        if (event === 'playing' || event === 'seeked') slide.startedAt = performance.now();
        if (element.paused) {
          rateRamp.snap(element, targetRate());
          stopLoop(slide);
        } else watchLoop(slide);
        if (event === 'waiting') adapt(slide);
        renderMedia();
        onSync();
      });
    }
    element.addEventListener('ratechange', () => {
      if (element === video()) {
        view.actualSpeed(element.playbackRate);
        onSync();
      }
    });
    element.addEventListener('loadedmetadata', () => {
      if (element === video()) view.loop(slide.loop, element.duration);
    });
    element.addEventListener('error', () => {
      if (element === video()) view.message('This video couldn’t play.');
    });
    element.src = pick(item).url;
    return slide;
  }

  function release(position, slide) {
    stopLoop(slide);
    if (slide.video.currentTime > 0 || slide.loop) {
      resume.set(slide.clip.key, { time: slide.video.currentTime, loop: slide.loop });
      if (resume.size > 300) resume.delete(resume.keys().next().value);
    }
    slide.video.pause();
    slide.frame.remove();
    slide.video.removeAttribute('src');
    slide.video.load();
    mounted.delete(position);
  }

  function syncFrames() {
    if (index < 0) return;
    const first = Math.max(0, index - RADIUS);
    const last = Math.min(clips.length - 1, index + RADIUS);
    before.style.height = `${first * 100}%`;
    after.style.height = `${(clips.length - last - 1) * 100}%`;
    for (const [position, slide] of mounted) {
      if (position < first || position > last) release(position, slide);
    }
    let anchor = after;
    for (let position = last; position >= first; position--) {
      if (!mounted.has(position)) mounted.set(position, createFrame(clips[position], position));
      const { frame } = mounted.get(position);
      if (frame.nextElementSibling !== anchor) track.insertBefore(frame, anchor);
      anchor = frame;
    }
    view.navigate(index > 0, index + 1 < clips.length);
  }

  function jump(position = index, behavior = 'instant') {
    track.scrollTo({ top: Math.max(0, position) * track.clientHeight, behavior });
  }

  function focus(position) {
    if (!clips[position] || index === position) return;
    const prior = active();
    stopLoop(prior);
    if (prior && quality === 'auto' && !prior.stalled && prior.video.currentTime > 3 && ++smoothClips >= 3) {
      const owner = track.ownerDocument.defaultView;
      const screen = Math.max(720, owner.innerHeight * owner.devicePixelRatio);
      autoCap = Math.min(STEPS.find(step => step > autoCap) || autoCap, screen);
      smoothClips = 0;
    }
    index = position;
    previewRate = undefined;
    if (prior) {
      prior.frame.classList.remove('is-active');
      prior.video.pause();
    }
    syncFrames();
    if (Math.abs(track.scrollTop - index * track.clientHeight) > track.clientHeight) jump();
    const slide = active();
    const element = slide.video;
    slide.frame.classList.add('is-active');
    element.muted = muted || screenAudio;
    element.volume = volume;
    rateRamp.snap(element, rate);
    view.actualSpeed(element.playbackRate);
    view.post(slide.clip);
    view.downloading(downloadPending);
    view.playback(element, isMuted());
    view.loop(slide.loop, element.duration);
    view.message('');
    updateQuality();
    onSlide(slide.clip, index);
    play(element);
  }

  function togglePlay() {
    const element = video();
    if (element?.paused) play(element);
    else element?.pause();
  }

  function seek(time) {
    const element = video();
    if (!Number.isFinite(element?.duration)) return;
    element.currentTime = Math.max(0, Math.min(element.duration, time));
    renderMedia();
  }

  return {
    clip, video, seekVersion: () => seekVersion,
    index: () => Math.max(0, index),
    update(items) {
      clips = items;
      if (index < 0 && clips.length) focus(0);
      else syncFrames();
    },
    reset() {
      rateRamp.cancel();
      index = -1;
      for (const [position, slide] of mounted) release(position, slide);
      resume.clear();
      clips = [];
      before.style.height = after.style.height = '0px';
      view.post();
      view.loop(undefined, 0);
      view.navigate(false, false);
      rate = 1;
      previewRate = undefined;
      view.speed(rate);
      view.actualSpeed(rate);
      updateQuality();
      jump(0);
    },
    jump,
    onScroll() {
      if (track.clientHeight && index >= 0) focus(Math.round(track.scrollTop / track.clientHeight));
    },
    step(direction) {
      const next = index + direction;
      if (!clips[next]) return;
      focus(next);
      jump(next);
    },
    togglePlay, seek, setQuality,
    scrub: change => seek((video()?.currentTime || 0) + change),
    setRate(target) {
      const next = normalizeRate(target);
      if (next === rate && previewRate === undefined) return;
      rate = next;
      previewRate = undefined;
      rateRamp.set(video(), rate);
      view.speed(rate);
    },
    previewRate(value) {
      if (value === undefined && previewRate === undefined) return;
      previewRate = value === undefined ? undefined : normalizeRate(value);
      rateRamp.set(video(), targetRate());
    },
    rate: () => rate,
    isMuted,
    screenAudio(enabled) {
      if (screenAudio === enabled) return;
      muted = isMuted();
      screenAudio = enabled;
      const element = video();
      if (!element) return;
      element.muted = muted || screenAudio;
      renderMedia();
    },
    toggleMute() {
      const element = video();
      if (!element) return;
      if (element.volume === 0) element.volume = volume = 1;
      else {
        muted = !isMuted();
        element.muted = muted || screenAudio;
      }
      renderMedia();
    },
    setVolume(value) {
      const element = video();
      if (!element) return;
      element.volume = volume = value;
      muted = false;
      element.muted = screenAudio;
      renderMedia();
    },
    loop(point) {
      const slide = active();
      const element = slide?.video;
      if (!Number.isFinite(element?.duration) || element.duration <= 0) return;
      if (point === 'end' && element.currentTime < (slide.loop?.start ?? Infinity) + 0.25) {
        view.message('Choose an end at least 0.25 s after A.');
        return;
      }
      stopLoop(slide);
      if (point === 'start') slide.loop = { start: element.currentTime };
      else if (point === 'clear') slide.loop = undefined;
      else {
        slide.loop = { ...slide.loop, end: element.currentTime };
        element.currentTime = slide.loop.start;
        watchLoop(slide);
      }
      view.loop(slide.loop, element.duration);
    },
    move(moveRoot) {
      const slide = active();
      const element = slide?.video;
      const time = element?.currentTime;
      const playing = element && !element.paused;
      rateRamp.cancel();
      stopLoop(slide);
      moveRoot();
      jump();
      if (element) {
        rateRamp.snap(element, targetRate());
        if (time && element.currentTime !== time) element.currentTime = time;
        if (playing && element.paused) play(element);
        else if (playing) watchLoop(slide);
      }
      onPlayback(element);
    },
    async download() {
      const item = clip();
      if (!item || downloadPending) return;
      downloadPending = true;
      view.downloading(true);
      try {
        const response = await fetch(pick(item).url);
        if (!response.ok) throw new Error('Download failed');
        const downloader = view.host.ownerDocument.createElement('a');
        const url = URL.createObjectURL(await response.blob());
        downloader.href = url;
        downloader.download = `${item.user || 'x'}-${item.tweetId}.mp4`;
        downloader.click();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      } catch {
        view.message('Couldn’t download this video.');
      } finally {
        downloadPending = false;
        view.downloading(false, Boolean(clip()));
      }
    },
  };
}
