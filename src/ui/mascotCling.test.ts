import { describe, expect, it } from 'vitest';
import { type Box, clingBeside, drawnAt, RING, targetBox } from './mascotCling';

/** A knob 60 × 80 in the middle of a wide window, nothing round it. */
const knob: Box = { left: 500, right: 560, top: 300, bottom: 380 };
const window: Box = { left: 0, right: 1440, top: 0, bottom: 900 };
const overlaps = (a: Box, b: Box) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
const ring = (b: Box): Box => ({ left: b.left - RING, right: b.right + RING, top: b.top - RING, bottom: b.bottom + RING });
const choose = (over: Partial<Parameters<typeof clingBeside>[0]> = {}) =>
  clingBeside({ control: knob, keepClear: [ring(knob)], neighbours: [], card: null, within: window, ...over });

describe('where Bead clings beside a control (issue 151)', () => {
  it('beside the control, its middle level with the control’s, its tail towards it, the ring uncovered', () => {
    const cling = choose()!;
    const drawn = drawnAt(cling);
    expect(overlaps(drawn, ring(knob))).toBe(false);
    // Its tail's tip just short of the ring, on the side it faces.
    const tip = cling.side === 'left' ? drawn.right : drawn.left;
    const edge = cling.side === 'left' ? knob.left - RING : knob.right + RING;
    expect(Math.abs(tip - edge)).toBeLessThanOrEqual(3);
    expect(cling.turn).toBe(cling.side === 'left' ? 1 : -1);
    expect(Math.abs((drawn.top + drawn.bottom) / 2 - (knob.top + knob.bottom) / 2)).toBeLessThanOrEqual(2);
  });

  it('on the side with the most free room: the side covering fewer neighbouring names', () => {
    const leftName: Box = { left: 440, right: 494, top: 320, bottom: 360 };
    expect(choose({ neighbours: [leftName] })!.side).toBe('right');
    const rightName: Box = { left: 566, right: 620, top: 320, bottom: 360 };
    expect(choose({ neighbours: [rightName] })!.side).toBe('left');
    // A little on one side, a lot on the other: the little.
    const small: Box = { left: 600, right: 610, top: 330, bottom: 340 };
    expect(choose({ neighbours: [leftName, small] })!.side).toBe('right');
  });

  it('the side away from the docked card when both are as free', () => {
    expect(choose({ card: { left: 0, right: 400, top: 700, bottom: 880 } })!.side).toBe('right');
    expect(choose({ card: { left: 700, right: 1100, top: 700, bottom: 880 } })!.side).toBe('left');
  });

  it('never over the target text above the control, nor off the window: the other side, or none', () => {
    // A short control, its target text wide over it, down to where its drawing would rise on either side: nowhere.
    const button: Box = { left: 500, right: 540, top: 300, bottom: 312 };
    const text = targetBox(button, '→ Square, very wide text');
    expect(clingBeside({ control: button, keepClear: [ring(button), text], neighbours: [], card: null, within: window })).toBeNull();
    // Something to keep clear on its right only: on its left.
    const blocked: Box = { left: 546, right: 700, top: 280, bottom: 330 };
    const left = clingBeside({ control: button, keepClear: [ring(button), blocked], neighbours: [], card: null, within: window });
    expect(left?.side).toBe('left');
    expect(overlaps(drawnAt(left!), blocked)).toBe(false);
    // At the window's right edge: on its left.
    const atEdge: Box = { left: 1400, right: 1436, top: 300, bottom: 340 };
    expect(clingBeside({ control: atEdge, keepClear: [ring(atEdge)], neighbours: [], card: null, within: window })!.side).toBe('left');
    // No room either side: none.
    const wide: Box = { left: 20, right: 1420, top: 300, bottom: 340 };
    expect(clingBeside({ control: wide, keepClear: [ring(wide)], neighbours: [], card: null, within: window })).toBeNull();
  });

  it('nowhere under the header: a control just under it has no spot where the drawing would rise above it', () => {
    const high: Box = { left: 500, right: 540, top: 52, bottom: 64 };
    expect(clingBeside({ control: high, keepClear: [ring(high)], neighbours: [], card: null, within: { ...window, top: 50 } })).toBeNull();
  });

  it('the target text sits centred above the control, a little over its ring', () => {
    const text = targetBox(knob, '→ 800 Hz');
    expect(text.bottom).toBeLessThanOrEqual(knob.top);
    expect((text.left + text.right) / 2).toBeCloseTo((knob.left + knob.right) / 2);
    expect(text.right - text.left).toBeGreaterThan(50);
  });
});
