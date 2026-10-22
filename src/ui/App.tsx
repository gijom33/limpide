import { useEffect, useRef, useState } from 'react';
import { startAudioSession, type AudioSession } from '../app/session';
import { keyToNote } from '../input/keyboardLayout';
import { defaultPatch, setParam, type ParamId, type Patch } from '../patch/patch';
import { Knob } from './Knob';
import { TapViewers } from './TapViewers';

const KEYBOARD_OCTAVE = 4;

function Block({ title, ids, patch, onChange }: { title: string; ids: ParamId[]; patch: Patch; onChange(id: ParamId, v: number): void }) {
  return (
    <section className="block">
      <h2>{title}</h2>
      <div className="knobs">
        {ids.map((id) => (
          <Knob key={id} id={id} value={patch[id]} onChange={(v) => onChange(id, v)} />
        ))}
      </div>
    </section>
  );
}

export function App() {
  const [patch, setPatch] = useState(defaultPatch);
  const [session, setSession] = useState<AudioSession | null>(null);
  const held = useRef(new Set<number>());

  useEffect(() => {
    session?.engine.applyPatch(patch);
  }, [session, patch]);

  useEffect(() => {
    if (!session) return;
    const { input } = session;
    const isTyping = (e: KeyboardEvent) => e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey || e.altKey;

    const down = (e: KeyboardEvent) => {
      const note = keyToNote(e.code, KEYBOARD_OCTAVE);
      if (note === undefined || e.repeat || isTyping(e)) return;
      held.current.add(note);
      input.press(note, 1);
    };
    const up = (e: KeyboardEvent) => {
      const note = keyToNote(e.code, KEYBOARD_OCTAVE);
      if (note === undefined) return;
      held.current.delete(note);
      input.release(note);
    };
    const releaseAll = () => {
      for (const note of held.current) input.release(note);
      held.current.clear();
    };

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', releaseAll);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', releaseAll);
    };
  }, [session]);

  const change = (id: ParamId, value: number) => setPatch((p) => setParam(p, id, value));

  return (
    <main>
      <header>
        <h1>SynthView</h1>
        <p className="hint">Play with the keys <kbd>A</kbd>–<kbd>K</kbd> (black keys on <kbd>W E T Y U</kbd>).</p>
      </header>

      {!session && (
        <button className="start" onClick={async () => setSession(await startAudioSession(patch))}>
          Click to start audio
        </button>
      )}

      <div className="chain">
        <section className="block">
          <h2>Oscillator</h2>
          <p className="fixed">Saw</p>
        </section>
        <span className="arrow" aria-hidden>→</span>
        <Block title="Filter" ids={['cutoff', 'resonance']} patch={patch} onChange={change} />
        <span className="arrow" aria-hidden>→</span>
        <Block title="Amp Envelope" ids={['ampAttack', 'ampDecay', 'ampSustain', 'ampRelease']} patch={patch} onChange={change} />
      </div>

      {session && <TapViewers name="Amp" analyser={session.engine.taps.amp} sampleRate={session.ctx.sampleRate} />}
    </main>
  );
}
