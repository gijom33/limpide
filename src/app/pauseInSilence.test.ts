import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { pauseInSilence } from './pauseInSilence';

/** A stand-in AudioContext, running; suspend and resume change its state as a browser's do. */
function fakeContext({ resumes = true } = {}) {
  const ctx = new EventTarget() as EventTarget & { state: AudioContextState; suspend(): Promise<void>; resume(): Promise<void> };
  ctx.state = 'running';
  const set = (state: AudioContextState) => {
    ctx.state = state;
    ctx.dispatchEvent(new Event('statechange'));
  };
  ctx.suspend = vi.fn(async () => set('suspended'));
  ctx.resume = vi.fn(async () => (resumes ? set('running') : undefined));
  return ctx;
}

/** A stand-in engine: its clock, from when it is quiet, its pause, and a Note that records whether it was woken first. */
function fakeEngine() {
  const engine = {
    clock: 10,
    quiet: -Infinity,
    isPaused: false,
    played: [] as { note: number; paused: boolean }[],
    now: () => engine.clock,
    quietFrom: () => engine.quiet,
    pause: vi.fn(() => void (engine.isPaused = true)),
    wake: vi.fn(() => void (engine.isPaused = false)),
    paused: () => engine.isPaused,
    noteOn: (note: number) => void engine.played.push({ note, paused: engine.isPaused }),
    pitchChange: vi.fn(),
    setBend: vi.fn(),
    setPressure: vi.fn(),
    noteOff: vi.fn(),
    release: vi.fn(),
    silence: vi.fn(),
    applyPatch: vi.fn(),
    setTempo: vi.fn(),
  };
  return engine;
}

const flush = () => vi.advanceTimersByTimeAsync(0);

describe('pauseInSilence (issue 216)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const setUp = (options: { busy?: () => boolean; allowed?: boolean; resumes?: boolean } = {}) => {
    const ctx = fakeContext({ resumes: options.resumes });
    const engine = fakeEngine();
    const page = new EventTarget();
    const stop = pauseInSilence({ ctx, engine, page, busy: options.busy ?? (() => false), allowed: options.allowed ?? true, after: 30, wall: () => Date.now() / 1000 });
    return { ctx, engine, page, stop };
  };

  it('pauses the sound once nothing has sounded for the whole wait, and not before', async () => {
    const { ctx, engine } = setUp();
    await vi.advanceTimersByTimeAsync(29_000);
    expect(ctx.suspend).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(2_000);
    expect(engine.pause).toHaveBeenCalledTimes(1);
    expect(ctx.suspend).toHaveBeenCalledTimes(1);
    expect(ctx.state).toBe('suspended');
  });

  it('waits the whole time again after a Voice has sounded', async () => {
    const { ctx, engine } = setUp();
    engine.quiet = 25; // released, fading until 15 s from now
    await vi.advanceTimersByTimeAsync(20_000);
    engine.clock = 30;
    await vi.advanceTimersByTimeAsync(20_000);
    expect(ctx.suspend).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(12_000);
    expect(ctx.suspend).toHaveBeenCalledTimes(1);
  });

  it('never pauses while something plays or follows a clock, where the browser wants a tap to resume, or while the browser holds the sound', async () => {
    let busy = true;
    const playing = setUp({ busy: () => busy });
    await vi.advanceTimersByTimeAsync(60_000);
    expect(playing.ctx.suspend).not.toHaveBeenCalled();
    busy = false;
    await vi.advanceTimersByTimeAsync(31_000);
    expect(playing.ctx.suspend).toHaveBeenCalledTimes(1);

    const iPhone = setUp({ allowed: false });
    await vi.advanceTimersByTimeAsync(60_000);
    expect(iPhone.ctx.suspend).not.toHaveBeenCalled();

    const held = setUp();
    held.ctx.state = 'suspended';
    await vi.advanceTimersByTimeAsync(60_000);
    expect(held.engine.pause).not.toHaveBeenCalled();
  });

  it('wakes on any Note, before it plays, resuming the sound at once', async () => {
    const { ctx, engine } = setUp();
    await vi.advanceTimersByTimeAsync(31_000);
    engine.noteOn(60);
    expect(engine.played).toEqual([{ note: 60, paused: false }]);
    expect(ctx.resume).toHaveBeenCalledTimes(1);
    await flush();
    expect(ctx.state).toBe('running');
    // Then waits the whole time again.
    await vi.advanceTimersByTimeAsync(29_000);
    expect(ctx.suspend).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(2_000);
    expect(ctx.suspend).toHaveBeenCalledTimes(2);
  });

  it('wakes on a knob, a tempo or a Controller’s bend as on a Note', async () => {
    const { engine } = setUp();
    for (const change of ['applyPatch', 'setTempo', 'setBend', 'setPressure'] as const) {
      await vi.advanceTimersByTimeAsync(31_000);
      expect(engine.paused(), change).toBe(true);
      engine[change]();
      expect(engine.paused(), change).toBe(false);
    }
  });

  for (const gesture of ['keydown', 'pointerdown', 'pointermove'] as const)
    it(`wakes on a ${gesture} on the page, ahead of the Note it may bring`, async () => {
      const { ctx, engine, page } = setUp();
      await vi.advanceTimersByTimeAsync(31_000);
      page.dispatchEvent(new Event(gesture));
      expect(engine.wake).toHaveBeenCalledTimes(1);
      expect(ctx.resume).toHaveBeenCalledTimes(1);
    });

  it('where the browser will not resume it without a tap after all, never pauses again and says the sound is stopped', async () => {
    const { ctx, engine } = setUp({ resumes: false });
    const told = vi.fn();
    ctx.addEventListener('statechange', told);
    await vi.advanceTimersByTimeAsync(31_000);
    told.mockClear();
    engine.noteOn(60);
    await flush();
    expect(told).toHaveBeenCalled();
    ctx.state = 'running'; // a tap started it
    await vi.advanceTimersByTimeAsync(120_000);
    expect(ctx.suspend).toHaveBeenCalledTimes(1);
  });

  it('can be stopped', async () => {
    const { ctx, stop } = setUp();
    stop();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(ctx.suspend).not.toHaveBeenCalled();
  });
});
