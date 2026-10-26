// One requestAnimationFrame loop drives every Viewer, outside React (ADR-0002).

export type Draw = () => void;

const draws = new Set<Draw>();
let frame = 0;

// A Viewer that throws is reported once and keeps its place: the others go on drawing, and the loop never stops.
const failed = new WeakSet<Draw>();

function tick() {
  for (const draw of draws) {
    try {
      draw();
    } catch (error) {
      if (!failed.has(draw)) console.error(error);
      failed.add(draw);
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
