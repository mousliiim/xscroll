export const MIN_RATE = 0.25;
export const MAX_RATE = 2;

const SAMPLE_MS = 48;
const SETTLE_DISTANCE = 0.03;

export function normalizeRate(value) {
  const rate = Number(value);
  return Number.isFinite(rate) ? Math.max(MIN_RATE, Math.min(MAX_RATE, Math.round(rate * 100) / 100)) : 1;
}

export function createRateRamp() {
  let current;

  function cancel() {
    if (current?.frame !== undefined) current.owner.cancelAnimationFrame(current.frame);
    current = undefined;
  }

  function apply(video, rate) {
    if (video.playbackRate !== rate) video.playbackRate = rate;
  }

  function remember(video, rate) {
    if (video.defaultPlaybackRate !== rate) video.defaultPlaybackRate = rate;
  }

  function snap(video, value) {
    cancel();
    if (!video) return;
    const rate = normalizeRate(value);
    video.preservesPitch = true;
    apply(video, rate);
    remember(video, rate);
  }

  function sample(state, now) {
    state.frame = undefined;
    const { video, target, owner } = state;
    const distance = target - video.playbackRate;
    if (video.paused || distance === 0 || now - state.sampledAt >= SAMPLE_MS) {
      // Coalesce drag events and let the audio time stretcher settle between rate changes.
      const next = video.paused || Math.abs(distance) <= SETTLE_DISTANCE ?
        target : normalizeRate(video.playbackRate + distance * 0.55);
      apply(video, next);
      state.sampledAt = now;
      if (next === target) {
        remember(video, target);
        return;
      }
    }
    state.frame = owner.requestAnimationFrame(time => sample(state, time));
  }

  function set(video, value) {
    if (!video || video.paused || video.ownerDocument.hidden) {
      snap(video, value);
      return;
    }
    if (current?.video !== video) {
      cancel();
      video.preservesPitch = true;
      current = { video, owner: video.ownerDocument.defaultView, sampledAt: -Infinity };
    }
    const state = current;
    state.target = normalizeRate(value);
    state.frame ??= state.owner.requestAnimationFrame(now => sample(state, now));
  }

  return { cancel, snap, set };
}
