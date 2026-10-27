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

/** A label that stays readable where a trace crosses it: a halo of the Viewer's background first, then the text. */
export function haloText(g: CanvasRenderingContext2D, text: string, x: number, y: number, halo: string) {
  const { lineWidth, strokeStyle, lineJoin } = g;
  g.lineWidth = 3;
  g.lineJoin = 'round';
  g.strokeStyle = halo;
  g.strokeText(text, x, y);
  g.lineWidth = lineWidth;
  g.strokeStyle = strokeStyle;
  g.lineJoin = lineJoin;
  g.fillText(text, x, y);
}
