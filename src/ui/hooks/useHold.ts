import { type MutableRefObject, useEffect, useRef, useState } from 'react';
import type { AudioSession } from '../../app/session';
import { createHoldTaps, type Rhythm, startRhythm } from '../../input/holdRhythm';
import type { Patch } from '../../patch/patch';

/**
 * Hold, and the Notes held by hand. Hold's clicks: the first switches it on; quick clicks after it, before a Note is
 * held, tap a rhythm, and the held Notes then repeat on it (single Notes and chords in turn on several Voices) until
 * Hold goes off. `pressHoldRef` is for a Controller's pad, between renders.
 */
export function useHold(session: AudioSession, patchRef: MutableRefObject<Patch>) {
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
  const heldRef = useRef(heldNotes);
  heldRef.current = heldNotes;
  const [holdTaps] = useState(createHoldTaps);
  const [rhythm, setRhythm] = useState<Rhythm | null>(null);

  useEffect(() => session.onHeld(setHeldNotes), [session]);
  useEffect(() => session.input.setHold(hold || pedalRef.current, { letGo: hold }), [session, hold]);

  const pressHold = () => {
    setHold(holdTaps.press(performance.now() / 1000, heldRef.current.length > 0));
    setRhythm(holdTaps.rhythm());
  };
  const pressHoldRef = useRef(pressHold);
  pressHoldRef.current = pressHold;

  useEffect(() => {
    if (heldNotes.length) holdTaps.noteArrived();
  }, [holdTaps, heldNotes]);
  useEffect(() => {
    if (!hold || !rhythm) return;
    const { engine } = session;
    session.muteInput(true);
    const stop = startRhythm(
      {
        now: () => engine.now(),
        notes: () => heldRef.current,
        voices: () => patchRef.current.voices,
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
  }, [session, hold, rhythm, patchRef]);

  return { hold, pressHold, pressHoldRef, heldNotes, setPedal };
}
