/** Sizes a canvas's backing store to its CSS box at device pixel ratio; returns a context in CSS pixels. */
export function prepareCanvas(canvas: HTMLCanvasElement): { g: CanvasRenderingContext2D; width: number; height: number } {
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
  }
  const g = canvas.getContext('2d')!;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { g, width, height };
}

/** Reads a CSS custom property from the canvas, so Viewers follow the theme. */
export const cssVar = (el: Element, name: string) => getComputedStyle(el).getPropertyValue(name).trim();

/** The width of every Viewer's main curve, in CSS pixels, from the theme (`--curve-w`). */
export const curveWidth = (el: Element) => parseFloat(cssVar(el, '--curve-w')) || 1.75;
