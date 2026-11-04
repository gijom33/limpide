import { describe, expect, it, vi } from 'vitest';
import { needsATapToResume, playThroughSilentMode, type UnlockableContext, unlockAudio } from './unlockAudio';

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

  it('ignores a gesture once audio runs, without resuming it again', async () => {
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
    it(`resumes audio on a ${gesture} too: Safari on an iPhone lets sound start when the finger lifts, not as it lands (the owner, 2026-11-03)`, async () => {
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

  it('stopped by the browser after it ran (an iPhone back from another app), it waits again and the next gesture resumes it (the owner, 2026-11-03)', async () => {
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

  it('back on the page after it ran, it tries to resume at once, saying nothing if the browser wants a gesture first (the owner, 2026-11-03)', async () => {
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

  it('paused by the page itself in a long silence, it says the sound runs and leaves it paused on a return to the page (issue 216)', () => {
    const page = new EventTarget();
    const ctx = fakeContext({ allowed: true });
    ctx.state = 'running';
    let paused = false;
    const onChange = vi.fn();
    unlockAudio(ctx, page, onChange, () => paused);
    paused = true;
    ctx.state = 'suspended';
    ctx.dispatchEvent(new Event('statechange'));
    expect(onChange).toHaveBeenLastCalledWith('running');
    for (const back of ['visibilitychange', 'pageshow', 'focus', 'keydown']) page.dispatchEvent(new Event(back));
    expect(ctx.resume).not.toHaveBeenCalled();
    // The browser stopping it is still the browser's: once the page's pause is over, it waits again.
    paused = false;
    ctx.dispatchEvent(new Event('statechange'));
    expect(onChange).toHaveBeenLastCalledWith('waiting');
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

describe('needsATapToResume (issue 216)', () => {
  it('is an iPhone’s or an iPad’s browser, whatever it calls itself, and no other', () => {
    expect(needsATapToResume({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15', platform: 'iPhone', maxTouchPoints: 5 })).toBe(true);
    // An iPad asks for the desktop site: a Mac with a touch screen.
    expect(needsATapToResume({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15', platform: 'MacIntel', maxTouchPoints: 5 })).toBe(true);
    expect(needsATapToResume({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15', platform: 'MacIntel', maxTouchPoints: 0 })).toBe(false);
    expect(needsATapToResume({ userAgent: 'Mozilla/5.0 (Linux; Android 15) Chrome/140.0', platform: 'Linux armv8l', maxTouchPoints: 5 })).toBe(false);
  });
});
