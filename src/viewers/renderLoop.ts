// One requestAnimationFrame loop drives every Viewer, outside React (ADR-0002).

/** What a draw hands back to write to the page, once every draw of the frame has read it (issue 221). */
export type Write = () => void;
/**
 * A Viewer's frame: it reads what it needs of the page (sizes, boxes, colours) and may draw on its canvas, then hands
 * back its writes to the page (attributes, styles), if any. Every draw runs before any write, so the frame's reads all
 * find the page as the last frame left it: a read after a write makes the browser work out the page's styles again.
 */
export type Draw = () => Write | undefined;

/**
 * Writes each of `next`'s values that differs from what `last` holds, by `write`, so a steady picture writes nothing,
 * frame after frame (issue 257). `last` is what the page shows: a record of the last frame's values, or the page itself
 * (a canvas's dataset).
 */
export function writeChanged<Values extends Record<string, string | undefined>>(
  last: Readonly<Partial<Record<keyof Values, string>>>,
  next: Values,
  write: (key: keyof Values & string, value: Values[keyof Values]) => void,
) {
  for (const [key, value] of Object.entries(next) as [keyof Values & string, Values[keyof Values]][])
    if (last[key] !== value) write(key, value);
}

const draws = new Set<Draw>();
let frame = 0;

// A Viewer that throws is reported once and keeps its place: the others go on drawing, and the loop never stops.
const failed = new WeakSet<Draw>();
function report(draw: Draw, error: unknown) {
  if (!failed.has(draw)) console.error(error);
  failed.add(draw);
}

function tick() {
  const writes: [Draw, Write][] = [];
  for (const draw of draws) {
    try {
      const write = draw();
      if (write) writes.push([draw, write]);
    } catch (error) {
      report(draw, error);
    }
  }
  for (const [draw, write] of writes) {
    try {
      write();
    } catch (error) {
      report(draw, error);
    }
  }
  frame = draws.size ? requestAnimationFrame(tick) : 0;
}

/** Registers a Viewer's draw function; returns an unregister function. */
export function addToRenderLoop(draw: Draw): () => void {
  draws.add(draw);
  if (!frame) frame = requestAnimationFrame(tick);
  return () => {
    draws.delete(draw);
  };
}
