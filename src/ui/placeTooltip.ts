interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

const GAP = 8;
const MARGIN = 8;

/** Where a tooltip goes: centred below its control, flipped above if it would run off the bottom, kept on screen. */
export function placeTooltip(trigger: Box, tip: { width: number; height: number }, viewport: { width: number; height: number }) {
  const centred = trigger.left + trigger.width / 2 - tip.width / 2;
  const left = Math.max(MARGIN, Math.min(viewport.width - MARGIN - tip.width, centred));
  const below = trigger.top + trigger.height + GAP;
  if (below + tip.height <= viewport.height - MARGIN) return { left, top: below, placement: 'below' as const };
  return { left, top: trigger.top - GAP - tip.height, placement: 'above' as const };
}
