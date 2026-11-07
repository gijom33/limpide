import { describe, expect, it } from 'vitest';
import { c16Layout } from './c16';
import type { Mapping } from './mappings';
import { describeTaken } from './taken';

const layout = c16Layout();
const at = (number: number) => layout.find((m) => m.control.number === number)!;

describe('what a learned Mapping took, in words (issue 255)', () => {
  it('names a C16 place by its bank and its name, with what it no longer does', () => {
    expect(describeTaken([at(9)])).toBe('bank B’s K1 no longer turns Cutoff');
    expect(describeTaken([at(1), at(9)])).toBe('bank A’s K1 no longer turns Osc 1 Octave; bank B’s K1 no longer turns Cutoff');
  });

  it('a fader moves, a button fires an Action or switches a choice', () => {
    expect(describeTaken([at(33)])).toBe('bank A’s F1 no longer moves Osc 1');
    expect(describeTaken([at(49 + 12 * 1 + 2)])).toBe('bank B’s R1 no longer switches Slope');
  });

  it('a place the same on every bank, taken on all four, is said once', () => {
    const m4 = layout.filter((m) => m.target.kind === 'action' && m.target.id === 'hold');
    expect(m4).toHaveLength(4);
    expect(describeTaken(m4)).toBe('every bank’s M4 no longer fires Hold');
    expect(describeTaken(m4.slice(0, 2))).toBe('banks A and B’s M4 no longer fire Hold');
  });

  it('names a person’s own Mapping by its control', () => {
    const own: Mapping = { control: { kind: 'cc', channel: 2, number: 74 }, target: { kind: 'param', id: 'cutoff' }, mode: 'absolute' };
    const pad: Mapping = { control: { kind: 'note', channel: 10, number: 36 }, target: { kind: 'action', id: 'hold' }, mode: 'trigger' };
    expect(describeTaken([own, pad])).toBe('ch 2 · CC 74 no longer turns Cutoff; ch 10 · Note C2 no longer fires Hold');
  });

  it('says nothing when nothing was taken', () => {
    expect(describeTaken([])).toBe('');
  });
});
