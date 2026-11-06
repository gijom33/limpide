import { useEffect, useSyncExternalStore } from 'react';
import { demoStop, type Touched } from '../../demo/stopRule';
import type { Shows } from '../../shows/shows';
import { takesTouches, watchPersonScroll } from '../personScroll';
import { freezesOnSpace } from './useKeys';

/** What a key press or a touch was on, for the Demo's stop rule: the one place its selectors live (issue 79). */
function touchedBy(target: EventTarget | null): Touched {
  if (!(target instanceof Element)) return 'outside';
  if (target.closest('[data-demo]')) return 'demo';
  if (target.closest('.display-menu')) return 'display';
  // The on-off switches (Legato, an LFO's Retrigger and Sync) shape the sound as a knob does (the owner, 2026-11-03).
  if (target.closest('.knob, .switch, .block-controls [role="radio"], .timeline-controls [role="radio"], .destination-picker, .section-strip, [role="tab"]')) return 'sound';
  if (!target.closest('main')) return 'outside';
  if (target.closest('.piano')) return 'piano';
  return 'page';
}

/**
 * The Shows as the page shows them (issue 243): what is on, read from the module, and what the page tells it. While
 * the Demo plays, each key press and touch is described to its stop rule (`demoStop`, issue 79), which says whether the
 * person has taken over; while it plays or the Tour is open, the person's own scroll is told (issue 227).
 */
export function useShows(shows: Shows) {
  const now = useSyncExternalStore(shows.subscribe, shows.get);
  const { demo } = now;
  const touring = now.tour !== null;

  useEffect(() => {
    if (demo === null) return;
    const displayOpen = () => !!document.querySelector('.display-panel');
    const onKey = (e: KeyboardEvent) => {
      const event = { kind: 'key', key: e.key, freezes: freezesOnSpace(e), modifier: e.metaKey || e.ctrlKey || e.altKey } as const;
      if (demoStop({ ...event, touched: touchedBy(e.target), displayOpen: displayOpen() }) === 'stop') shows.takeOver();
    };
    // A finger on the page may only be scrolling it: unless it lands on a control that takes touches itself
    // (knobs, piano), wait for it to lift. If the browser took it over to scroll, it is cancelled instead.
    let tap: number | null = null;
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Element;
      const decision = demoStop({
        kind: 'pointer',
        touched: touchedBy(target),
        displayOpen: displayOpen(),
        mouse: e.pointerType === 'mouse',
        takesTouches: takesTouches(target),
      });
      if (decision === 'stop') shows.takeOver();
      else if (decision === 'onLift') tap = e.pointerId;
    };
    const onLift = (e: PointerEvent) => {
      if (e.pointerId === tap) shows.takeOver();
    };
    const onCancel = () => (tap = null);
    // In the capture phase, before Display's own Escape or outside click closes it.
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('pointerdown', onPointer, true);
    document.addEventListener('pointerup', onLift);
    document.addEventListener('pointercancel', onCancel);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('pointerdown', onPointer, true);
      document.removeEventListener('pointerup', onLift);
      document.removeEventListener('pointercancel', onCancel);
    };
  }, [shows, demo]);

  // The person scrolling, the one check of the page's following for the Demo and the Tour (issue 227).
  const watching = demo !== null || touring;
  useEffect(() => (watching ? watchPersonScroll(shows.personScrolled) : undefined), [shows, watching]);

  // Nothing plays on after the page goes, and the Tour gives the person's Patch back.
  useEffect(() => () => shows.leave(), [shows]);

  return now;
}
