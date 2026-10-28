import { createContext, type RefObject, useContext, useEffect, useRef } from 'react';
import type { SynthEngine } from '../engine/synthEngine';
import { effectiveValue } from '../modulation/destinations';
import { cutoffReach, detuneReach, lfoCutoffReach, pulseWidthReach, type Reach, resonanceReach, type Source, semitoneReach, volumeReach } from '../modulation/reach';
import { PARAMS, type ParamId, type Patch } from '../patch/patch';
import { valueToPosition } from '../patch/taper';
import { addToRenderLoop } from '../viewers/renderLoop';

/** What a knob's modulation ring reads every frame: the engine's Modulation model and the Patch as it is now. */
export const ModulationContext = createContext<{ engine: SynthEngine; patch: RefObject<Patch> } | null>(null);

/** The Effective value can only be heard once the Amp Envelope has risen above this. */
const AUDIBLE = 0.002;

/**
 * Where modulation takes a Parameter now: the LFOs' reach (both together when both aim at it), the Filter
 * Envelope's on the Cutoff, every source's share (for pointing at one), and its value at this moment while a Note
 * sounds.
 */
function modulated(id: ParamId, patch: Patch, engine: SynthEngine): { reach: Reach | null; envelope?: [number, number]; shares: Reach['shares']; now: number | null } | null {
  const m = engine.modulationAt();
  const now = m.amp > AUDIBLE ? effectiveValue(id, patch, m) : null;
  if (id === 'cutoff') {
    // The Note heard, held or in its Release: Velocity and Key Track hold the Cutoff where it put them until it has
    // faded.
    const heard = m.sounding ?? (now === null ? null : m.played);
    const all = cutoffReach(patch, heard);
    if (!all) return null;
    // A source's shift for the Note heard, as a ratio (each share is the knob's value and that shift's end: their
    // product over the value squared is the shift's ratio).
    const shift = (sources: readonly Source[]) =>
      heard
        ? sources.reduce((ratio, source) => {
            const share = all.shares[source];
            return share ? (ratio * share[0] * share[1]) / patch.cutoff ** 2 : ratio;
          }, 1)
        : 1;
    // The white ring holds still (the owner, 2026-10-28): it spans the Filter Envelope's sweep and all Velocity can
    // add to it, soft to hard, so the dot (the Effective Cutoff) runs along it whatever the Note's Velocity. Only Key
    // Track, the key's own pitch, moves it. The blue ring, the LFOs' swing, goes where Velocity and Key Track take it.
    const lfos = lfoCutoffReach(patch);
    const sweep = all.shares.filterEnvelope && cutoffReach({ ...patch, lfoAmount: 0, lfo2Amount: 0, keyTrack: 0 }, null);
    const byKey = shift(['keyTrack']);
    const byNote = shift(['velocity', 'keyTrack']);
    return {
      reach: lfos && { ...lfos, lo: lfos.lo * byNote, hi: lfos.hi * byNote },
      envelope: sweep ? [sweep.lo * byKey, sweep.hi * byKey] : undefined,
      shares: all.shares,
      now,
    };
  }
  const reach = LFO_REACH[id]?.(patch);
  return reach ? { reach, shares: reach.shares, now } : null;
}

/** The other ring-carrying knobs' reach: the LFOs swing them evenly around the knob's own value (Volume, down from it). */
const LFO_REACH: Partial<Record<ParamId, (patch: Patch) => Reach | null>> = {
  pulseWidth: (p) => pulseWidthReach(p, p.pulseWidth),
  osc2PulseWidth: (p) => pulseWidthReach(p, p.osc2PulseWidth),
  resonance: resonanceReach,
  volume: volumeReach,
  osc2Semitone: semitoneReach,
  osc2Detune: detuneReach,
};

// The source a pointer is over, or that has the keyboard focus: its share of every ring is drawn bright. Not the
// LFOs' controls (the owner, 2026-10-28): the blue ring is already theirs alone.
const SOURCES: Record<string, Source> = {
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
export const MODULATED: ReadonlySet<ParamId> = new Set(['cutoff', 'resonance', 'pulseWidth', 'osc2PulseWidth', 'osc2Semitone', 'osc2Detune', 'volume']);

interface Props {
  id: ParamId;
  centre: number;
  radius: number;
  /** The radius of the knob's own track (its groove and value arc), which the Filter Envelope's ring is drawn on. */
  trackRadius: number;
  dotRadius: number;
  /** The arc between two positions (0–1), as the knob draws its own. */
  arc(from: number, to: number, radius: number): string;
  /** A position's point on a circle of this radius. */
  point(position: number, radius: number): [number, number];
}

/**
 * Serum-style modulation on a knob (issue 20, then issue 63): a blue ring outside the value arc over the range the
 * LFOs can take the Parameter (both together when both aim at it), a thin white ring on the knob's own track over
 * the Filter Envelope's, and a dot at its Effective value while a Note sounds. Pointing at Velocity or Key Track, or
 * focusing it, draws its share bright over the dimmed rings; pointing at the Filter Envelope dims the LFOs' ring.
 * The LFOs' own controls change nothing on the rings. Drawn by the render loop, outside React (ADR-0002), from the
 * Modulation model (ADR-0003). Reduced motion keeps the rings and drops the moving dot.
 */
export function ModulationRing({ id, centre, radius, trackRadius, dotRadius, arc, point }: Props) {
  const context = useContext(ModulationContext);
  const ring = useRef<SVGPathElement>(null);
  const envelope = useRef<SVGPathElement>(null);
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
      const e = envelope.current;
      const s = share.current;
      const d = dot.current;
      if (!r || !e || !s || !d || !context.patch.current) return;
      const now = modulated(id, context.patch.current, context.engine);
      const reach = now?.reach;
      r.style.display = reach ? '' : 'none';
      if (reach) r.setAttribute('d', draw.current.arc(position(reach.lo), position(reach.hi), radius));
      const env = now?.envelope;
      e.style.display = env ? '' : 'none';
      if (env) e.setAttribute('d', draw.current.arc(position(env[0]), position(env[1]), trackRadius));
      const source = attention.pointed ?? attention.focused;
      const part = source && source !== 'filterEnvelope' && now?.shares[source];
      s.style.display = part ? '' : 'none';
      r.toggleAttribute('data-dim', !!part || source === 'filterEnvelope');
      e.toggleAttribute('data-dim', !!source && source !== 'filterEnvelope');
      if (part) {
        s.setAttribute('d', draw.current.arc(position(part[0]), position(part[1]), radius));
        s.dataset.source = source!;
      }
      // The dot rides a ring: with neither (only Velocity or Key Track moving the Cutoff, as in Tremolo Keys), none.
      const live = reach || env ? (now?.now ?? null) : null;
      d.style.display = live === null || still.matches ? 'none' : '';
      if (live !== null) {
        // On the blue ring, or on the white one when the Filter Envelope alone moves the Cutoff.
        const [x, y] = draw.current.point(position(live), reach ? radius : trackRadius);
        d.setAttribute('cx', x.toFixed(2));
        d.setAttribute('cy', y.toFixed(2));
      }
    });
  }, [context, id, radius, trackRadius]);

  return (
    <>
      <path ref={envelope} className="knob-envelope" style={{ display: 'none' }} />
      <path ref={ring} className="knob-ring" style={{ display: 'none' }} />
      <path ref={share} className="knob-share" style={{ display: 'none' }} />
      <circle ref={dot} className="knob-live" cx={centre} cy={centre} r={dotRadius} style={{ display: 'none' }} />
    </>
  );
}
