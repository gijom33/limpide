import { useCallback, useEffect, useRef, useState } from 'react';
import { clampBpm, TEMPO, TEMPO_STEPS } from '../music/tempo';
import { stepParam } from '../patch/grid';
import type { TempoState } from '../play/tempoStore';
import { useHeaderPanel } from './hooks/useHeaderPanel';
import { useMediaQuery } from './hooks/useMediaQuery';
import { useUnderHeader } from './hooks/useUnderHeader';
import { MidiIcon } from './icons';
import { useLearnable } from './learn';
import { pressed } from './paramControl';
import { STACKED } from './sections';
import { Tooltip } from './Tooltip';
import { TIPS } from './tips';

/** Pixels of drag per BPM: a 200 px drag crosses the whole range. */
const DRAG_PIXELS = 1;
/** A tempo settles this long before it is announced, so a clock's drift or a run of taps is said once. */
const SETTLE_MS = 600;

interface Props {
  tempo: TempoState;
  onSet(bpm: number): void;
  onTap(): void;
}


/** Whether the tempo cannot be set here: a player holds it, or a MIDI clock sets it (issue 136). */
const heldOff = (tempo: TempoState) => tempo.player || tempo.midi;

/** The BPM's unit, or the "MIDI" mark in its place while a MIDI clock sets the tempo (issue 136). */
const unit = (tempo: TempoState) => (tempo.midi ? 'MIDI' : 'BPM');

/**
 * The BPM's tip: while a MIDI clock sets the tempo, why it cannot be set (issue 136). The narrow layout's button only
 * opens the field, so its tip says so, the BPM in the field keeping the drag and the arrows (issue 194).
 */
const tempoTip = (tempo: TempoState, opener = false) => (tempo.midi ? TIPS.tempoClock : opener ? TIPS.tempoOpen : TIPS.tempo);

/**
 * The BPM (issue 112): a spin button reading "120 BPM", dragged up and down or stepped with the arrows, a
 * double-click typing it. While a player holds the tempo it shows the player's and cannot be set; while a MIDI clock
 * sets it, it reads "120 MIDI" and cannot be set either (issue 136). A drag sets the
 * tempo where it is let go, the BPM it reaches shown meanwhile: each tempo set starts the beat count again and pulls a
 * synced LFO onto the new beat over two cycles (ADR-0019), so set at every step the pulls would pile up, one a pixel
 * (Claude's call, open to the owner).
 */
function TempoDial({ tempo, onSet }: Pick<Props, 'tempo' | 'onSet'>) {
  const [typing, setTyping] = useState<string | null>(null);
  const [dragged, setDragged] = useState<number | null>(null);
  const bpm = dragged ?? tempo.bpm;
  const drag = useRef<{ y: number; bpm: number } | null>(null);
  const learn = useLearnable({ kind: 'tempo', id: 'bpm' });
  const held = heldOff(tempo);
  // The field takes the focus as it opens, its text chosen, so typing replaces it.
  const typeHere = useCallback((field: HTMLInputElement | null) => {
    field?.focus();
    field?.select();
  }, []);
  // Enter or Escape in the field gives the focus back to the BPM, not to the page (issue 189); a press elsewhere leaves
  // it where the press went.
  const back = useRef(false);
  const refocus = useCallback((dial: HTMLDivElement | null) => {
    if (!dial || !back.current) return;
    back.current = false;
    dial.focus();
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
          if (e.key === 'Enter') {
            back.current = true;
            commit();
          } else if (e.key === 'Escape') {
            back.current = true;
            setTyping(null);
          }
        }}
      />
    );
  return (
    <div
      ref={refocus}
      className="tool tempo-bpm"
      role="spinbutton"
      tabIndex={0}
      aria-label="Tempo"
      aria-valuemin={TEMPO.min}
      aria-valuemax={TEMPO.max}
      aria-valuenow={bpm}
      aria-valuetext={tempo.player ? `${bpm} BPM, the player’s while it plays` : tempo.midi ? `${bpm} BPM, from a MIDI clock` : `${bpm} BPM`}
      aria-disabled={held || undefined}
      data-clock={tempo.midi || undefined}
      {...learn}
      onKeyDown={(e) => {
        // As every knob's (issue 223): the arrows 1 BPM, Shift a tenth, Page Up and Down 10, to the next on each grid.
        const fine = e.shiftKey ? 'fine' : 'unit';
        const steps: Record<string, [1 | -1, 'unit' | 'fine' | 'coarse']> = {
          ArrowUp: [1, fine], ArrowRight: [1, fine], ArrowDown: [-1, fine], ArrowLeft: [-1, fine], PageUp: [1, 'coarse'], PageDown: [-1, 'coarse'],
        };
        if (e.key in steps) set(stepParam(TEMPO_STEPS, bpm, ...steps[e.key]));
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
        setDragged(clampBpm(drag.current.bpm + Math.round((drag.current.y - e.clientY) / DRAG_PIXELS)));
      }}
      onPointerUp={() => {
        if (dragged !== null) set(dragged);
        drag.current = null;
        setDragged(null);
      }}
      onPointerCancel={() => {
        drag.current = null;
        setDragged(null);
      }}
    >
      <span className="tempo-value">{bpm}</span>
      <span className="tempo-unit" data-clock={tempo.midi || undefined}>{unit(tempo)}</span>
      {/* Where the unit is hidden (861 to 1279 px), the MIDI clock's mark: a shape, not the edge's colour alone (issue 189). */}
      {tempo.midi && (
        <span className="tempo-clock" aria-hidden="true">
          <MidiIcon />
        </span>
      )}
    </div>
  );
}

/** Tap: the BPM follows the taps (issue 112), Hold's tapped rhythm apart. */
function TapButton({ tempo, onTap }: Pick<Props, 'tempo' | 'onTap'>) {
  const learn = useLearnable({ kind: 'action', id: 'tap' });
  const held = heldOff(tempo);
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
 * The tempo said to a screen reader once it settles, when something other than the BPM itself changed it: Tap, a MIDI
 * clock, a Controller's knob (issue 189). The BPM in focus says its own value; the Demo's tempo, and the person's
 * coming back as it stops, are the player's, not news. Each announcement is a new node in the status, so a BPM said
 * before (Tap to 126, 120 typed, Tap to 126 again) is said again: the same words in the same node change nothing a
 * screen reader hears.
 */
function TempoNews({ tempo }: { tempo: TempoState }) {
  const [news, setNews] = useState({ words: '', count: 0 });
  const player = useRef(tempo.player);
  const said = useRef(tempo.bpm);
  useEffect(() => {
    const handover = player.current !== tempo.player;
    player.current = tempo.player;
    if (handover || tempo.player || document.activeElement?.closest('.tempo-bpm')) {
      said.current = tempo.bpm;
      return;
    }
    if (tempo.bpm === said.current) return;
    const timer = setTimeout(() => {
      said.current = tempo.bpm;
      setNews((n) => ({ words: `Tempo ${tempo.bpm} BPM`, count: n.count + 1 }));
    }, SETTLE_MS);
    return () => clearTimeout(timer);
  }, [tempo.bpm, tempo.player]);
  return (
    <span className="visually-hidden" role="status">
      <span key={news.count}>{news.words}</span>
    </span>
  );
}

/**
 * The page's tempo in the header (issue 112, decided by the owner): from 861 px the BPM over Tap, a column of the
 * header's buttons (issue 154); narrower, the BPM alone among set-up, which opens a small field with the BPM and Tap
 * in it. Escape, a press elsewhere or Tab out of it closes it.
 */
export function TempoControl(props: Props) {
  const narrow = useMediaQuery(STACKED);
  const [open, setOpen] = useState(false);
  const { wrapper, button } = useHeaderPanel(open, setOpen);
  const panel = useUnderHeader<HTMLDivElement>();
  const news = <TempoNews tempo={props.tempo} />;
  if (!narrow)
    return (
      <div className="tempo" role="group" aria-label="Tempo">
        <Tooltip content={tempoTip(props.tempo)}>
          <TempoDial {...props} />
        </Tooltip>
        <TapButton {...props} />
        {news}
      </div>
    );
  return (
    <div className="tempo-menu" ref={wrapper}>
      {news}
      <Tooltip content={tempoTip(props.tempo, true)}>
        {/* Named with what it shows, "120 BPM" (WCAG 2.5.3, issue 189). */}
        <button ref={button} type="button" className="tool tempo-open" aria-label={`Tempo: ${props.tempo.bpm} ${unit(props.tempo)}`} aria-expanded={open} data-clock={props.tempo.midi || undefined} onClick={() => setOpen((o) => !o)}>
          <span className="tempo-value">{props.tempo.bpm}</span>
          <span className="tool-word" data-clock={props.tempo.midi || undefined}>{unit(props.tempo)}</span>
        </button>
      </Tooltip>
      {open && (
        <div ref={panel} className="tempo-panel" data-panel role="group" aria-label="Tempo">
          <Tooltip content={tempoTip(props.tempo)}>
            <TempoDial {...props} />
          </Tooltip>
          <TapButton {...props} />
        </div>
      )}
    </div>
  );
}
