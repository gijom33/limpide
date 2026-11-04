import { afterEach, describe, expect, it, vi } from 'vitest';

describe('render loop', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('keeps drawing the other Viewers, and keeps running, when one throws (reported once)', async () => {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => frames.push(callback));
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { addToRenderLoop } = await import('./renderLoop');
    const healthy = vi.fn();
    addToRenderLoop(() => {
      throw new Error('a Viewer broke');
    });
    addToRenderLoop(healthy);
    for (let i = 0; i < 3; i++) frames.shift()!(0);
    expect(healthy).toHaveBeenCalledTimes(3);
    expect(frames).toHaveLength(1); // the next frame is asked for
    expect(error).toHaveBeenCalledTimes(1);
  });
});

describe('a frame reads the page before it writes (issue 221)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('runs every draw first, then the writes they hand back, in the same order', async () => {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => frames.push(callback));
    vi.resetModules();
    const { addToRenderLoop } = await import('./renderLoop');
    const seen: string[] = [];
    addToRenderLoop(() => {
      seen.push('read 1');
      return () => seen.push('write 1');
    });
    addToRenderLoop(() => void seen.push('read 2'));
    addToRenderLoop(() => {
      seen.push('read 3');
      return () => seen.push('write 3');
    });
    frames.shift()!(0);
    expect(seen).toEqual(['read 1', 'read 2', 'read 3', 'write 1', 'write 3']);
  });

  it('a write that throws is reported once, and the other writes still run', async () => {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => frames.push(callback));
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.resetModules();
    const { addToRenderLoop } = await import('./renderLoop');
    const healthy = vi.fn();
    addToRenderLoop(() => () => {
      throw new Error('a write broke');
    });
    addToRenderLoop(() => healthy);
    for (let i = 0; i < 3; i++) frames.shift()!(0);
    expect(healthy).toHaveBeenCalledTimes(3);
    expect(frames).toHaveLength(1);
    expect(error).toHaveBeenCalledTimes(1);
  });
});
