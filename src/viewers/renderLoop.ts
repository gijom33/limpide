// One requestAnimationFrame loop drives every Viewer, outside React (ADR-0002).

export type Draw = () => void;

const draws = new Set<Draw>();
let frame = 0;

function tick() {
  for (const draw of draws) draw();
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
