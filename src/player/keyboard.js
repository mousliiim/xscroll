const SCROLL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown', ' ']);
const REPEATABLE = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'j', 'k']);
const FOCUSABLE = 'button, input, a[href], [tabindex="0"]';

export function handlePlayerKeys(event, { view, commands, floating }) {
  if ((floating && event.currentTarget === window) || event.metaKey || event.ctrlKey || event.altKey) return;
  const target = event.composedPath()[0];
  if (event.key === 'Escape' && view.dismissMenu(true)) {
    event.preventDefault();
    event.stopImmediatePropagation();
    return;
  }
  const menu = view.menuFocusables();
  if (event.key === 'Tab' && (menu || (!floating && !view.shadow.fullscreenElement))) {
    const focusable = menu || [...view.shadow.querySelectorAll(FOCUSABLE)]
      .filter(element => !element.disabled && element.checkVisibility({ visibilityProperty: true }));
    const edge = event.shiftKey ? focusable[0] : focusable.at(-1);
    if (!focusable.includes(target) || target === edge) {
      event.preventDefault();
      (event.shiftKey ? focusable.at(-1) : focusable[0])?.focus();
    }
    return;
  }
  if (event.key !== 'Escape' && target.closest?.('.flyout')) return;
  if (SCROLL_KEYS.has(event.key) && target.closest?.('.thread-scroll, .split')) return;
  if (event.key !== 'Escape' && (target.matches?.('input, textarea, [contenteditable]') ||
      (event.key === ' ' && target.matches?.('button, a')))) return;
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  if (!Object.hasOwn(commands, key)) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  if (!event.repeat || REPEATABLE.has(key)) commands[key](event);
}
