import { createContext, type RefObject, useContext, useEffect, useRef } from 'react';
import type { SynthEngine } from '../engine/synthEngine';
import { LFO_DETUNE_CENTS, LFO_OSC2_CENTS, LFO_PULSE_WIDTH, lfoOffset, MAX_PULSE, MIN_PULSE } from '../modulation/modulationModel';
import { cutoffReach, detuneReach, pulseWidthReach, type Reach, resonanceReach, type Source, semitoneReach } from '../modulation/reach';
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
  // The LFOs swing these evenly around the knob's own value.
  const at = (reach: Reach | null, now: () => number) => reach && { reach, now: sounding ? now() : null };
  if (id === 'pulseWidth' || id === 'osc2PulseWidth') {
    const room = Math.min(patch[id] - MIN_PULSE, MAX_PULSE - patch[id]);
    return at(pulseWidthReach(patch, patch[id]), () => patch[id] + lfoOffset(patch, 'pulseWidth', LFO_PULSE_WIDTH, m.lfo, room));
  }
  if (id === 'resonance') return at(resonanceReach(patch), () => m.resonance);
  if (id === 'osc2Semitone') return at(semitoneReach(patch), () => patch.osc2Semitone + lfoOffset(patch, 'osc2Pitch', LFO_OSC2_CENTS / 100, m.lfo));
  if (id === 'osc2Detune') return at(detuneReach(patch), () => patch.osc2Detune + lfoOffset(patch, 'detune', LFO_DETUNE_CENTS, m.lfo));
  return null;
}

// The source a pointer is over, or that has the keyboard focus: its share of every ring is drawn bright.
const SOURCES: Record<string, Source> = {
  'param:lfoAmount': 'lfo1', 'param:lfoRate': 'lfo1', 'choice:lfoWaveform': 'lfo1', 'choice:lfoDestination': 'lfo1',
  'param:lfo2Amount': 'lfo2', 'param:lfo2Rate': 'lfo2', 'choice:lfo2Waveform': 'lfo2', 'choice:lfo2Destination': 'lfo2',
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
export const MODULATED: ReadonlySet<ParamId> = new Set(['cutoff', 'resonance', 'pulseWidth', 'osc2PulseWidth', 'osc2Semitone', 'osc2Detune']);

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
 * Parameter, and a dot at its Effective value while a Note sounds. Pointing at a source (either LFO, the Filter
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
