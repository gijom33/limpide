import { watchPersonScroll } from './personScroll';

/**
 * How long the Demo's scroll to a part's section lasts, in milliseconds (issue 211): long enough that Bead's fall or
 * flight between two sections, measured at up to about 1.25 s and starting once the scroll has carried its edge away,
 * lands before the page stops; under a second and a half, so the part's change still meets the eye as it happens. The
 * browser's own smooth scroll, which the section strip's taps keep, is over in a fifth to half a second.
 */
export const DEMO_SCROLL_MS = 1400;

/** Eased in and out: slow to leave, slow to arrive, as the browser's smooth scroll. */
const ease = (t: number) => 0.5 - Math.cos(Math.PI * t) / 2;

/**
 * Scrolls the page to `top` over `ms`, frame by frame. The person's own scroll (`watchPersonScroll`), or any other
 * scroll of the page meanwhile, stops it at once, where it is. `onEnd` is called once it stops, arrived or not. Returns
 * a stop of its own.
 */
export function glideTo(top: number, ms: number, onEnd: () => void): () => void {
  const from = scrollY;
  let start: number | null = null;
  // Where it last put the page, as the browser rounded it.
  let written = from;
  let frame = 0;
  let over = false;
  const stop = () => {
    if (over) return;
    over = true;
    cancelAnimationFrame(frame);
    unwatch();
    onEnd();
  };
  const unwatch = watchPersonScroll(stop);
  const step = (now: number) => {
    // Scrolled meanwhile by something else: it gives way.
    if (Math.abs(scrollY - written) > 2) return stop();
    start ??= now;
    const t = Math.min(1, (now - start) / ms);
    const end = Math.max(0, Math.min(top, document.documentElement.scrollHeight - innerHeight));
    scrollTo({ top: from + (end - from) * ease(t), behavior: 'instant' });
    written = scrollY;
    if (t >= 1) stop();
    else frame = requestAnimationFrame(step);
  };
  frame = requestAnimationFrame(step);
  return stop;
}
