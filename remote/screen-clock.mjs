const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const wrap = (value, length) => ((value % length) + length) % length;

export function screenClock({ media, paused, rate, age }, elapsed, currentTime, duration, forceSeek = false) {
  const running = !paused && !media.stalled;
  const length = Number.isFinite(duration) && duration > 0 ? duration : media.duration;
  const sinceSample = clamp(age + elapsed, 0, 8000) / 1000;
  const estimated = media.time + (running ? sinceSample * rate : 0);
  const target = length > 0 ? (running ? wrap(estimated, length) : Math.min(estimated, length)) : estimated;
  let drift = target - currentTime;
  if (running && length > 0) drift = wrap(drift + length / 2, length) - length / 2;

  const tolerance = running ? 1.25 : .16;
  if ((forceSeek && Math.abs(target - currentTime) > .045) || Math.abs(drift) >= tolerance) {
    return { running, seek: target, rate };
  }

  // Keep the decoder on its current buffer for small differences between the two clocks.
  const adjustment = running && !forceSeek && Math.abs(drift) >= .12 ? clamp(drift * .075, -.045, .045) : 0;
  return { running, rate: clamp(Math.round(rate * (1 + adjustment) * 100) / 100, .25, 2) };
}
