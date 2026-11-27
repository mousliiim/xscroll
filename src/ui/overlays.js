import { autoUpdate, computePosition, flip, offset, shift } from '@floating-ui/dom';

export function createOverlays(root, trigger) {
  let active;

  function dismiss(restore = false) {
    if (!active) return false;
    const { anchor, panel, dispose } = active;
    active = undefined;
    dispose?.();
    anchor.setAttribute('aria-expanded', 'false');
    panel.hidePopover();
    panel.hidden = true;
    delete panel.dataset.positioned;
    if (restore) anchor.focus({ preventScroll: true });
    return true;
  }

  function place(entry = active) {
    if (!entry) return;
    void computePosition(entry.anchor, entry.panel, {
      strategy: 'fixed',
      placement: entry.name === 'speed' ? 'top-end' : entry.name === 'profile' ? 'bottom-start' : 'bottom-end',
      middleware: [offset(8), flip({ padding: 8 }), shift({ padding: 8 })],
    }).then(({ x, y }) => {
      if (entry !== active) return;
      Object.assign(entry.panel.style, { left: `${x}px`, top: `${y}px` });
      entry.panel.dataset.positioned = '';

    }).catch(() => {});
  }

  function show(name, anchor = trigger(name), focus = true) {
    dismiss();
    const panel = root.querySelector(`#menu-${name}`);
    const entry = { name, anchor, panel };
    active = entry;
    anchor.setAttribute('aria-expanded', 'true');
    panel.hidden = false;
    panel.showPopover();
    entry.dispose = autoUpdate(anchor, panel, () => place(entry));
    if (focus) {
      const first = panel.querySelector('[autofocus]') || panel.querySelector('[aria-pressed="true"], input, button, a[href]') || panel;
      first.focus({ preventScroll: true });
    }
  }

  for (const panel of root.querySelectorAll('.flyout')) {
    panel.tabIndex = -1;
    panel.setAttribute('popover', 'auto');
    panel.addEventListener('toggle', event => {
      if (event.newState === 'closed' && active?.panel === panel && !panel.matches(':popover-open')) dismiss();
    });
  }
  root.addEventListener('pointerdown', event => {
    if (active && !active.panel.contains(event.target) && !active.anchor.contains(event.target)) dismiss();
  });

  return {
    show, dismiss, place,
    current: () => active,
    focusables: () => active && [...active.panel.querySelectorAll('button, input, a[href]')].filter(element => !element.disabled),
  };
}
