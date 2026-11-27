const CONTROLS_IDLE_MS = 4000;
const POST_IDLE_MS = 10000;

export function createFullscreenIdle({ onActivity, onControlsIdle, onPostIdle }) {
  let active = false;
  let controlsVisible = false, postVisible = false;
  let controlsDeadline = 0, postDeadline = 0;
  let controlsTimer, postTimer;

  function armControls() {
    if (!active || controlsTimer !== undefined) return;
    controlsTimer = setTimeout(() => {
      controlsTimer = undefined;
      if (!active) return;
      const remaining = controlsDeadline - performance.now();
      if (remaining > 0) {
        armControls();
        return;
      }
      controlsVisible = false;
      onControlsIdle();
    }, Math.max(0, controlsDeadline - performance.now()));
  }

  function armPost() {
    if (!active || postTimer !== undefined) return;
    postTimer = setTimeout(() => {
      postTimer = undefined;
      if (!active) return;
      const remaining = postDeadline - performance.now();
      if (remaining > 0) {
        armPost();
        return;
      }
      postVisible = false;
      onPostIdle();
    }, Math.max(0, postDeadline - performance.now()));
  }

  function activity() {
    if (!active) return;
    if (!controlsVisible || !postVisible) onActivity();
    controlsVisible = postVisible = true;
    const now = performance.now();
    controlsDeadline = now + CONTROLS_IDLE_MS;
    postDeadline = now + POST_IDLE_MS;
    armControls();
    armPost();
  }

  function clear() {
    clearTimeout(controlsTimer);
    clearTimeout(postTimer);
    controlsTimer = postTimer = undefined;
  }

  const state = {
    setActive(value) {
      if (active === value) return;
      active = value;
      if (active) activity();
      else {
        controlsVisible = postVisible = false;
        clear();
      }
    },
    activity,
  };
  return state;
}
