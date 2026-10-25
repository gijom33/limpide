import { useContext, useEffect, useRef } from 'react';
import { GLIDE_OFF, type Patch } from '../patch/patch';
import { addToRenderLoop } from '../viewers/renderLoop';
import { ModulationContext } from './modulationRing';

/** The pitch can only be heard once the Amp Envelope has risen above this. */
const AUDIBLE = 0.002;

/** A key's box, from the piano's top left; null when the key is not on screen (a phone shows fewer). */
function keyBox(piano: HTMLElement, note: number, origin: DOMRect): { centre: number; top: number; height: number } | null {
  const r = piano.querySelector<HTMLElement>(`[data-note="${note}"]`)?.getClientRects()[0];
  return r ? { centre: r.left + r.width / 2 - origin.left, top: r.top - origin.top, height: r.height } : null;
}

/** Whether anything moves the pitch away from the Note: an LFO aimed at Pitch with some Depth, or Glide (one Voice). */
const pitchMoves = (p: Patch) => (p.lfoDestination === 'pitch' && p.lfoAmount > 0) || (p.voices === 1 && p.glide > GLIDE_OFF * 1.001);

/** Where a finger presses a key, as a share of its height from the top: low on it, on a black key and a white one. */
const PRESS = 0.75;

/**
 * Pitch has no knob, so its modulation shows on the piano (issue 21), while there is some: a dot in the modulation
 * colour, ringed dark on a white key and light on a black one, where a finger
 * would press the newest Note's key, low on it (so higher on a black key). It slides across the keys through a Glide,
 * between two keys when it is between them, and wobbles with an LFO on Pitch: a black key's width at full Depth, so
 * it stays on its key. With reduced motion asked for it sits on the Note itself.
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
      let at: { x: number; y: number } | null = null;
      let onBlack = false;
      if (m.amp > AUDIBLE && note !== null && pitchMoves(context.patch.current)) {
        const origin = piano.getBoundingClientRect();
        const gliding = still.matches ? note : m.pitch - m.vibrato;
        const below = Math.floor(gliding);
        const from = keyBox(piano, below, origin);
        const to = gliding === below ? from : keyBox(piano, below + 1, origin);
        const pressed = keyBox(piano, Math.round(gliding), origin);
        onBlack = piano.querySelector(`[data-note="${Math.round(gliding)}"]`)?.hasAttribute('data-black') ?? false;
        const black = piano.querySelector<HTMLElement>('[data-black]')?.getClientRects()[0]?.width ?? 0;
        if (from && to && pressed) {
          const vibrato = still.matches ? 0 : (m.vibrato * black) / 2;
          at = { x: from.centre + (gliding - below) * (to.centre - from.centre) + vibrato, y: pressed.top + PRESS * pressed.height };
        }
      }
      el.style.display = at ? '' : 'none';
      if (at) el.style.transform = `translate(${at.x}px, ${at.y}px)`;
      el.toggleAttribute('data-on-black', onBlack);
    });
  }, [context]);

  return <span ref={dot} className="pitch-marker" aria-hidden="true" style={{ display: 'none' }} />;
}
