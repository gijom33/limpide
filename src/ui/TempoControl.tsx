import { useCallback, useEffect, useRef, useState } from 'react';
import { clampBpm, TEMPO } from '../music/tempo';
import type { TempoState } from '../play/tempoStore';
import { useMediaQuery } from './hooks/useMediaQuery';
import { useLearnable } from './learn';
import { pressed } from './paramControl';
import { STACKED } from './sections';
import { Tooltip } from './Tooltip';
import { TIPS } from './tips';

/** Pixels of drag per BPM: a 200 px drag crosses the whole range. */
const DRAG_PIXELS = 1;
/** What Page Up and Down (and Shift with an arrow) step by. */
const BIG_STEP = 10;

interface Props {
  tempo: TempoState;
  onSet(bpm: number): void;
  onTap(): void;
}


/**
 * The BPM (issue 112): a spin button reading "120 BPM", dragged up and down or stepped with the arrows, a
 * double-click typing it. While a player holds the tempo it shows the player's and cannot be set.
 */
function TempoDial({ tempo, onSet }: Pick<Props, 'tempo' | 'onSet'>) {
  const { bpm } = tempo;
  const [typing, setTyping] = useState<string | null>(null);
  const drag = useRef<{ y: number; bpm: number } | null>(null);
  const learn = useLearnable({ kind: 'tempo', id: 'bpm' });
  const held = tempo.player;
  // The field takes the focus as it opens, its text chosen, so typing replaces it.
  const typeHere = useCallback((field: HTMLInputElement | null) => {
    field?.focus();
    field?.select();
  }, []);
  const set = (next: number) => !held && onSet(clampBpm(next));
  const commit = () => {
    if (typing !== null && Number.isFinite(Number(typing)) && typing.trim() !== '') set(Number(typing));
    setTyping(null);
  };
  if (typing !== null)
    return (
      <input
        ref={typeHere}
        className="tool tempo-bpm tempo-typing"
        aria-label="Tempo in BPM"
        inputMode="numeric"
        value={typing}
        onChange={(e) => setTyping(e.target.value.replace(/[^\d.]/g, ''))}
        onBlur={commit}
        onKeyDown={(e) => {
          e.stopPropagation(); // the letter and number keys type here, never play
          if (e.key === 'Enter') commit();
          else if (e.key === 'Escape') setTyping(null);
        }}
      />
    );
  return (
    <div
      className="tool tempo-bpm"
      role="spinbutton"
      tabIndex={0}
      aria-label="Tempo"
      aria-valuemin={TEMPO.min}
      aria-valuemax={TEMPO.max}
      aria-valuenow={bpm}
      aria-valuetext={held ? `${bpm} BPM, the player’s while it plays` : `${bpm} BPM`}
      aria-disabled={held || undefined}
      {...learn}
      onKeyDown={(e) => {
        const big = e.shiftKey ? BIG_STEP : 1;
        const steps: Record<string, number> = { ArrowUp: big, ArrowRight: big, ArrowDown: -big, ArrowLeft: -big, PageUp: BIG_STEP, PageDown: -BIG_STEP };
        if (e.key in steps) set(bpm + steps[e.key]);
        else if (e.key === 'Home') set(TEMPO.min);
        else if (e.key === 'End') set(TEMPO.max);
        else if (e.key === 'Enter' && !held) setTyping(String(bpm));
        else return;
        e.preventDefault();
        e.stopPropagation();
      }}
      onDoubleClick={() => !held && setTyping(String(bpm))}
      onPointerDown={(e) => {
        if (!pressed(e) || held) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        drag.current = { y: e.clientY, bpm };
      }}
      onPointerMove={(e) => {
        if (!drag.current || !(e.buttons & 1)) return;
        set(drag.current.bpm + Math.round((drag.current.y - e.clientY) / DRAG_PIXELS));
      }}
      onPointerUp={() => (drag.current = null)}
      onPointerCancel={() => (drag.current = null)}
    >
      <span className="tempo-value">{bpm}</span>
      <span className="tempo-unit">BPM</span>
    </div>
  );
}

/** Tap: the BPM follows the taps (issue 112), Hold's tapped rhythm apart. */
function TapButton({ tempo, onTap }: Pick<Props, 'tempo' | 'onTap'>) {
  const learn = useLearnable({ kind: 'action', id: 'tap' });
  const held = tempo.player;
  return (
    <Tooltip content={TIPS.tap}>
      <button
        type="button"
        className="tool tempo-tap"
        aria-label="Tap"
        aria-disabled={held || undefined}
        // On the press, not the release, so a tap lands where the finger does.
        onPointerDown={(e) => pressed(e) && !held && onTap()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && !e.repeat && !held && onTap()}
        {...learn}
      >
        Tap
      </button>
    </Tooltip>
  );
}

/**
 * The page's tempo in the header's set-up row (issue 112, decided by the owner): from 861 px the BPM and Tap beside
 * it; narrower, the BPM alone, which opens a small field with the BPM and Tap in it. Escape or a press elsewhere
 * closes it.
 */
export function TempoControl(props: Props) {
  const narrow = useMediaQuery(STACKED);
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      button.current?.focus();
    };
    const onPointer = (e: PointerEvent) => !wrapper.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);
  if (!narrow)
    return (
      <div className="tempo" role="group" aria-label="Tempo">
        <Tooltip content={TIPS.tempo}>
          <TempoDial {...props} />
        </Tooltip>
        <TapButton {...props} />
      </div>
    );
  return (
    <div className="tempo-menu" ref={wrapper}>
      <Tooltip content={TIPS.tempo}>
        <button ref={button} type="button" className="tool tempo-open" aria-label="Tempo" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <span className="tempo-value">{props.tempo.bpm}</span>
          <span className="tool-word">BPM</span>
        </button>
      </Tooltip>
      {open && (
        <div className="tempo-panel" role="group" aria-label="Tempo">
          <TempoDial {...props} />
          <TapButton {...props} />
        </div>
      )}
    </div>
  );
}
