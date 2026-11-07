import type { ReadoutLine } from './readout';

/** The widest each column of the readout can be, and the space between them, in CSS pixels. */
export interface ReadoutColumns {
  value: number;
  unit: number;
  gap: number;
}

/** Where a piece of the readout's text is drawn: `x` is its right end when right-aligned. */
interface ReadoutText {
  text: string;
  x: number;
  y: number;
  align: 'left' | 'right';
}

// The shapes every value and unit can take ('d' any digit, 'L' a Note's letter): from "3 Hz" on the linear axis to
// "19.99 kHz" at the top of the Spectrum (20 kHz), "F#-3" to "F#10", "−100 dB" to "silent".
const VALUES = ['ddd', 'dd.dd', 'L#-d', 'L#dd', '−ddd', 'silent'];
// With the Synth Geek Layer on, the Harmonic's number (issue 170): up to about the 930th, 20 kHz over the lowest
// fundamental it numbers, four bins (about 21.5 Hz at 44.1 kHz).
const HARMONIC = 'n = ddd';
const UNITS = ['Hz', 'kHz', 'dB', '+dd¢', '−dd¢'];
const DIGITS = [...'0123456789'];
const LETTERS = [...'ABCDEFG'];

// The box: 4 px either side of the text, a line every 11 px for the Spectrum's 10 px font, below the Harmonic Markers'
// labels.
const PAD = 4;
const LINE = 11;
const TOP = 20;
const EDGE = 2;
// How far the box stands off the cursor line, which is drawn through the middle of its column.
const OFF_RIGHT = 6;
const OFF_LEFT = 5;

/** The widest a shape can be: each 'd' and 'L' as its widest glyph, since the canvas's digits are not tabular. */
function widest(shape: string, measure: (text: string) => number) {
  let most = 0;
  for (const d of DIGITS) for (const l of LETTERS) most = Math.max(most, measure(shape.replaceAll('d', d).replaceAll('L', l)));
  return most;
}

/**
 * The columns' widths in the font `measure` measures with, whatever the values: worth measuring once per font; with
 * room for the Harmonic's number where it is shown (`harmonic`).
 */
export function readoutColumns(measure: (text: string) => number, { harmonic = false } = {}): ReadoutColumns {
  return {
    value: Math.max(...[...VALUES, ...(harmonic ? [HARMONIC] : [])].map((shape) => widest(shape, measure))),
    unit: Math.max(...UNITS.map((shape) => widest(shape, measure))),
    gap: measure(' '),
  };
}

/**
 * The hover readout's box and where its text goes (issue 155): one line per value, each right-aligned in a column as
 * wide as the widest it can be, its unit at a fixed place after it, so a value changing moves nothing else. The box
 * sits right of the cursor line (in column `cursor`), or left of it where it would not fit in the Viewer's `width`.
 */
export function readoutBox(lines: ReadoutLine[], columns: ReadoutColumns, { cursor, width }: { cursor: number; width: number }) {
  const boxWidth = PAD + columns.value + columns.gap + columns.unit + PAD;
  const height = LINE * lines.length + PAD;
  const right = cursor + OFF_RIGHT;
  const x = right + boxWidth <= width - EDGE ? right : Math.max(EDGE, cursor - OFF_LEFT - boxWidth);
  const valueEnd = x + PAD + columns.value;
  const texts = lines.flatMap(({ value, unit }, i): ReadoutText[] => {
    const y = TOP + LINE * (i + 1);
    return [
      { text: value, x: valueEnd, y, align: 'right' },
      { text: unit, x: valueEnd + columns.gap, y, align: 'left' },
    ];
  });
  return { x, y: TOP, width: boxWidth, height, texts };
}
