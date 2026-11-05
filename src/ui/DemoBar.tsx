import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { phraseLength } from '../demo/phrase';
import type { Track } from '../demo/track';
import { FoldButton, useCardPlacement } from './cardPlacement';
import { useDocked } from './docked';
import { useFocusBack } from './focusBack';
import { useMediaQuery } from './hooks/useMediaQuery';
import { CloseIcon } from './icons';
import { arrowTarget } from './radioGroup';
import { STACKED } from './sections';

interface Props {
  /** The track, the part playing and when it began (the page's clock, ms); null once the Demo has stopped. */
  playing: { track: Track; index: number; startedAt: number } | null;
  /** The Demo was stopped by the person playing or touching something: the bar says so for a moment. */
  tookOver: boolean;
  onStop(): void;
  /** Play on from that part (its segment). */
  onJump(index: number): void;
  onPlayAgain(): void;
  onDismiss(): void;
}

/**
 * The Demo's card, docked at the bottom of the page while it plays (issue 50): the sound's name and Stop, what to
 * hear and see in plain words under it (issue 171), and which part of how many along the bottom, all in view however
 * far the page has scrolled. Its × closes the card and leaves the Demo playing (the owner, 2026-10-28; Claude's call,
 * open to the owner: Stop and the lit Demo button stop it); the next Demo brings it back. When a Note or a control
 * stops the Demo, it says so, so a first visitor does not think they broke it.
 *
 * In three and four across it sits in the window's bottom right corner and opens folded there, small, so it hides as
 * little as it can (issue 230, decided by the owner): its top row, and the parts as a thin line under it; unfolded, it
 * grows up and to the left from the corner. On a phone and in 2 × 2 it sits at the bottom's middle, its fold remembered.
 */
export function DemoBar({ playing, tookOver, onStop, onJump, onPlayAgain, onDismiss }: Props) {
  const card = useRef<HTMLElement>(null);
  useDocked(card, 'when-stacked');
  const across = !useMediaQuery(STACKED);
  const running = playing !== null;
  const place = useCardPlacement(card, 'demo', running ? 'playing' : 'stopped', { opensFolded: across && running });
  // The small card in the corner: too narrow for fifteen segments a pointer's target each, so they are a line there,
  // and ⌃ gives them back (issue 230).
  const small = across && place.folded && running;
  const [closed, setClosed] = useState(false);
  // Stop, or Escape on the parts (which stops the Demo), takes away the button the focus was on: it goes back to the
  // Demo button, not to the page (issue 189).
  const focusBack = useFocusBack(card, () => document.querySelector<HTMLElement>('button[aria-label="Demo"]'));
  // The segment the keyboard is on, while it is on one: the parts' one Tab stop follows it.
  const [focused, setFocused] = useState<number | null>(null);
  const parts = playing?.track.parts ?? [];
  const part = parts[playing?.index ?? 0];
  const lengths = parts.map((p) => phraseLength(p.phrase, playing!.track.bpm));
  useEffect(() => {
    if (!running) setClosed(false);
  }, [running]);
  return (
    // data-demo: a tap on the card is not the person taking over.
    <section ref={card} className="docked demo-bar" aria-label="Demo" data-demo data-small={small || undefined} hidden={(running && closed) || undefined} {...place.cardProps} {...focusBack}>
      {playing ? (
        <div className="demo-bar-top" {...place.handle}>
          <span className="demo-bar-name">{part.preset}</span>
          <FoldButton folded={place.folded} onToggle={place.toggleFold} />
          <button type="button" className="tool" onClick={onStop}>
            Stop
          </button>
          <button
            type="button"
            className="tool tool-icon"
            aria-label="Close the card"
            onClick={() => {
              setClosed(true);
              // The card goes, and focus with it: back to the Demo button, which stops it.
              document.querySelector<HTMLElement>('button[aria-label="Demo"]')?.focus();
            }}
          >
            <CloseIcon />
          </button>
          {/* What to hear and see, under the name (issue 171, decided by the owner). Every part's caption takes the
              same place, out of sight, so the room is the longest's at the card's width and the segments under it
              never move from part to part (Claude's call, open to the owner). */}
          <div className="demo-bar-says">
            {parts.map(
              (p, i) =>
                p.caption && (
                  // biome-ignore lint/suspicious/noArrayIndexKey: a part is its place in the track, which never changes
                  <span key={i} className="demo-bar-room" aria-hidden="true">
                    {p.caption}
                  </span>
                ),
            )}
            {part.caption && (
              <p className="demo-bar-caption" aria-live="polite">
                {part.caption}
              </p>
            )}
          </div>
          {/* The parts in a row of their own along the card's bottom, after the rest for Tab too (issues 99, 171); on
              the small card a line that only shows them (issue 230). */}
          {small ? (
            <div className="demo-bar-track demo-bar-line" role="img" aria-label={`Part ${playing.index + 1} of ${parts.length}`}>
              {parts.map((_, i) => (
                <span
                  // biome-ignore lint/suspicious/noArrayIndexKey: a part is its place in the track, which never changes
                  key={i}
                  className="demo-bar-segment"
                  data-done={i < playing.index || undefined}
                  style={{ flexGrow: lengths[i] }}
                >
                  {i === playing.index && <PartFill key={playing.startedAt} seconds={lengths[i]} startedAt={playing.startedAt} />}
                </span>
              ))}
            </div>
          ) : (
          <div className="demo-bar-track">
            <StepButton step={-1} from={playing.index} count={parts.length} onJump={onJump} />
            {/* A segment per part, as wide as the part is long: the parts played full, the one playing filling over
                its length, and a click on any plays on from it (the owner). From the keyboard they are one Tab stop:
                the arrows, Home and End move along them, Enter or Space plays from one, and the focus stays on it
                (issue 104). */}
            <span
              className="demo-bar-parts"
              role="group"
              aria-label={`Part ${playing.index + 1} of ${parts.length}`}
              onKeyDown={moveAlong}
              onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setFocused(null)}
            >
              {parts.map((p, i) => (
                <button
                  // The same button whatever plays, so the focus stays on it as the parts go by.
                  // biome-ignore lint/suspicious/noArrayIndexKey: a part is its place in the track, which never changes
                  key={i}
                  type="button"
                  aria-label={`Play from part ${i + 1}, ${p.preset}`}
                  aria-current={i === playing.index ? 'step' : undefined}
                  tabIndex={i === (focused ?? playing.index) ? 0 : -1}
                  data-done={i < playing.index || undefined}
                  data-current={i === playing.index || undefined}
                  style={{ flexGrow: lengths[i] }}
                  onFocus={() => setFocused(i)}
                  onClick={() => onJump(i)}
                >
                  <span className="demo-bar-segment">
                    {/* Anew on every start, so the fill starts again (a jump back to the same part too). */}
                    {i === playing.index && <PartFill key={playing.startedAt} seconds={lengths[i]} startedAt={playing.startedAt} />}
                  </span>
                </button>
              ))}
            </span>
            <StepButton step={1} from={playing.index} count={parts.length} onJump={onJump} />
          </div>
          )}
        </div>
      ) : (
        tookOver && (
          <div className="demo-bar-top">
            <p className="demo-bar-caption" role="status">
              The Demo stopped: you are playing now.
            </p>
            <button type="button" className="tool" onClick={onPlayAgain}>
              Play again
            </button>
            <button type="button" className="tool tool-icon" aria-label="Close" onClick={onDismiss}>
              <CloseIcon />
            </button>
          </div>
        )
      )}
    </section>
  );
}

/** The arrows move the focus to the next or previous part, Home and End to the first and last; nothing plays yet. */
function moveAlong(e: KeyboardEvent<HTMLElement>) {
  arrowTarget(e, 'button', { wrap: false })?.focus();
}

/**
 * Previous part or Next part, on phones only (issue 99, decided by the owner): there the row is too narrow for fifteen
 * segments a finger wide, so these two are the full-size way along them. Past the first or the last part it is greyed
 * out, and keeps the focus (issue 104's Next).
 */
function StepButton({ step, from, count, onJump }: { step: -1 | 1; from: number; count: number; onJump(index: number): void }) {
  const to = from + step;
  const none = to < 0 || to >= count;
  return (
    <button
      type="button"
      className="tool tool-icon demo-bar-step"
      aria-label={step < 0 ? 'Previous part' : 'Next part'}
      aria-disabled={none || undefined}
      onClick={() => !none && onJump(to)}
    >
      {step < 0 ? '‹' : '›'}
    </button>
  );
}

/**
 * The playing part's segment filling over its length, from when the part began. Its timing is fixed when it appears (a
 * new part, or a jump, gives a new one): worked out again on a later render, the fill would jump.
 */
function PartFill({ seconds, startedAt }: { seconds: number; startedAt: number }) {
  const [style] = useState(() => ({ animationDuration: `${seconds}s`, animationDelay: `${(startedAt - performance.now()) / 1000}s` }));
  return <span className="demo-bar-fill" style={style} />;
}
