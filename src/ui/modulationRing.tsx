import { createContext, type RefObject, useContext, useEffect, useRef } from 'react';
import type { SynthEngine } from '../engine/synthEngine';
import { keyToNote } from '../input/keyboardLayout';
import { effectiveValue } from '../modulation/destinations';
import { cutoffReach, detuneReach, keyTrackOctaves, lfoCutoffReach, pulseWidthReach, type Reach, resonanceReach, semitoneReach, volumeReach } from '../modulation/reach';
import { PARAMS, type ParamId, type Patch } from '../patch/patch';
import { valueToPosition } from '../patch/taper';
import { addToRenderLoop } from '../viewers/renderLoop';

/**
 * What a knob's modulation ring reads every frame: the engine's Modulation model, the Patch as it is now, and the
 * on-screen piano's octave (Key Track's ring spans its keys).
 */
export const ModulationContext = createContext<{ engine: SynthEngine; patch(): Patch; octave: RefObject<number> } | null>(null);

/** The Effective value can only be heard once the Amp Envelope has risen above this. */
const AUDIBLE = 0.002;

type Range = [number, number];
/** What a knob's rings and dot show at a moment (`modulated`). */
interface Modulated {
  reach: Reach | null;
  envelope?: Range;
  velocity?: Range;
  keyTrack?: Range[];
  now: number | null;
}

/**
 * Where modulation can take a Parameter, and its value at this moment while a Note sounds. Every ring holds still
 * while Notes play (the owner, 2026-10-28): the LFOs' reach (both together when both aim at it); on the Cutoff, the
 * Filter Envelope's sweep, then, greyed and beyond it, all Velocity can add, soft to hard, and all Key Track can
 * add or take away over the on-screen piano's keys and an octave either side. The dot (the Effective Cutoff) runs along them whatever the
 * Note.
 */
function modulated(id: ParamId, patch: Patch, engine: SynthEngine, octave: number): Modulated | null {
  const m = engine.modulationAt();
  const now = m.amp > AUDIBLE ? effectiveValue(id, patch, m) : null;
  if (id === 'cutoff') {
    const lfos = lfoCutoffReach(patch);
    const sweep = cutoffReach(patch);
    const env = sweep?.envelope;
    const top = env ? Math.max(env[0], env[1]) : patch.cutoff; // Velocity only raises the Cutoff: past the sweep's top
    const [lo, hi] = sweep ? [sweep.lo, sweep.hi] : [patch.cutoff, patch.cutoff];
    // Key Track over the piano's keys and an octave either side, below the lowest ring and above the highest: the
    // Demo moves the piano to show most of a part's Notes, not all (Poly Pluck's arpeggio dips below its C4).
    const [down, up] = keyTrackOctaves(patch, keyToNote('KeyA', octave)! - 12, keyToNote('Semicolon', octave)! + 12);
    const keyTrack: Range[] = [...(down < 0 ? [[lo * 2 ** down, lo] as Range] : []), ...(up > 0 ? [[hi, hi * 2 ** up] as Range] : [])];
    if (!lfos && !sweep && !keyTrack.length) return null;
    return {
      reach: lfos,
      envelope: env,
      velocity: patch.velocityCutoff > 0 && hi > top ? [top, hi] : undefined,
      keyTrack: keyTrack.length ? keyTrack : undefined,
      now,
    };
  }
  const reach = LFO_REACH[id]?.(patch);
  return reach ? { reach, now } : null;
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

// A control of the Filter Envelope that a pointer is over, or that has the keyboard focus: its ring is the white one,
// so the blue ring dims. The LFOs' own controls change nothing (the owner, 2026-10-28): the blue ring is already theirs
// alone; nor do Velocity's and Key Track's (the owner, 2026-10-28). No source draws a blue share any more (the owner,
// 2026-10-28: a blue share for Velocity confused).
const WHITE_SOURCES = new Set(['param:filterEnvAmount', 'param:filterAttack', 'param:filterDecay', 'param:filterSustain', 'param:filterRelease']);
const sourceOf = (target: EventTarget | null) =>
  target instanceof Element && WHITE_SOURCES.has(target.closest<HTMLElement>('[data-learn]')?.dataset.learn ?? '');
const attention = { pointed: false, focused: false };
let listening = false;
function listen() {
  if (listening) return;
  listening = true;
  addEventListener('pointerover', (e) => (attention.pointed = sourceOf(e.target)));
  document.addEventListener('pointerleave', () => (attention.pointed = false));
  addEventListener('focusin', (e) => (attention.focused = sourceOf(e.target)));
  addEventListener('focusout', () => (attention.focused = false));
}

/**
 * Each ring, in drawing order (the blue one over the others): its class, whether it is drawn on the knob's own track
 * (or outside the value arc), and the ranges it covers. Every ring is drawn the same way, hidden when it covers nothing.
 */
const RINGS: { className: string; onTrack: boolean; ranges(m: Modulated): Range[] | undefined }[] = [
  { className: 'knob-envelope', onTrack: true, ranges: (m) => m.envelope && [m.envelope] },
  { className: 'knob-envelope knob-velocity', onTrack: true, ranges: (m) => m.velocity && [m.velocity] },
  { className: 'knob-envelope knob-keytrack', onTrack: true, ranges: (m) => m.keyTrack },
  { className: 'knob-ring', onTrack: false, ranges: (m) => (m.reach ? [[m.reach.lo, m.reach.hi]] : undefined) },
];
const BLUE = RINGS.length - 1;

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
 * LFOs can take the Parameter (both together when both aim at it); on the knob's own track, a thin white ring over
 * the Filter Envelope's sweep and grey ones beyond it over what Velocity and Key Track can add; and a dot at
 * its Effective value while a Note sounds, on the knob's own track. Pointing at the Filter Envelope dims the LFOs'
 * ring; the LFOs', Velocity's and Key Track's own controls change nothing on the rings. Drawn by the render loop, outside
 * React (ADR-0002), from the Modulation model (ADR-0003). Reduced motion keeps the rings and drops the moving dot.
 */
export function ModulationRing({ id, centre, radius, trackRadius, dotRadius, arc, point }: Props) {
  const context = useContext(ModulationContext);
  const rings = useRef<(SVGPathElement | null)[]>([]);
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
      const [paths, d] = [rings.current, dot.current];
      if (RINGS.some((_, i) => !paths[i]) || !d) return;
      const now = modulated(id, context.patch(), context.engine, context.octave.current);
      RINGS.forEach((ring, i) => {
        const path = paths[i]!;
        // A range pinned past the dial's end draws nothing (an arc is never shorter than half a degree).
        const seen = (now ? ring.ranges(now) : undefined)?.filter(([from, to]) => Math.abs(position(to) - position(from)) > 0.001);
        path.style.display = seen?.length ? '' : 'none';
        if (seen?.length) path.setAttribute('d', seen.map(([from, to]) => draw.current.arc(position(from), position(to), ring.onTrack ? trackRadius : radius)).join(' '));
      });
      paths[BLUE]!.toggleAttribute('data-dim', attention.pointed || attention.focused);
      const live = now?.now ?? null;
      d.style.display = live === null || still.matches ? 'none' : '';
      if (live !== null) {
        // Always on the knob's own track, where its value arc and the white rings are, whatever moves it (the owner,
        // 2026-10-28): the rings say how far each source reaches, the dot where the value is.
        const [x, y] = draw.current.point(position(live), trackRadius);
        d.setAttribute('cx', x.toFixed(2));
        d.setAttribute('cy', y.toFixed(2));
      }
    });
  }, [context, id, radius, trackRadius]);

  return (
    <>
      {RINGS.map((ring, i) => (
        <path
          key={ring.className}
          ref={(path) => {
            rings.current[i] = path;
          }}
          className={ring.className}
          style={{ display: 'none' }}
        />
      ))}
      <circle ref={dot} className="knob-live" cx={centre} cy={centre} r={dotRadius} style={{ display: 'none' }} />
    </>
  );
}
