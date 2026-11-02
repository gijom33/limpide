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

  // Issue 134: on a phone FM's tip, its History line last, is taller than the room on either side of its knob.
  it('too tall for the room above or below, it slides down from the top edge to stay whole, over its control', () => {
    const tall = { width: 280, height: 580 };
    const phone = { width: 375, height: 667 };
    expect(placeTooltip({ left: 150, top: 300, width: 48, height: 48 }, tall, phone)).toMatchObject({ top: 8, placement: 'above' });
    expect(placeTooltip({ left: 150, top: 620, width: 48, height: 48 }, tall, phone)).toMatchObject({ top: 620 - GAP - 580, placement: 'above' });
  });

  it('stays inside the window near the left and right edges', () => {
    expect(placeTooltip({ left: 4, top: 100, width: 60, height: 28 }, tip, viewport).left).toBe(8);
    expect(placeTooltip({ left: 960, top: 100, width: 36, height: 28 }, tip, viewport).left).toBe(1000 - 8 - 260);
  });
});
