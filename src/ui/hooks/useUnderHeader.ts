import { useLayoutEffect, useState } from 'react';

/** The room between the header's foot and a panel opened from it, as the Display and Patches panels have. */
const GAP = 6;

/**
 * One rule for where a header panel opens (issue 188, decision 1): under the header, as Display's does, whichever row
 * its button stands in, so it never covers the header's other buttons or its keys. The panel keeps its side along its
 * button; its top is measured from the header's foot while it is shown, and again whenever the header's height changes
 * or the window's size does (a turn of a tablet moves the button's row). Returns the panel's ref: a panel shown again
 * while still open, as a narrow screen's Tempo is after a turn to a wide layout and back, is placed afresh.
 */
export function useUnderHeader<T extends HTMLElement>() {
  const [panel, setPanel] = useState<T | null>(null);
  useLayoutEffect(() => {
    const header = panel?.closest('header');
    if (!panel || !header) return;
    const place = () => {
      const from = panel.offsetParent ?? header;
      panel.style.top = `${header.getBoundingClientRect().bottom - from.getBoundingClientRect().top + GAP}px`;
    };
    place();
    const watch = new ResizeObserver(place);
    watch.observe(header);
    window.addEventListener('resize', place);
    return () => {
      watch.disconnect();
      window.removeEventListener('resize', place);
    };
  }, [panel]);
  return setPanel;
}
