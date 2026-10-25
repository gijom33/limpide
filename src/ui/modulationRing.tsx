import { createContext, useContext, useEffect, useRef, type RefObject } from 'react';
import type { SynthEngine } from '../engine/synthEngine';
import { cutoffReach, pulseWidthReach, type Reach, type Source } from '../modulation/reach';
import { PARAMS, type ParamId, type Patch } from '../patch/patch';
import { valueToPosition } from '../patch/taper';
import { addToRenderLoop } from '../viewers/renderLoop';

/** What a knob's modulation ring reads every frame: the engine's Modulation model and the Patch as it is now. */
export const ModulationContext = createContext<{ engine: SynthEngine; patch: RefObject<Patch> } | null>(null);

/** The Effective value can only be heard once the Amp Envelope has risen above this. */
const AUDIBLE = 0.002;

/** Where modulation takes a Parameter now: its reach, and its value at this moment while a Note sounds. */
function modulated(id: ParamId, patch: Patch, engine: SynthEngine): { reach: Reach; now: number | null } | null {
  const m = engine.modulationAt();
  const sounding = m.amp > AUDIBLE;
  if (id === 'cutoff') {
    const reach = cutoffReach(patch, m.sounding);
    return reach && { reach, now: sounding ? m.cutoff : null };
  }
  if (id === 'pulseWidth' || id === 'osc2PulseWidth') {
    const reach = pulseWidthReach(patch, patch[id]);
    // The LFO swings the width evenly each way around the knob's own value.
    return reach && { reach, now: sounding ? patch[id] + ((reach.hi - reach.lo) / 2) * m.lfo[0] : null };
  }
  return null;
}

// The source a pointer is over, or that has the keyboard focus: its share of every ring is drawn bright.
const SOURCES: Record<string, Source> = {
  'param:lfoAmount': 'lfo', 'param:lfoRate': 'lfo', 'choice:lfoWaveform': 'lfo', 'choice:lfoDestination': 'lfo',
  'param:filterEnvAmount': 'filterEnvelope', 'param:filterAttack': 'filterEnvelope', 'param:filterDecay': 'filterEnvelope',
  'param:filterSustain': 'filterEnvelope', 'param:filterRelease': 'filterEnvelope',
  'param:velocityCutoff': 'velocity', 'param:keyTrack': 'keyTrack',
};
const sourceOf = (target: EventTarget | null) =>
  target instanceof Element ? (SOURCES[target.closest<HTMLElement>('[data-learn]')?.dataset.learn ?? ''] ?? null) : null;
const attention: { pointed: Source | null; focused: Source | null } = { pointed: null, focused: null };
let listening = false;
function listen() {
  if (listening) return;
  listening = true;
  addEventListener('pointerover', (e) => (attention.pointed = sourceOf(e.target)));
  document.addEventListener('pointerleave', () => (attention.pointed = null));
  addEventListener('focusin', (e) => (attention.focused = sourceOf(e.target)));
  addEventListener('focusout', () => (attention.focused = null));
}

/** The Parameters modulation can move, and so the knobs that carry a ring. */
export const MODULATED: ReadonlySet<ParamId> = new Set(['cutoff', 'pulseWidth', 'osc2PulseWidth']);

interface Props {
  id: ParamId;
  centre: number;
  radius: number;
  dotRadius: number;
  /** The arc between two positions (0–1), as the knob draws its own. */
  arc(from: number, to: number, radius: number): string;
  /** A position's point on a circle of this radius. */
  point(position: number, radius: number): [number, number];
}

/**
 * Serum-style modulation on a knob (issue 20): a ring outside the value arc over the range modulation can take the
 * Parameter, and a dot at its Effective value while a Note sounds. Pointing at a source (the LFO, the Filter
 * Envelope, Velocity, Key Track) or focusing it draws its own share bright over a dimmed ring. Drawn by the render
 * loop, outside React (ADR-0002), from the Modulation model (ADR-0003). Reduced motion keeps the ring and drops the
 * moving dot.
 */
export function ModulationRing({ id, centre, radius, dotRadius, arc, point }: Props) {
  const context = useContext(ModulationContext);
  const ring = useRef<SVGPathElement>(null);
  const share = useRef<SVGPathElement>(null);
  const dot = useRef<SVGCircleElement>(null);
  const draw = useRef({ arc, point });
  draw.current = { arc, point };

  useEffect(() => {
    if (!context) return;
    const def = PARAMS[id];
    const position = (v: number) => Math.min(1, Math.max(0, valueToPosition(def, Math.min(def.max, Math.max(def.min, v)))));
    const still = matchMedia('(prefers-reduced-motion: reduce)');
    listen();
    return addToRenderLoop(() => {
      const r = ring.current;
      const s = share.current;
      const d = dot.current;
      if (!r || !s || !d || !context.patch.current) return;
      const now = modulated(id, context.patch.current, context.engine);
      r.style.display = now ? '' : 'none';
      if (now) r.setAttribute('d', draw.current.arc(position(now.reach.lo), position(now.reach.hi), radius));
      const source = attention.pointed ?? attention.focused;
      const part = source && now?.reach.shares[source];
      s.style.display = part ? '' : 'none';
      r.toggleAttribute('data-dim', !!part);
      if (part) {
        s.setAttribute('d', draw.current.arc(position(part[0]), position(part[1]), radius));
        s.dataset.source = source!;
      }
      const live = now?.now ?? null;
      d.style.display = live === null || still.matches ? 'none' : '';
      if (live !== null) {
        const [x, y] = draw.current.point(position(live), radius);
        d.setAttribute('cx', x.toFixed(2));
        d.setAttribute('cy', y.toFixed(2));
      }
    });
  }, [context, id, radius]);

  return (
    <>
      <path ref={ring} className="knob-ring" style={{ display: 'none' }} />
      <path ref={share} className="knob-share" style={{ display: 'none' }} />
      <circle ref={dot} className="knob-live" cx={centre} cy={centre} r={dotRadius} style={{ display: 'none' }} />
    </>
  );
}
