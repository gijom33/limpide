import { describe, expect, it } from 'vitest';
import { type DemoEvent, demoStop, type Touched } from './stopRule';

const key = (k: string, touched: Touched = 'page', more: Partial<Extract<DemoEvent, { kind: 'key' }>> = {}): DemoEvent => ({
  kind: 'key',
  key: k,
  freezes: false,
  modifier: false,
  touched,
  displayOpen: false,
  ...more,
});
const press = (touched: Touched, more: Partial<Extract<DemoEvent, { kind: 'pointer' }>> = {}): DemoEvent => ({
  kind: 'pointer',
  touched,
  displayOpen: false,
  mouse: true,
  takesTouches: false,
  ...more,
});

describe('what stops the Demo (issue 79)', () => {
  it.each([
    ['a letter that plays a Note', key('a'), 'stop'],
    ['an arrow on the page', key('ArrowUp'), 'stop'],
    ['Shift', key('Shift'), 'playOn'],
    ['Tab, moving the focus', key('Tab'), 'playOn'],
    ['a shortcut with Cmd, Ctrl or Alt', key('r', 'page', { modifier: true }), 'playOn'],
    ['Space that Freezes (issue 64)', key(' ', 'page', { freezes: true }), 'playOn'],
    ['Escape closing an open Display (issue 64)', key('Escape', 'page', { displayOpen: true }), 'playOn'],
    ['Escape with Display closed', key('Escape'), 'stop'],
    ['Enter on a control that shapes the sound', key('Enter', 'sound'), 'playOn'],
    ['Enter on a Display setting (issue 64)', key('Enter', 'display'), 'playOn'],
    ['Space on a Display setting (issue 64)', key(' ', 'display'), 'playOn'],
    ['Space on a button that uses it, elsewhere', key(' ', 'page'), 'stop'],
    ['a piano letter with Display open (issue 71)', key('a', 'page', { displayOpen: true }), 'stop'],
  ] as const)('a key: %s → %s', (_, event, expected) => {
    expect(demoStop(event)).toBe(expected);
  });

  it.each([
    ['a click on a knob or a stage’s switch', press('sound'), 'playOn'],
    ['a click on the Demo’s own card or button', press('demo'), 'playOn'],
    ['a click outside the page', press('outside'), 'playOn'],
    ['a click inside Display (issue 64)', press('display'), 'playOn'],
    ['a click on the page that closes an open Display (issue 64)', press('page', { displayOpen: true }), 'playOn'],
    ['a click on the piano with Display open (issue 71)', press('piano', { displayOpen: true }), 'stop'],
    ['a click elsewhere on the page', press('page'), 'stop'],
    ['a finger on the page, which may only be scrolling', press('page', { mouse: false }), 'onLift'],
    ['a finger on a control that takes touches itself, the piano', press('piano', { mouse: false, takesTouches: true }), 'stop'],
    ['a finger on a knob', press('sound', { mouse: false, takesTouches: true }), 'playOn'],
  ] as const)('a touch: %s → %s', (_, event, expected) => {
    expect(demoStop(event)).toBe(expected);
  });
});
