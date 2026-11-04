import { type GeekNote, scopeReadout } from '../music/geek';
import { canvasInputs, cssVar, curveWidth, haloText, prepareCanvas } from './canvas';
import { createCycleLock } from './cycleLock';
import { createFreezeLatch } from './freezeLatch';
import { createGlow, glows } from './glow';
import { createGuideGlide } from './guides';
import { createRest } from './rest';
import { scopeScale } from './scopeScale';
import { scopeWindow } from './scopeWindow';
import type { ViewSettings } from './viewSettings';

// LIMITING stays up this long after the last sample past the limiter's knee, so a brief one can be read.
const LIMITING_HOLD_MS = 800;
// Two drawn points per pixel keeps sharp corners (a saw's drop, a pulse's edges) crisp.
const POINTS_PER_PIXEL = 2;
// The colours a Scope draws in, compared at rest.
const COLOURS = ['--grid', '--muted', '--danger', '--text', '--trace', '--bg', '--curve-w'];

/**
 * A Scope of one Tap, Cycle Locked to the Note's fundamental so a steady Note stands still, drawing the newest sound.
 * Every Scope shares the same scale (scopeScale), so heights compare directly from stage to stage; peaks beyond
 * ±1 are drawn compressed into the margin, never cut flat.
 */
export function createScope(
  canvas: HTMLCanvasElement,
  analyser: AnalyserNode,
  view: () => ViewSettings,
  {
    fundamental,
    fundamentalAt,
    now,
    limiting,
    newestNote = () => null,
  }: {
    /** The newest Note's frequency, held still through vibrato: how many samples the cycles shown take, and the period written. */
    fundamental: () => number;
    /** The pitch the engine plays at an audio clock time, which Cycle Lock follows across the buffer (issue 180). */
    fundamentalAt: (time: number) => number;
    /** The audio clock, which the Tap's newest sample was heard at. */
    now: () => number;
    /** On the Amp Scope: whether the safety limiter is bending the sound right now (all Voices), shown as LIMITING. */
    limiting?: () => boolean;
    /** The newest Note played (null before any), for the Synth Geek Layer's period: A4's until one is (issue 170). */
    newestNote?: () => GeekNote;
  },
) {
  const samples = new Float32Array(analyser.fftSize);
  let limitedAt = -Infinity;
  const sampleRate = analyser.context.sampleRate;
  const lock = createCycleLock();
  // While frozen, lock to the Note the frozen samples belong to, not to a Note played since, and to their moment.
  const frozenFundamental = createFreezeLatch<number>();
  const frozenEnd = createFreezeLatch<number>();
  // The traces drawn last, for the Glow (issue 180).
  const glow = createGlow<Float32Array>();
  let snapshotToken: number | null = null;
  let snapshotTrace: Float32Array | null = null;
  // The Guides at the Mixer's level, held while frozen like the Note, so they belong to the frozen trace.
  const frozenGuides = createFreezeLatch<number>();
  const guideGlide = createGuideGlide();
  const still = matchMedia('(prefers-reduced-motion: reduce)');
  const rest = createRest();

  /** `silent`: the Tap has been silent long enough for the Glow's traces of sound to fade (issue 214). */
  return function draw(silent: boolean) {
    const { frozen } = view().viewer;
    const f = frozenFundamental(frozen, fundamental);
    // Guides at the level the Mixer sends (issue 159), on every Scope: inside them the Filter only removed energy;
    // beyond them (faintly shaded) Resonance added a peak. They glide as the Mixer's faders move.
    const guideLevel = guideGlide(frozenGuides(frozen, () => view().guideLevel), performance.now(), still.matches);
    // LIMITING: only where the limiter sits (after the Amp), only while it is actually bending the sound.
    if (limiting && !frozen && limiting()) limitedAt = performance.now();
    const limited = !!limiting && performance.now() - limitedAt < LIMITING_HOLD_MS;
    // The Synth Geek Layer (issue 170): the period and frequency of the fundamental held still.
    const period = view().overlays.geek ? scopeReadout(f, newestNote()) : '';
    // A silent Scope rests once drawn, until something it draws changes (issue 214): the trace is flat whatever the Note.
    const settings = view();
    const inputs = [
      ...canvasInputs(canvas, COLOURS),
      settings.cycles, glows(settings.glow, 'scope'), settings.overlays.guides, settings.viewer.snapshot, frozen, guideLevel, limited, period,
    ];
    if (rest(silent, inputs)) return;

    if (!frozen) analyser.getFloatTimeDomainData(samples);
    const { g, width, height } = prepareCanvas(canvas);
    g.clearRect(0, 0, width, height);

    const { length: windowLength, cycles } = scopeWindow(samples.length, sampleRate, f, view().cycles);
    const points = Math.max(2, Math.min(Math.floor(windowLength), Math.ceil(width * POINTS_PER_PIXEL)));
    const { trace } = lock({ samples, sampleRate, end: frozenEnd(frozen, now), frequencyAt: fundamentalAt, cycles, points });

    // Snapshot: keep the Cycle Locked trace from the moment it was taken. Drawn across the same width, it
    // compares the shape per cycle even if a different Note is playing now.
    const { snapshot } = view().viewer;
    if (snapshot !== snapshotToken) {
      snapshotToken = snapshot;
      snapshotTrace = snapshot === null ? null : trace;
    }
    canvas.dataset.snapshot = String(snapshotTrace !== null);

    const { yOf } = scopeScale(height);

    g.strokeStyle = cssVar(canvas, '--grid');
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(0, height / 2);
    g.lineTo(width, height / 2);
    g.stroke();

    canvas.dataset.guides = guideLevel.toFixed(3);
    if (view().overlays.guides) {
      g.fillStyle = cssVar(canvas, '--muted');
      g.globalAlpha = 0.08;
      g.fillRect(0, 0, width, yOf(guideLevel));
      g.fillRect(0, yOf(-guideLevel), width, height - yOf(-guideLevel));
      g.globalAlpha = 1;
      g.setLineDash([4, 4]);
      g.strokeStyle = cssVar(canvas, '--muted');
      g.beginPath();
      for (const v of [guideLevel, -guideLevel]) {
        g.moveTo(0, yOf(v));
        g.lineTo(width, yOf(v));
      }
      g.stroke();
      g.setLineDash([]);
    }

    if (limiting) {
      canvas.dataset.limiting = String(limited);
      if (limited) {
        g.font = '600 10px system-ui, sans-serif';
        g.fillStyle = cssVar(canvas, '--danger');
        g.textAlign = 'right';
        g.fillText('LIMITING', width - 6, 13);
        g.textAlign = 'left';
      }
    }

    const stroke = (values: Float32Array) => {
      g.beginPath();
      values.forEach((v, i) => {
        const x = (i / (values.length - 1)) * width;
        if (i === 0) g.moveTo(x, yOf(v));
        else g.lineTo(x, yOf(v));
      });
      g.stroke();
    };

    if (snapshotTrace) {
      g.globalAlpha = 0.4;
      g.strokeStyle = cssVar(canvas, '--text');
      g.lineWidth = 1;
      stroke(snapshotTrace);
      g.globalAlpha = 1;
    }

    const colour = cssVar(canvas, '--trace');
    const past = glow({ on: glows(view().glow, 'scope'), frozen, now: () => performance.now(), newest: trace });
    g.strokeStyle = colour;
    g.lineWidth = curveWidth(canvas);
    for (const { value, alpha } of past) {
      g.globalAlpha = alpha;
      stroke(value);
    }
    g.globalAlpha = 1;
    canvas.dataset.glow = String(past.length);

    // Shade between the trace and zero, like the Spectrums' fill: the waveform's positive and negative halves.
    g.fillStyle = colour;
    g.globalAlpha = 0.16;
    g.beginPath();
    g.moveTo(0, yOf(0));
    trace.forEach((v, i) => g.lineTo((i / (trace.length - 1)) * width, yOf(v)));
    g.lineTo(width, yOf(0));
    g.closePath();
    g.fill();
    g.globalAlpha = 1;

    g.strokeStyle = colour;
    g.lineWidth = curveWidth(canvas);
    stroke(trace);

    // The Synth Geek Layer's period, top left, over the trace on a halo; LIMITING has the top right.
    canvas.dataset.period = period;
    if (period) {
      g.font = '10px system-ui, sans-serif';
      g.fillStyle = cssVar(canvas, '--muted');
      g.textAlign = 'left';
      haloText(g, period, 6, 13, cssVar(canvas, '--bg'));
    }
  };
}
