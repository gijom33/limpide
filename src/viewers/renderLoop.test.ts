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
