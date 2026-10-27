import { useContext, useEffect, useRef } from 'react';
import { GLIDE_OFF, lfos, type Patch } from '../patch/patch';
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
const pitchMoves = (p: Patch) => lfos(p).some((l) => l.destination === 'pitch' && l.amount > 0) || (p.voices === 1 && p.glide > GLIDE_OFF * 1.001);

/** Where a finger presses a key, as a share of its height from the top: low on it (a white key's name permitting). */
const PRESS = 0.75;
/** The dot's radius, ring included (CSS sizes it). */
const RADIUS = 5;

/** How far down a white key its name (C4…) starts, so the dot can stay above it; null when no C is on screen. */
function nameTop(piano: HTMLElement): number | null {
  const name = [...piano.querySelectorAll<HTMLElement>('button span')].find((s) => s.getClientRects().length);
  return name ? name.getBoundingClientRect().top - name.parentElement!.getBoundingClientRect().top : null;
}

/** Where a dot goes for a pitch (fractional between keys), moved sideways by `shift` pixels; null off the visible keys. */
function place(piano: HTMLElement, origin: DOMRect, pitch: number, shift: number) {
  const below = Math.floor(pitch);
  const from = keyBox(piano, below, origin);
  const to = pitch === below ? from : keyBox(piano, below + 1, origin);
  const pressed = keyBox(piano, Math.round(pitch), origin);
  if (!from || !to || !pressed) return null;
  const onBlack = piano.querySelector(`[data-note="${Math.round(pitch)}"]`)?.hasAttribute('data-black') ?? false;
  // On a white key, above its name if the press point would touch it.
  const label = onBlack ? null : nameTop(piano);
  const y = Math.min(PRESS * pressed.height, label === null ? Infinity : label - RADIUS);
  return { x: from.centre + (pitch - below) * (to.centre - from.centre) + shift, y: pressed.top + y, onBlack };
}

/** As many dots as Voices can sound at once. */
const DOTS = 8;

/**
 * Pitch has no knob, so its modulation shows on the piano (issue 21), while there is some: a dot in the modulation
 * colour, ringed dark on a white key and light on a black one, where a finger would press each sounding Note's key,
 * low on it (so higher on a black key). It wobbles with an LFO on Pitch, a black key's width at full Depth, so it
 * stays on its key; a chord's Notes wobble together (the LFOs are shared). The newest Note's dot also slides across
 * the keys through a Glide (one Voice), between two keys when it is between them, and stays through its Release.
 * With reduced motion asked for each dot sits on its Note. Drawn by the render loop, outside React (ADR-0002).
 */
export function PitchMarker() {
  const context = useContext(ModulationContext);
  const dots = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    if (!context) return;
    const still = matchMedia('(prefers-reduced-motion: reduce)');
    let note: number | null = null; // the Note last held, which a Release still sounds
    return addToRenderLoop(() => {
      const els = dots.current;
      const piano = els[0]!.parentElement!;
      const m = context.engine.modulationAt();
      note = m.sounding?.note ?? note;
      const spots: ReturnType<typeof place>[] = [];
      if (m.amp > AUDIBLE && note !== null && pitchMoves(context.patch.current)) {
        const origin = piano.getBoundingClientRect();
        const black = piano.querySelector<HTMLElement>('[data-black]')?.getClientRects()[0]?.width ?? 0;
        const shift = still.matches ? 0 : (m.vibrato * black) / 2;
        const gliding = still.matches ? note : m.pitch - m.vibrato;
        spots.push(place(piano, origin, gliding, shift));
        // A chord's other Notes, with several Voices: every other key lit (one Voice sounds only the newest).
        const others = context.patch.current.voices > 1 ? piano.querySelectorAll<HTMLElement>('[aria-pressed="true"]') : [];
        for (const key of others) {
          const other = Number(key.dataset.note);
          if (other !== Math.round(gliding) && spots.length < DOTS) spots.push(place(piano, origin, other, shift));
        }
      }
      els.forEach((el, i) => {
        const at = spots[i];
        el!.style.display = at ? '' : 'none';
        if (!at) return;
        el!.style.transform = `translate(${at.x}px, ${at.y}px)`;
        el!.toggleAttribute('data-on-black', at.onBlack);
      });
    });
  }, [context]);

  return Array.from({ length: DOTS }, (_, i) => (
    // biome-ignore lint/suspicious/noArrayIndexKey: a fixed set of dots, reused by position
    <span key={i} ref={(el) => void (dots.current[i] = el)} className="pitch-marker" aria-hidden="true" style={{ display: 'none' }} />
  ));
}
