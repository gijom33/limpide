import { useContext, useEffect, useRef } from 'react';
import { addToRenderLoop } from '../viewers/renderLoop';
import { ModulationContext } from './modulationRing';

/** The pitch can only be heard once the Amp Envelope has risen above this. */
const AUDIBLE = 0.002;

/** A key's centre, from the piano's left edge; null when the key is not on screen (a phone shows fewer). */
function keyCentre(piano: HTMLElement, note: number, left: number): number | null {
  const key = piano.querySelector<HTMLElement>(`[data-note="${note}"]`);
  const r = key?.getClientRects()[0];
  return r ? r.left + r.width / 2 - left : null;
}

/**
 * Pitch has no knob, so its modulation shows on the piano (issue 21): a dot in the modulation colour at the pitch the
 * newest Note sounds at, between two keys when it is between them. It slides across the keys through a Glide and
 * wobbles with an LFO on Pitch. With reduced motion asked for it sits on the Note itself.
 * Drawn by the render loop, outside React (ADR-0002).
 */
export function PitchMarker() {
  const context = useContext(ModulationContext);
  const dot = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!context) return;
    const still = matchMedia('(prefers-reduced-motion: reduce)');
    let note: number | null = null; // the Note last held, which a Release still sounds
    return addToRenderLoop(() => {
      const el = dot.current!;
      const piano = el.parentElement!;
      const m = context.engine.modulationAt();
      note = m.sounding?.note ?? note;
      const pitch = still.matches ? note : m.pitch;
      let x: number | null = null;
      if (m.amp > AUDIBLE && pitch !== null) {
        const left = piano.getBoundingClientRect().left;
        const below = Math.floor(pitch);
        const from = keyCentre(piano, below, left);
        const to = pitch === below ? from : keyCentre(piano, below + 1, left);
        if (from !== null && to !== null) x = from + (pitch - below) * (to - from);
      }
      el.style.display = x === null ? 'none' : '';
      if (x !== null) el.style.transform = `translateX(${x}px)`;
    });
  }, [context]);

  return <span ref={dot} className="pitch-marker" aria-hidden="true" style={{ display: 'none' }} />;
}
