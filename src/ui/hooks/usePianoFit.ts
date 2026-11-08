import { type CSSProperties, useLayoutEffect, useRef, useState } from 'react';
import { fitPiano, whiteKeys } from '../pianoKeys';

type Fit = ReturnType<typeof fitPiano>;

/**
 * The piano's white keys and their width from what the header leaves the keyboard (issue 154): its box, beside the
 * octave buttons, measured as the window changes. Off up to 860 px, where the piano keeps its 17 keys (one octave, C to C, on a phone). `style` sizes
 * the piano for the white keys it draws in `octave` (fewer near the top), so it always ends against the buttons.
 */
export function usePianoFit(on: boolean, octave: number) {
  const keyboard = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<Fit | null>(null);
  useLayoutEffect(() => {
    const el = keyboard.current;
    if (!on || !el) {
      setFit(null);
      return;
    }
    const measure = () => {
      const octaves = el.querySelector<HTMLElement>('.octave')?.offsetWidth ?? 0;
      const next = fitPiano(el.clientWidth - octaves - (parseFloat(getComputedStyle(el).columnGap) || 0));
      setFit((last) => (last?.whites === next.whites && last.keyWidth === next.keyWidth ? last : next));
    };
    measure();
    const watch = new ResizeObserver(measure);
    watch.observe(el);
    return () => watch.disconnect();
  }, [on]);
  if (!fit) return { keyboard, whites: undefined, style: undefined };
  const drawn = whiteKeys(octave, fit.whites);
  const style = { '--whites': drawn, '--piano-w': `${drawn * fit.keyWidth}px` } as CSSProperties;
  return { keyboard, whites: fit.whites, style };
}
