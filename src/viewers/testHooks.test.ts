import { describe, expect, it } from 'vitest';
import { writeTestHooks } from './testHooks';

/** A dataset that counts what is written to it. */
function watchedDataset(start: Record<string, string> = {}) {
  const writes: string[] = [];
  const dataset = new Proxy({ ...start } as DOMStringMap, {
    set(target, key: string, value: string) {
      writes.push(`${key}=${value}`);
      target[key] = value;
      return true;
    },
    deleteProperty(target, key: string) {
      writes.push(`-${key}`);
      delete target[key];
      return true;
    },
  });
  return { dataset, writes };
}

describe('a Viewer’s test hooks (issue 257)', () => {
  it('writes each hook that changed, and only those', () => {
    const { dataset, writes } = watchedDataset({ glow: '3', markers: '7' });
    writeTestHooks(dataset, { glow: '3', markers: '8', period: '2.27 ms' });
    expect(writes).toEqual(['markers=8', 'period=2.27 ms']);
    expect({ ...dataset }).toEqual({ glow: '3', markers: '8', period: '2.27 ms' });
  });

  it('writes nothing for a frame the same as the last', () => {
    const { dataset, writes } = watchedDataset({ glow: '3' });
    writeTestHooks(dataset, { glow: '3', readout: undefined });
    writeTestHooks(dataset, undefined); // a Viewer at rest draws nothing, and hands back nothing
    expect(writes).toEqual([]);
  });

  it('takes away a hook the frame has no value for', () => {
    const { dataset, writes } = watchedDataset({ readout: '440 Hz' });
    writeTestHooks(dataset, { readout: undefined });
    expect(writes).toEqual(['-readout']);
    expect('readout' in dataset).toBe(false);
  });
});
