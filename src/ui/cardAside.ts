/** The room kept between the card and what it stands beside, and between the card and the window's edges. */
const GAP = 12;

/**
 * How far a docked card moves along the bottom of the window, from where it sits (`card`), to cover none of `spans`
 * (what the Tour's card points at, side to side, issue 254): the least, a gap kept from each and from the edges of a
 * window `room` wide; 0 where it covers none already, null where no place along the bottom is clear of them all.
 */
export function cardAside(card: { left: number; width: number }, spans: readonly { left: number; right: number }[], room: number): number | null {
  const covers = (left: number) => spans.some((s) => s.left < left + card.width + GAP && s.right + GAP > left);
  if (!covers(card.left)) return 0;
  // The places the card can take: the window's left edge, and just right of each thing it shows, or just left of it.
  const places = [GAP, room - GAP - card.width, ...spans.flatMap((s) => [s.right + GAP, s.left - GAP - card.width])];
  const clear = places.filter((left) => left >= GAP && left + card.width <= room - GAP && !covers(left));
  if (clear.length === 0) return null;
  const nearest = clear.reduce((best, left) => (Math.abs(left - card.left) < Math.abs(best - card.left) ? left : best));
  return nearest - card.left;
}
