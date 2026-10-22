import { useEffect, useRef, useState } from 'react';
import { startAudioSession, type AudioSession } from '../app/session';
import { keyToNote } from '../input/keyboardLayout';
import { defaultPatch, setParam, type ParamId, type Patch } from '../patch/patch';
import { Knob } from './Knob';
import { TapViewers } from './TapViewers';
import { applyTheme, loadTheme } from './theme';

const KEYBOARD_OCTAVE = 4;

interface BlockProps {
  title: string;
  ids: ParamId[];
  patch: Patch;
  onChange(id: ParamId, v: number): void;
  children?: React.ReactNode;
  viewers?: React.ReactNode;
}

/** One stage of the signal-flow diagram: its controls on top, its Tap's Viewers below. */
function Block({ title, ids, patch, onChange, children, viewers }: BlockProps) {
  return (
    <section className="block" aria-label={title}>
      <h2>{title}</h2>
      <div className="knobs">
        {children}
        {ids.map((id) => (
          <Knob key={id} id={id} value={patch[id]} onChange={(v) => onChange(id, v)} />
        ))}
      </div>
      {viewers}
    </section>
  );
}

export function App() {
  const [patch, setPatch] = useState(defaultPatch);
  const [session, setSession] = useState<AudioSession | null>(null);
  const held = useRef(new Set<number>());
  const [theme, setTheme] = useState(loadTheme);

  useEffect(() => applyTheme(theme), [theme]);

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

  const viewers = (tap: keyof AudioSession['engine']['taps'], name: string, extra: { idleHint?: string; note?: string } = {}) =>
    session && <TapViewers name={name} analyser={session.engine.taps[tap]} sampleRate={session.ctx.sampleRate} fundamental={session.engine.fundamental} {...extra} />;

  return (
    <main>
      <header>
        <h1>SynthView</h1>
        <p className="hint">Play with the keys <kbd>A</kbd>–<kbd>K</kbd> (black keys on <kbd>W E T Y U</kbd>).</p>
        <button className="theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          {theme === 'dark' ? 'Light' : 'Dark'} theme
        </button>
      </header>

      {!session && (
        <button className="start" onClick={async () => setSession(await startAudioSession(patch))}>
          Click to start audio
        </button>
      )}

      <div className="chain">
        <Block
          title="Oscillator"
          ids={[]}
          patch={patch}
          onChange={change}
          viewers={viewers('oscillator', 'Oscillator', {
            note: 'The Oscillator runs all the time, even between Notes. The Amp decides when you hear it.',
          })}
        >
          <p className="fixed">Saw</p>
        </Block>
        <Block title="Filter" ids={['cutoff', 'resonance']} patch={patch} onChange={change} viewers={viewers('filter', 'Filter')} />
        <Block
          title="Amp"
          ids={['ampAttack', 'ampDecay', 'ampSustain', 'ampRelease']}
          patch={patch}
          onChange={change}
          viewers={viewers('amp', 'Amp', { idleHint: 'Silent: press a key (A–K) to open the Amp.' })}
        />
      </div>
    </main>
  );
}
