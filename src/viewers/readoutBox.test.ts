import { describe, expect, it } from 'vitest';
import { hoverReadoutLines } from './readout';
import { readoutBox, readoutColumns } from './readoutBox';

// A proportional font, as the canvas's system-ui is: digits of different widths ('1' narrow, '0' and '8' wide).
const WIDTHS: Record<string, number> = { '1': 3, '0': 6.5, '8': 6.5, '.': 2, ' ': 2.5, '#': 6, '−': 6, '+': 6, '-': 3.5, '¢': 5 };
const measure = (text: string) => [...text].reduce((sum, c) => sum + (WIDTHS[c] ?? (/\d/.test(c) ? 5.5 : 5.8)), 0);
const columns = readoutColumns(measure);
const VIEWER = 600;

/** Frequencies across both axes (3 Hz on the linear one, to 24 kHz) and levels from the top to below the floor. */
const sweep = Array.from({ length: 400 }, (_, i) => ({ frequency: 3 * 8000 ** (i / 399), levelDb: -120 + (i * 7.3) % 121 }));

describe('the hover readout box (issue 155)', () => {
  it('keeps its size and its place, whatever the values, as the cursor sits still', () => {
    const boxes = sweep.map(({ frequency, levelDb }) => readoutBox(hoverReadoutLines(frequency, levelDb), columns, { cursor: 200, width: VIEWER }));
    const { x, y, width, height } = boxes[0];
    for (const box of boxes) expect({ x: box.x, y: box.y, width: box.width, height: box.height }).toEqual({ x, y, width, height });
  });

  it('stacks the three values, each line keeping its units in one place', () => {
    const widest = readoutBox([{ value: '23.99', unit: 'kHz' }, { value: 'F#10', unit: '+27¢' }, { value: '−100', unit: 'dB' }], columns, { cursor: 200, width: VIEWER });
    const narrowest = readoutBox([{ value: '1', unit: 'Hz' }, { value: 'A4', unit: '' }, { value: '−1', unit: 'dB' }], columns, { cursor: 200, width: VIEWER });
    expect(new Set(widest.texts.map((t) => t.y)).size).toBe(3);
    const ends = (box: typeof widest) => box.texts.map(({ x, y, align }) => ({ x, y, align }));
    expect(ends(narrowest)).toEqual(ends(widest));
  });

  it('holds every value it can show inside the box', () => {
    for (const { frequency, levelDb } of sweep) {
      const box = readoutBox(hoverReadoutLines(frequency, levelDb), columns, { cursor: 200, width: VIEWER });
      for (const t of box.texts) {
        const [left, right] = t.align === 'right' ? [t.x - measure(t.text), t.x] : [t.x, t.x + measure(t.text)];
        expect(left).toBeGreaterThanOrEqual(box.x);
        expect(right).toBeLessThanOrEqual(box.x + box.width);
      }
    }
  });

  it('sits right of the cursor line, and flips to its left only where it would not fit', () => {
    const lines = hoverReadoutLines(440, -20);
    const right = readoutBox(lines, columns, { cursor: 200, width: VIEWER });
    expect(right.x).toBeGreaterThan(200);
    const nearEdge = readoutBox(lines, columns, { cursor: VIEWER - 10, width: VIEWER });
    expect(nearEdge.x + nearEdge.width).toBeLessThan(VIEWER - 10);
    // Moving with the cursor, one pixel at a time, it never jumps but once.
    const xs = Array.from({ length: VIEWER }, (_, c) => readoutBox(lines, columns, { cursor: c, width: VIEWER }).x);
    const jumps = xs.slice(1).filter((x, i) => Math.abs(x - xs[i]) > 1.5);
    expect(jumps).toHaveLength(1);
  });
});

describe('hoverReadoutLines', () => {
  it('splits each value from its unit: frequency, Note with its cents, level', () => {
    expect(hoverReadoutLines(3000, -41.6)).toEqual([
      { value: '3.00', unit: 'kHz' },
      { value: 'F#7', unit: '+23¢' },
      { value: '−42', unit: 'dB' },
    ]);
    expect(hoverReadoutLines(440, -Infinity)).toEqual([
      { value: '440', unit: 'Hz' },
      { value: 'A4', unit: '' },
      { value: 'silent', unit: '' },
    ]);
  });
});
