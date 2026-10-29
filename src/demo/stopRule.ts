/**
 * What a key press or a touch was on, for the Demo: a control that shapes the sound (knobs, faders, the stages'
 * switches, an LFO's Destination, the section strip, the tabs), Display, the piano, the Demo's own card and button,
 * elsewhere on the page, or outside it.
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
 * Whether a key press or a touch ends the Demo (issue 79): playing anything, or touching a control that does not
 * shape the sound, means the person has taken over. Knobs, faders and the stages' switches can be changed while it
 * plays; moving around the page leaves it playing; so does Display, which shows the sound without changing it (issue
 * 64): opening it, its settings, Space's Freeze, and the click or Escape that closes it, unless that click is on the
 * piano, which plays (issue 71). A finger elsewhere on the page may only be scrolling: it stops the Demo when it lifts.
 */
export function demoStop(event: DemoEvent): 'stop' | 'onLift' | 'playOn' {
  if (event.kind === 'key') {
    const { key, touched } = event;
    if (event.freezes || (key === 'Escape' && event.displayOpen)) return 'playOn';
    if (key === 'Enter' && touched === 'sound') return 'playOn';
    if ((key === 'Enter' || key === ' ') && touched === 'display') return 'playOn';
    return event.modifier || key === 'Shift' || key === 'Tab' ? 'playOn' : 'stop';
  }
  const { touched } = event;
  if (touched === 'outside' || touched === 'demo' || touched === 'sound' || touched === 'display') return 'playOn';
  if (event.displayOpen && touched !== 'piano') return 'playOn';
  return event.mouse || event.takesTouches ? 'stop' : 'onLift';
}
