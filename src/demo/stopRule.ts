import { ARROW_STEPS } from '../input/arrowKeys';

/**
 * What a key press or a touch was on, for the Demo: a control that shapes the sound (knobs, faders, the stages'
 * choices and on-off switches, an LFO's Destination, the section strip, the tabs), Display, the piano, the Demo's own
 * card and button, elsewhere on the page, or outside it.
 */
export type Touched = 'sound' | 'display' | 'piano' | 'demo' | 'page' | 'outside';

/** A key press or a touch, as the Demo's stop rule sees it. */
export type DemoEvent =
  | {
      kind: 'key';
      key: string;
      /** Space that Freezes the Viewers (what has the focus does not use Space itself). */
      freezes: boolean;
      /** Cmd, Ctrl or Alt held: a shortcut, not a Note. */
      modifier: boolean;
      /** What has the focus. */
      touched: Touched;
      displayOpen: boolean;
    }
  | {
      kind: 'pointer';
      touched: Touched;
      displayOpen: boolean;
      mouse: boolean;
      /** The target takes touches itself (knobs, the piano), so a finger there is not scrolling the page. */
      takesTouches: boolean;
    };

/**
 * The keys a control uses itself, none of them playing a Note: Enter and Space press it, the arrows, Home and End move
 * along its choices or turn it. The Demo's own buttons and parts take them, as a control that shapes the sound does (a
 * switch, a choice, a knob; Page Up and Down turn a knob too, and play on anywhere).
 */
const CONTROL_KEYS = new Set(['Enter', ' ', ...Object.keys(ARROW_STEPS)]);

/**
 * Whether a key press or a touch ends the Demo (issue 79): playing anything, or touching a control that does not
 * shape the sound, means the person has taken over. Knobs, faders and the stages' switches can be changed while it
 * plays; moving around the page leaves it playing; so does Display, which shows the sound without changing it (issue
 * 64): opening it, its settings, Space's Freeze, and the click or Escape that closes it, unless that click is on the
 * piano, which plays (issue 71). On a control that shapes the sound, its own keys change it as a click does (the
 * owner, 2026-11-03). On the Demo's own card and button, Enter and Space press them and the arrows, Home and End move
 * along its parts (issue 104). A finger elsewhere on the page may only be scrolling: it stops the Demo when it lifts.
 * Page Up and Page Down scroll the page, as the wheel does, or turn the control they are on: wherever they are
 * pressed, they leave it playing (issue 227).
 */
export function demoStop(event: DemoEvent): 'stop' | 'onLift' | 'playOn' {
  if (event.kind === 'key') {
    const { key, touched } = event;
    if (event.freezes || (key === 'Escape' && event.displayOpen) || key === 'PageUp' || key === 'PageDown') return 'playOn';
    if (touched === 'sound' && CONTROL_KEYS.has(key)) return 'playOn';
    if ((key === 'Enter' || key === ' ') && touched === 'display') return 'playOn';
    if (touched === 'demo' && CONTROL_KEYS.has(key)) return 'playOn';
    return event.modifier || key === 'Shift' || key === 'Tab' ? 'playOn' : 'stop';
  }
  const { touched } = event;
  if (touched === 'outside' || touched === 'demo' || touched === 'sound' || touched === 'display') return 'playOn';
  if (event.displayOpen && touched !== 'piano') return 'playOn';
  return event.mouse || event.takesTouches ? 'stop' : 'onLift';
}
