import { useEffect, useEffectEvent, useRef, useState } from 'react';
import type { AudioSession } from '../../app/session';
import { createHoldTaps, type Rhythm, startRhythm } from '../../input/holdRhythm';

/**
 * Hold, and the Notes held by hand. Hold's clicks: the first switches it on; quick clicks after it, before a Note is
 * held, tap a rhythm, and the held Notes then repeat on it (single Notes and chords in turn on several Voices) until
 * Hold goes off. `pressHoldRef` and `setPedal` are for a Controller's pad and pedal, whose messages the control
 * surface handles between renders, outside any effect: they read refs, kept with each render.
 */
export function useHold(session: AudioSession) {
  const [hold, setHold] = useState(false);
  // A keyboard's sustain pedal holds Notes as Hold does, while it is down (issue 52). It reaches the Note input at once,
  // not on the next render: a Note released just after the pedal goes down must be held.
  const holdRef = useRef(hold);
  holdRef.current = hold;
  const pedalRef = useRef(false);
  const setPedal = (down: boolean) => {
    pedalRef.current = down;
    session.input.setHold(holdRef.current || down, { letGo: holdRef.current });
  };
  const [heldNotes, setHeldNotes] = useState<number[]>([]);
  const [holdTaps] = useState(createHoldTaps);
  const [rhythm, setRhythm] = useState<Rhythm | null>(null);

  useEffect(() => session.onHeld(setHeldNotes), [session]);
  useEffect(() => session.input.setHold(hold || pedalRef.current, { letGo: hold }), [session, hold]);

  const pressHold = () => {
    setHold(holdTaps.press(performance.now() / 1000, heldNotes.length > 0));
    setRhythm(holdTaps.rhythm());
  };
  const pressHoldRef = useRef(pressHold);
  pressHoldRef.current = pressHold;

  useEffect(() => {
    if (heldNotes.length) holdTaps.noteArrived();
  }, [holdTaps, heldNotes]);
  // The Notes held by hand right now: the rhythm reads them on each beat.
  const heldNow = useEffectEvent(() => heldNotes);
  useEffect(() => {
    if (!hold || !rhythm) return;
    const { engine } = session;
    session.muteInput(true);
    const stop = startRhythm(
      {
        now: () => engine.now(),
        notes: () => heldNow(),
        voices: () => session.patches.get().patch.voices,
        noteOn: (note, velocity, at) => engine.noteOn(note, velocity, at),
        release: (note, at) => engine.release(note, at),
        noteOff: (at) => engine.noteOff(at),
      },
      rhythm,
    );
    return () => {
      stop();
      session.muteInput(false);
    };
  }, [session, hold, rhythm]);

  return { hold, pressHold, pressHoldRef, heldNotes, setPedal };
}
