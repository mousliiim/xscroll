export function bindHold(buttons, start, end) {
  let active;

  function release() {
    if (!active) return;
    const { button, listeners } = active;
    active = undefined;
    listeners.abort();
    delete button.dataset.held;
    end();
  }

  function hold(button, input) {
    release();
    const listeners = new AbortController();
    const doc = button.ownerDocument;
    active = { button, input, listeners };
    button.dataset.held = '';
    doc.defaultView.addEventListener('blur', release, { signal: listeners.signal });
    doc.addEventListener('visibilitychange', () => { if (doc.hidden) release(); }, { signal: listeners.signal });
    start(button);
  }

  for (const button of buttons) {
    function finish(input) {
      if (active?.button === button && active.input === input) release();
    }

    button.addEventListener('contextmenu', event => event.preventDefault());
    button.addEventListener('pointerdown', event => {
      if (button.disabled || !event.isPrimary || event.button !== 0) return;
      if (event.pointerType !== 'mouse') event.preventDefault();
      button.setPointerCapture(event.pointerId);
      hold(button, event.pointerId);
    });
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      button.addEventListener(name, event => finish(event.pointerId));
    }
    button.addEventListener('keydown', event => {
      if (event.key !== ' ' && event.key !== 'Enter') return;
      event.preventDefault();
      if (!event.repeat && !button.disabled) hold(button, event.key);
    });
    button.addEventListener('keyup', event => finish(event.key));
    button.addEventListener('blur', () => { if (active?.button === button) release(); });
  }

  return release;
}
