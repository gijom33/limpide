import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { defaultPatch, type LfoNumber, type Patch } from '../patch/patch';
import { createBeadFrame, type Drawn, type Plot, type Reading, type Sized as Rect } from './beadFrame';
import { type Edges, PHONE, THREE_ACROSS, TWO_BY_TWO } from './beadFrame.fixture';
import { lineAt } from './LfoPlot';
import { type Box, crosses, DROP_MIDDLE, type Guide, HEIGHT, RING, WIDTH } from './mascotCling';

// Bead's frame decided over scripted readings of the page (issue 245): the page's layout as the app lays it out (the
// fixture), the time the test's own, a sixtieth of a second a frame, and every roll its lowest, as the mascot spec's
// rides have it. A Note is held throughout: it listens, and plays no funny turn.

const rect = ([left, top, right, bottom]: Edges): Rect => ({ left, top, right, bottom, width: right - left, height: bottom - top });
const scrolled = (r: Rect, y: number): Rect => ({ ...r, top: r.top - y, bottom: r.bottom - y });
const FRAME = 1 / 60;

// Every roll its lowest; a day with no hat.
beforeAll(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0);
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 5, 1));
});
afterAll(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});
/** Where the header folds away on a phone and in 2 × 2, scrolled down past the page's top. */
const FOLDS_PAST = 8;

/** A page to read, at its top; scrolled, everything but the header and the tabs moves up with it. */
interface Script {
  window: { readonly width: number; readonly height: number };
  stacked: boolean;
  /** The header's foot, and the section tabs': at the page's top, and folded once scrolled. */
  header: { top: number; scrolled: number };
  strip: { top: number; scrolled: number };
  sections: readonly { id: string; box: Edges }[];
  plots?: readonly { lfo: number; box: Edges }[];
  text?: readonly Edges[];
  patch?: Partial<Patch>;
  demoPart?: number | null;
  guide?: Guide | null;
  leaving?: boolean;
  /** The controls a guide's selector finds. */
  controls?: Readonly<Record<string, { box: Edges; section: string | null; neighbours: readonly Edges[] }>>;
}

/** The LFOs as the plots draw them: LFO 1 a Sine at half a hertz, half on. */
const ENGINE = { lfoSwingAt: (t: number) => 0.5 * Math.sin(2 * Math.PI * 0.5 * t) };
/** LFO 1 a Sine at half a hertz, half on: one to ride (issue 141). */
const SLOW_SINE: Partial<Patch> = { lfoAmount: 0.5, lfoRate: 0.5 };

function scripted(layout: Script) {
  // Its own copy, for the test to change as it goes.
  const script = { ...layout };
  let t = 100;
  let scrollY = 0;
  const handles = new Map<string, object>();
  const handle = (selector: string) => {
    if (!handles.has(selector)) handles.set(selector, { selector });
    return handles.get(selector)!;
  };
  const bead = createBeadFrame({ clock: () => t, seconds: () => t, stacked: script.stacked });
  const reading = (): Reading => {
    const sections = script.sections.map((s) => ({ id: s.id, box: scrolled(rect(s.box), scrollY) }));
    const folded = scrollY > FOLDS_PAST;
    return {
      sections,
      page: { left: 0, top: -scrollY },
      window: { ...script.window, clientWidth: script.window.width, scrollX: 0, scrollY },
      stacked: script.stacked,
      reduced: false,
      header: folded ? script.header.scrolled : script.header.top,
      strip: folded ? script.strip.scrolled : script.strip.top,
      coverings: [],
      panels: () => [],
      docked: [],
      text: (script.text ?? []).map((b) => scrolled(rect(b), scrollY)),
      pointer: null,
      sound: {
        patch: { ...defaultPatch(), ...script.patch },
        bpm: 120,
        lfo: [0, 0],
        amp: 0.5,
        volume: 1,
        struck: t - 1,
        wave: (lfo, box, x) => lineAt({ engine: ENGINE, lfo, box, x, now: t }),
      },
      asked: { leaving: script.leaving ?? false, demoPart: script.demoPart ?? null, guide: script.guide ?? null },
      dialogOpen: () => false,
      plots: (): Plot[] => (script.plots ?? []).map((p) => ({ lfo: p.lfo as LfoNumber, box: scrolled(rect(p.box), scrollY), tips: [] })),
      body: () => ({ left: 0, right: script.window.width }),
      controlsIn: () => [],
      guided: (guide) => (guide.selector && script.controls?.[guide.selector] ? handle(guide.selector) : null),
      control: (h) => {
        const c = script.controls![(h as { selector: string }).selector];
        return {
          box: scrolled(rect(c.box), scrollY),
          shown: true,
          connected: true,
          target: null,
          section: c.section,
          sectionBox: sections.find((s) => s.id === c.section)?.box ?? null,
          neighbours: () => c.neighbours.map((n) => scrolled(rect(n), scrollY)),
        };
      },
    };
  };
  let last: Drawn | 'gone' | null = null;
  const frame = () => {
    t += FRAME;
    last = bead.step(reading());
    return last;
  };
  return {
    bead,
    script,
    reading,
    frame,
    get now() {
      return t;
    },
    scrollTo: (y: number) => void (scrollY = y),
    /** What it drew last. */
    get drawn() {
      return last as Drawn;
    },
    get last() {
      return last;
    },
    /** Frames for `seconds`, or until `until` holds of what is drawn: each drawing, and whether `until` held. */
    run(seconds: number, until?: (d: Drawn) => boolean): { drawn: Drawn[]; met: boolean } {
      const drawn: Drawn[] = [];
      for (let i = 0; i < seconds / FRAME; i++) {
        const d = frame();
        if (d === null || d === 'gone') return { drawn, met: false };
        drawn.push(d);
        if (until?.(d)) return { drawn, met: true };
      }
      return { drawn, met: false };
    },
  };
}

const THREE = { ...THREE_ACROSS, stacked: false, header: { top: THREE_ACROSS.header, scrolled: THREE_ACROSS.header }, strip: { top: 0, scrolled: 0 } } satisfies Script;
const ON_A_PHONE = { ...PHONE, stacked: true } satisfies Script;
const IN_2_BY_2 = { ...TWO_BY_TWO, stacked: true } satisfies Script;

/** How far its foot is over or under the line LFO 1's plot draws under its middle, at the frame's time. */
const offTheLine = (d: Drawn, plot: Rect) => d.where.foot - (plot.top + lineAt({ engine: ENGINE, lfo: 1, box: plot, x: d.left + DROP_MIDDLE - plot.left, now: d.now }));
const airborne = (m: string) => m === 'falling' || m === 'flying';
/** A section's box, as it is in the window now. */
const edgeOf = (b: ReturnType<typeof scripted>, id: string) => b.reading().sections.find((s) => s.id === id)!.box;

describe("Bead's frame, three across", () => {
  it('stands on its home, the top right section, the Amp (issue 115)', () => {
    const b = scripted(THREE);
    b.run(3);
    const amp = edgeOf(b, 'Amp');
    expect(b.drawn.marks.moving).toBe('standing');
    expect(b.drawn.where.foot).toBe(amp.top);
    expect(b.drawn.left).toBeGreaterThanOrEqual(amp.left);
    expect(b.drawn.left + WIDTH).toBeLessThanOrEqual(amp.right);
  });

  it('through the Demo, each act in turn: conducting, the air guitar, then surfing where an LFO is on (issue 204)', () => {
    const b = scripted({ ...THREE, demoPart: null });
    b.run(2);
    const acts: string[] = [];
    const plot = rect(THREE_ACROSS.plots[0].box);
    for (const part of [1, 2, 3, 4, 5, 6]) {
      b.script.demoPart = part;
      // Part 5, Tremolo Keys, an LFO on: its plot drawing; Part 3, Poly Pluck, none.
      b.script.plots = part === 5 ? [THREE_ACROSS.plots[0]] : [];
      b.run(3);
      acts.push(b.drawn.marks.act);
      if (part === 2) expect(b.drawn.marks.tail).toBe('straight'); // its tail up across it, a guitar's neck
      if (part === 5) {
        // On its board, on the line its plot draws under its middle, a frame behind.
        expect(b.run(5, (d) => d.marks.board === 'on').met).toBe(true);
        const along = b.run(1).drawn;
        expect(along.every((d) => d.marks.board === 'on')).toBe(true);
        for (const d of along) expect(Math.abs(offTheLine(d, plot))).toBeLessThanOrEqual(2);
        // Leaning with the wave: forward going down it, back going up, where it is steep.
        const slope = (d: Drawn) => {
          const y = (x: number) => lineAt({ engine: ENGINE, lfo: 1, box: plot, x, now: d.now });
          const middle = d.left + DROP_MIDDLE - plot.left;
          return y(middle + 4) - y(middle - 4);
        };
        const steep = along.filter((d) => Math.abs(slope(d)) > 1);
        expect(steep.length).toBeGreaterThan(10);
        for (const d of steep) expect(Math.sign(d.pose.tilt)).toBe(Math.sign(slope(d)));
      }
    }
    // Part 3, no LFO on: surfing's turn is skipped, it conducts; the next part plays the air guitar.
    expect(acts).toEqual(['conduct', 'airGuitar', 'conduct', 'airGuitar', 'surf', 'conduct']);
    expect(b.drawn.marks.board).toBe('');
  });

  it('where it rests, over none of the text above its edge (issue 181)', () => {
    // A label written along the Amp's edge, where it would first stand: it stands elsewhere along it.
    const amp = rect(THREE_ACROSS.sections[2].box);
    const label: Edges = [amp.left, amp.top - 20, amp.left + 160, amp.top - 4];
    const b = scripted({ ...THREE, text: [label] });
    b.run(3);
    const rests = b.run(2).drawn.filter((d) => d.marks.moving === 'standing');
    expect(rests.length).toBeGreaterThan(60);
    for (const d of rests) {
      expect(d.where.foot).toBe(amp.top);
      expect(crosses({ left: d.left, right: d.left + WIDTH, top: d.where.foot - HEIGHT, bottom: d.where.foot }, rect(label))).toBe(false);
    }
  });

  it("now and then it rides a slow Sine on LFO 1's plot, on its line, and goes home once its Depth is 0 (issue 141)", () => {
    const b = scripted({ ...THREE, plots: THREE_ACROSS.plots, patch: SLOW_SINE });
    // Its first visit due soonest, 15 seconds in, to the first choice: a ride.
    expect(b.run(20, (d) => d.marks.ride === '1').met).toBe(true);
    expect(b.run(5, (d) => d.marks.moving === 'standing').met).toBe(true);
    const plot = rect(THREE_ACROSS.plots[0].box);
    const along = b.run(1.5).drawn;
    for (const d of along) {
      expect(d.marks.moving).toBe('standing');
      expect(d.marks.board).toBe('on');
      expect(Math.abs(offTheLine(d, plot))).toBeLessThanOrEqual(2);
    }
    const feet = along.map((d) => d.where.foot);
    expect(Math.max(...feet) - Math.min(...feet)).toBeGreaterThan(4);
    // Its Depth to 0: off with a jump home, onto the Amp's edge.
    b.script.patch = {};
    b.script.plots = [];
    b.run(1);
    expect(b.drawn.marks.ride).toBe('');
    expect(b.run(5, (d) => d.marks.moving === 'standing').met).toBe(true);
    expect(b.drawn.where.foot).toBe(edgeOf(b, 'Amp').top);
  });

  it("dropped on LFO 1's plot, a slow Triangle, it rides it; dropped on a Saw's, it lands as anywhere (issue 197)", () => {
    const b = scripted({ ...THREE, plots: THREE_ACROSS.plots, patch: { ...SLOW_SINE, lfoWaveform: 'triangle', lfo2Amount: 0.5, lfo2Rate: 0.5, lfo2Waveform: 'saw' } });
    b.run(3);
    /** Picked up where it stands, carried to over `plot` in a tenth of a second, and let go. */
    const dropOver = (plot: Rect) => {
      const { left, where } = b.drawn;
      const [x, y] = [left + DROP_MIDDLE, where.foot - 8];
      expect(b.bead.pick(x, y, { reduced: false, leaving: false })).toBe(true);
      const to = { x: (plot.left + plot.right) / 2, y: plot.top + 8 };
      for (let i = 1; i <= 6; i++) {
        b.frame();
        b.bead.drag(x + ((to.x - x) * i) / 6, y + ((to.y - y) * i) / 6);
      }
      b.bead.letGo(b.reading());
    };
    dropOver(rect(THREE_ACROSS.plots[0].box));
    expect(b.run(3, (d) => d.marks.ride === '1' && d.marks.moving === 'standing').met).toBe(true);
    dropOver(rect(THREE_ACROSS.plots[1].box));
    b.frame();
    expect(b.drawn.marks.moving).toBe('thrown');
    // Thrown, it lands, with no ride, and is home on the Amp's edge after.
    const after = b.run(25, (d) => d.marks.moving === 'standing' && d.where.foot === edgeOf(b, 'Amp').top);
    expect(after.met).toBe(true);
    expect(after.drawn.some((d) => d.marks.moving === 'landing')).toBe(true);
    expect(after.drawn.every((d) => d.marks.ride === '')).toBe(true);
  });

  it('thrown, it lands on the first edge under it (issue 127)', () => {
    const b = scripted(THREE);
    b.run(3);
    const { left, where } = b.drawn;
    const [x, y] = [left + DROP_MIDDLE, where.foot - 8];
    b.bead.pick(x, y, { reduced: false, leaving: false });
    // Flung to the left and up.
    for (let i = 1; i <= 6; i++) {
      b.frame();
      b.bead.drag(x - 40 * i, y - 10 * i);
    }
    b.bead.letGo(b.reading());
    const flight = b.run(6, (d) => d.marks.moving === 'standing').drawn;
    expect(flight.some((d) => d.marks.moving === 'thrown')).toBe(true);
    expect(b.drawn.marks.moving).toBe('standing');
    expect(b.reading().sections.some((s) => s.box.top === b.drawn.where.foot)).toBe(true);
  });

  it('sent away on its edge it melts; in the air it drips away down the window (issue 115)', () => {
    const melts = scripted(THREE);
    melts.run(3);
    melts.script.leaving = true;
    melts.run(5);
    expect(melts.last).toBe('gone');

    const rains = scripted(THREE);
    rains.run(3);
    const { left, where } = rains.drawn;
    rains.bead.pick(left + DROP_MIDDLE, where.foot - 8, { reduced: false, leaving: false });
    for (let i = 1; i <= 6; i++) {
      rains.frame();
      rains.bead.drag(left + DROP_MIDDLE, where.foot - 8 - 60 * i);
    }
    rains.bead.letGo(rains.reading());
    rains.frame();
    expect(rains.drawn.marks.moving).toBe('thrown');
    rains.script.leaving = true;
    const away = rains.run(5).drawn;
    expect(rains.last).toBe('gone');
    // Falling past the window's foot, never melting on an edge.
    expect(away.at(-1)!.where.foot).toBeGreaterThan(THREE_ACROSS.window.height);
    expect(away.some((d) => d.pose.form !== 'drop')).toBe(false);
  });

  describe('pointing the way in a Tutorial and the Tour (issue 151)', () => {
    /** Its drop as drawn, facing as it does: turned round about a fifth of its width. */
    const dropBox = (d: Drawn): Box => {
      const [from, to] = d.pose.turn < 0 ? [d.left + 0.4 * WIDTH - WIDTH, d.left + 0.4 * WIDTH] : [d.left, d.left + WIDTH];
      return { left: from, right: to, top: d.where.foot - HEIGHT, bottom: d.where.foot };
    };
    const ring = (c: Rect) => ({ left: c.left - RING, right: c.right + RING, top: c.top - RING, bottom: c.bottom + RING });

    it('beside each control in the Tour and a Tutorial, over no label: a little lower under it, else along (issue 181)', () => {
      const b = scripted({ ...THREE, text: THREE_ACROSS.text, controls: THREE_ACROSS.controls });
      b.run(3);
      const text = THREE_ACROSS.text.map(rect);
      // The Tour's Osc 1 Waveform and Cutoff, and the Bass Tutorial's first Steps, in two Sections and the header.
      const steps = [
        '[data-learn="choice:waveform"]', '[data-learn="param:cutoff"]', '[data-learn="param:mixOsc2"]', '[data-learn="choice:osc2Waveform"]',
        '[data-learn="param:resonance"]', 'button[aria-label="Display"]', '[data-learn="param:lfoAmount"]', '[data-learn="param:ampRelease"]',
      ] as const;
      for (const [i, selector] of steps.entries()) {
        b.script.guide = { selector, standIn: null, step: `step ${i}`, made: false, finished: false };
        b.bead.newStep();
        expect(b.run(12, (d) => d.marks.moving === 'clinging').met, selector).toBe(true);
        // Its bounce on arriving, then at rest.
        b.run(1);
        const rests = b.run(1.5).drawn.filter((d) => d.marks.moving === 'clinging' && d.pose.lift <= 0.5);
        expect(rests.length, selector).toBeGreaterThan(30);
        const control = rect(THREE_ACROSS.controls[selector].box);
        for (const d of rests) {
          const drop = dropBox(d);
          expect(text.filter((t) => crosses(t, drop)), selector).toEqual([]);
          // Beside it, within a few pixels of its ring, its tail turned to it, level with it or a little lower.
          const r = ring(control);
          const gap = Math.max(r.left - drop.right, drop.left - r.right);
          expect(gap, selector).toBeGreaterThanOrEqual(0);
          expect(gap, selector).toBeLessThanOrEqual(6);
          const middle = (drop.top + drop.bottom) / 2;
          expect(middle, selector).toBeGreaterThan(control.top);
          expect(middle, selector).toBeLessThan(control.bottom + HEIGHT);
          expect(d.pose.turn, selector).toBe((control.left + control.right) / 2 < (drop.left + drop.right) / 2 ? -1 : 1);
          expect(d.marks.pointing).toBe('yes');
        }
      }
      // Closed: home it hops, onto the Amp's edge.
      b.script.guide = null;
      expect(b.run(8, (d) => d.marks.moving === 'standing').met).toBe(true);
      expect(b.drawn.where.foot).toBe(edgeOf(b, 'Amp').top);
      expect(b.drawn.marks.pointing).toBe('no');
    });
  });
});

/** How long the Demo's scroll to a part's section lasts, eased in and out, as `glideTo` makes it (issue 211). */
const DEMO_SCROLL = 1.4;
const eased = (t: number) => 0.5 - Math.cos(Math.PI * Math.min(1, t)) / 2;
/** Where the Demo's scroll puts a section's top on a phone: the page's scroll padding, the whole header's height and 8 px. */
const SCROLL_PADDING = PHONE.header.top + 8;

describe("Bead's frame, on a phone and in 2 × 2", () => {
  for (const [size, layout, to] of [
    // On a phone, standing on the Filter's edge, the Amp's top to the page's scroll padding, under the whole header; in
    // 2 × 2 at 690 × 640, hovering with no edge in view, the least scroll that shows the LFO & Envelopes whole.
    ['a 375 px phone', ON_A_PHONE, PHONE.sections[2].box[1] - SCROLL_PADDING],
    ['2 × 2', { ...IN_2_BY_2, window: { width: 690, height: 640 } }, TWO_BY_TWO.sections[3].box[3] - 640],
  ] as const) {
    it(`${size}: through the Demo's scroll to a part's section, it falls or flies in view, landing before the page stops (issue 211)`, () => {
      const b = scripted({ ...layout, demoPart: 1 });
      b.run(3);
      expect(b.drawn.marks.moving).toMatch(/^(standing|hovering)$/);
      // The page glides to the part's section, frame by frame; each frame, whether it is still moving, what Bead does,
      // and whether its drop is in the window.
      const seen: { scrolling: boolean; moving: string; inView: boolean }[] = [];
      const start = b.now;
      for (let i = 0; i < 4 / FRAME; i++) {
        const along = (b.now - start) / DEMO_SCROLL;
        b.scrollTo(to * eased(along));
        const d = b.frame() as Drawn;
        seen.push({ scrolling: along < 1, moving: d.marks.moving, inView: d.where.foot - HEIGHT >= 0 && d.where.foot <= layout.window.height + 1 });
      }
      // Its falls and flights that start while the page scrolls, each to the frame it lands.
      const moves = seen.flatMap((f, i) => (f.scrolling && airborne(f.moving) && !airborne(seen[i - 1]?.moving ?? '') ? [i] : []));
      const told = seen.map((f) => `${f.scrolling ? '' : '|'}${f.moving[0]}`).join('');
      expect(moves.length, told).toBeGreaterThan(0);
      for (const from of moves) {
        const end = seen.findIndex((f, j) => j > from && !airborne(f.moving));
        expect(end, told).toBeGreaterThan(from);
        expect(seen.slice(from, end).every((f) => f.inView), told).toBe(true);
        expect(seen[end].scrolling, told).toBe(true);
      }
    });
  }

  for (const [size, layout] of [
    ['on a phone', ON_A_PHONE],
    ['in 2 × 2', IN_2_BY_2],
  ] as const) {
    it(`${size}, now and then it rides a slow Sine on LFO 1's plot in view, on its line, and goes back to its edge after (issue 197)`, () => {
      const b = scripted({ ...layout, plots: layout.plots, patch: SLOW_SINE });
      // LFO 1's plot in view, 400 px down the window, a little under its section's top edge.
      b.scrollTo(layout.plots[0].box[1] - 400);
      b.run(3);
      const edge = () => edgeOf(b, 'LFO & Envelopes').top;
      expect(b.drawn.marks.moving).toBe('standing');
      expect(b.drawn.where.foot).toBe(edge());
      // Its first ride due soonest, 15 seconds in.
      expect(b.run(20, (d) => d.marks.ride === '1').met).toBe(true);
      expect(b.run(5, (d) => d.marks.moving === 'standing').met).toBe(true);
      const plot = b.reading().plots().find((p) => p.lfo === 1)!.box;
      const along = b.run(1.5).drawn;
      for (const d of along) {
        expect(d.marks.moving).toBe('standing');
        expect(Math.abs(offTheLine(d, plot))).toBeLessThanOrEqual(2);
      }
      const feet = along.map((d) => d.where.foot);
      expect(Math.max(...feet) - Math.min(...feet)).toBeGreaterThan(4);
      // Its ride over (the shortest, 8 seconds), back to its edge.
      expect(b.run(15, (d) => d.marks.ride === '').met).toBe(true);
      expect(b.run(5, (d) => d.marks.moving === 'standing').met).toBe(true);
      expect(b.drawn.where.foot).toBe(edge());
    });
  }

  it('on a phone, sent away hovering under the tabs, it drips away down the window (issue 142)', () => {
    // A short window scrolled to the LFO & Envelopes' foot: no edge in view, it hovers.
    const b = scripted({ ...ON_A_PHONE, window: { width: 375, height: 300 } });
    b.scrollTo(PHONE.sections[3].box[3] - 300);
    expect(b.run(5, (d) => d.marks.moving === 'hovering').met).toBe(true);
    b.script.leaving = true;
    const away = b.run(5).drawn;
    expect(b.last).toBe('gone');
    expect(away.at(-1)!.where.foot).toBeGreaterThan(300);
    expect(away.some((d) => d.pose.form !== 'drop')).toBe(false);
  });
});
