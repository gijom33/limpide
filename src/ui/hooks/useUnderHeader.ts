import { useLayoutEffect, useRef } from 'react';

/** The room between the header's foot and a panel opened from it, as the Display and Patches panels have. */
const GAP = 6;

/**
 * One rule for where a header panel opens (issue 188, decision 1): under the header, as Display's does, whichever row
 * its button stands in, so it never covers the header's other buttons or its keys. The panel keeps its side along its
 * button; its top is set while it is open, measured from the header's foot, and again whenever the header's height
 * changes.
 */
export function useUnderHeader<T extends HTMLElement>(open: boolean) {
  const panel = useRef<T>(null);
  useLayoutEffect(() => {
    const el = panel.current;
    const header = el?.closest('header');
    if (!open || !el || !header) return;
    const place = () => {
      const from = el.offsetParent ?? header;
      el.style.top = `${header.getBoundingClientRect().bottom - from.getBoundingClientRect().top + GAP}px`;
    };
    place();
    const watch = new ResizeObserver(place);
    watch.observe(header);
    return () => watch.disconnect();
  }, [open]);
  return panel;
}
