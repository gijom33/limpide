import { describe, expect, it, vi } from 'vitest';
import { playThroughSilentMode, type UnlockableContext, unlockAudio } from './unlockAudio';

/** A stand-in AudioContext: starts suspended; resume() either succeeds or is refused (autoplay policy). */
function fakeContext({ allowed }: { allowed: boolean }) {
  const ctx = new EventTarget() as EventTarget & UnlockableContext & { state: AudioContextState };
  ctx.state = 'suspended';
  ctx.resume = vi.fn(async () => {
    if (allowed) {
      ctx.state = 'running';
      ctx.dispatchEvent(new Event('statechange'));
    }
  });
  return ctx;
}

const flush = () => new Promise((r) => setTimeout(r, 0));

describe('unlockAudio', () => {
  for (const gesture of ['keydown', 'pointerdown'] as const) {
    it(`resumes audio on the first ${gesture}, inside the gesture`, async () => {
      const page = new EventTarget();
      const ctx = fakeContext({ allowed: true });
      const onChange = vi.fn();
      unlockAudio(ctx, page, onChange);

      page.dispatchEvent(new Event(gesture));
      expect(ctx.resume).toHaveBeenCalledTimes(1); // synchronously: Safari only honours it inside the gesture
      await flush();
      expect(onChange).toHaveBeenLastCalledWith('running');
    });
  }

  it('stops listening once audio runs', async () => {
    const page = new EventTarget();
    const ctx = fakeContext({ allowed: true });
    unlockAudio(ctx, page, () => {});
    page.dispatchEvent(new Event('keydown'));
    await flush();
    page.dispatchEvent(new Event('pointerdown'));
    expect(ctx.resume).toHaveBeenCalledTimes(1);
  });

  it('reports "blocked" when the browser still refuses after a gesture, and keeps trying on the next one', async () => {
    const page = new EventTarget();
    const ctx = fakeContext({ allowed: false });
    const onChange = vi.fn();
    unlockAudio(ctx, page, onChange);
    page.dispatchEvent(new Event('keydown'));
    await flush();
    expect(onChange).toHaveBeenLastCalledWith('blocked');
    page.dispatchEvent(new Event('pointerdown'));
    expect(ctx.resume).toHaveBeenCalledTimes(2);
  });

  it('says "waiting" before any interaction, and nothing more if audio was already allowed', () => {
    const onChange = vi.fn();
    unlockAudio(fakeContext({ allowed: true }), new EventTarget(), onChange);
    expect(onChange).toHaveBeenCalledWith('waiting');

    const running = fakeContext({ allowed: true });
    running.state = 'running';
    const onRunning = vi.fn();
    unlockAudio(running, new EventTarget(), onRunning);
    expect(onRunning).toHaveBeenCalledWith('running');
  });

  for (const gesture of ['pointerup', 'touchend', 'click'] as const) {
    it(`resumes audio on a ${gesture} too: Safari on an iPhone lets sound start when the finger lifts, not as it lands`, async () => {
      const page = new EventTarget();
      const ctx = fakeContext({ allowed: true });
      const onChange = vi.fn();
      unlockAudio(ctx, page, onChange);
      page.dispatchEvent(new Event(gesture));
      expect(ctx.resume).toHaveBeenCalledTimes(1);
      await flush();
      expect(onChange).toHaveBeenLastCalledWith('running');
    });
  }

  it('stopped by the browser after it ran (an iPhone back from another app), it waits again and the next gesture resumes it', async () => {
    const page = new EventTarget();
    const ctx = fakeContext({ allowed: true });
    const onChange = vi.fn();
    unlockAudio(ctx, page, onChange);
    page.dispatchEvent(new Event('keydown'));
    await flush();
    expect(onChange).toHaveBeenLastCalledWith('running');

    // Safari's 'interrupted', or 'suspended': either way not running.
    ctx.state = 'interrupted' as AudioContextState;
    ctx.dispatchEvent(new Event('statechange'));
    expect(onChange).toHaveBeenLastCalledWith('waiting');
    page.dispatchEvent(new Event('pointerdown'));
    expect(ctx.resume).toHaveBeenCalledTimes(2);
    await flush();
    expect(onChange).toHaveBeenLastCalledWith('running');
  });

  it('back on the page after it ran, it tries to resume at once, saying nothing if the browser wants a gesture first', async () => {
    const page = new EventTarget();
    const ctx = fakeContext({ allowed: false });
    ctx.state = 'running';
    const onChange = vi.fn();
    unlockAudio(ctx, page, onChange);
    ctx.state = 'suspended';
    ctx.dispatchEvent(new Event('statechange'));
    for (const back of ['visibilitychange', 'pageshow', 'focus']) page.dispatchEvent(new Event(back));
    expect(ctx.resume).toHaveBeenCalledTimes(3);
    await flush();
    expect(onChange).toHaveBeenLastCalledWith('waiting');
  });

  it('before the sound first runs, coming back to the page tries nothing: only a gesture can start it', () => {
    const page = new EventTarget();
    const ctx = fakeContext({ allowed: false });
    unlockAudio(ctx, page, () => {});
    for (const back of ['visibilitychange', 'pageshow', 'focus']) page.dispatchEvent(new Event(back));
    expect(ctx.resume).not.toHaveBeenCalled();
  });

  it('running, a gesture leaves it be', async () => {
    const page = new EventTarget();
    const ctx = fakeContext({ allowed: true });
    ctx.state = 'running';
    unlockAudio(ctx, page, () => {});
    for (const g of ['keydown', 'pointerdown', 'touchend', 'visibilitychange']) page.dispatchEvent(new Event(g));
    expect(ctx.resume).not.toHaveBeenCalled();
  });

  it('can be torn down', () => {
    const page = new EventTarget();
    const ctx = fakeContext({ allowed: true });
    unlockAudio(ctx, page, () => {})();
    for (const g of ['keydown', 'touchend', 'visibilitychange']) page.dispatchEvent(new Event(g));
    expect(ctx.resume).not.toHaveBeenCalled();
  });
});

describe('playThroughSilentMode', () => {
  it('asks for a playback audio session, so an iPhone on silent still sounds like a music app', () => {
    const nav = { audioSession: { type: 'auto' } };
    playThroughSilentMode(nav);
    expect(nav.audioSession.type).toBe('playback');
  });

  it('does nothing in browsers without an audio session (all but Safari)', () => {
    expect(() => playThroughSilentMode({})).not.toThrow();
  });
});
