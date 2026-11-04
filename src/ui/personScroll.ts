/** The keys that scroll the page, unless a control takes them. */
const SCROLL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End']);
/** What takes a key, a wheel or a finger for itself, so the page does not scroll: a control, a field. */
const CONTROLS = 'input, textarea, select, [contenteditable], [data-learn], [role="slider"], [role="radiogroup"], [role="radio"], [role="listbox"], [role="menu"]';
const onControl = (e: Event) => e.target instanceof Element && !!e.target.closest(CONTROLS);
/** What takes a finger for itself, so it does not scroll the page: the piano, Bead, a card's handle, a knob (issue 227). */
function takesTouches(target: EventTarget | null) {
  for (let element = target instanceof Element ? target : null; element; element = element.parentElement)
    if (getComputedStyle(element).touchAction === 'none') return true;
  return false;
}

/**
 * Calls `onScroll` when the person scrolls the page themselves (the wheel, a finger, the keys, the scroll bar), never
 * for the page's own scrolling, which fires the same scroll events, nor for a control turned by its wheel, a finger
 * or a key (issue 206, decision 5), nor for a finger on what takes it for itself. The one check of the Tour's and the
 * Demo's following of the page (issue 227).
 */
export function watchPersonScroll(onScroll: () => void) {
  // A knob's wheel is turned in its own listener, which keeps the page from scrolling: it has run by now.
  const onWheel = (e: WheelEvent) => e.defaultPrevented || onScroll();
  let touchedControl = false;
  const onTouchStart = (e: TouchEvent) => {
    touchedControl = onControl(e) || takesTouches(e.target);
  };
  const onTouchMove = () => touchedControl || onScroll();
  const onKey = (e: KeyboardEvent) => SCROLL_KEYS.has(e.key) && !e.defaultPrevented && !onControl(e) && onScroll();
  // Pressed on the page's scroll bar: on the root itself, which no content covers.
  const onPointer = (e: PointerEvent) => e.target === document.documentElement && onScroll();
  addEventListener('wheel', onWheel, { passive: true });
  addEventListener('touchstart', onTouchStart, { passive: true });
  addEventListener('touchmove', onTouchMove, { passive: true });
  addEventListener('keydown', onKey);
  addEventListener('pointerdown', onPointer);
  return () => {
    removeEventListener('wheel', onWheel);
    removeEventListener('touchstart', onTouchStart);
    removeEventListener('touchmove', onTouchMove);
    removeEventListener('keydown', onKey);
    removeEventListener('pointerdown', onPointer);
  };
}
