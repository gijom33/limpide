import { describe, expect, it } from 'vitest';
import { placeTooltip } from './placeTooltip';

const viewport = { width: 1000, height: 700 };
const tip = { width: 260, height: 90 };
const GAP = 8;

describe('placeTooltip', () => {
  it('sits centred just below its control', () => {
    const trigger = { left: 400, top: 100, width: 80, height: 28 };
    expect(placeTooltip(trigger, tip, viewport)).toEqual({ left: 440 - 130, top: 128 + GAP, placement: 'below' });
  });

  it('flips above when there is no room below', () => {
    const trigger = { left: 400, top: 650, width: 80, height: 28 };
    expect(placeTooltip(trigger, tip, viewport)).toMatchObject({ top: 650 - GAP - 90, placement: 'above' });
  });

  it('stays inside the window near the left and right edges', () => {
    expect(placeTooltip({ left: 4, top: 100, width: 60, height: 28 }, tip, viewport).left).toBe(8);
    expect(placeTooltip({ left: 960, top: 100, width: 36, height: 28 }, tip, viewport).left).toBe(1000 - 8 - 260);
  });
});
