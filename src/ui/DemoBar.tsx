import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { phraseLength } from '../demo/phrase';
import type { Track } from '../demo/track';
import { FoldButton, useCardPlacement } from './cardPlacement';
import { useDocked } from './docked';
import { CloseIcon } from './icons';
import { arrowTarget } from './radioGroup';

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
 * The Demo's card, docked at the bottom of the page while it plays (issue 50): the sound's name, what to hear and
 * see in plain words, which part of how many, and Stop, all in view however far the page has scrolled. Its ×
 * closes the card and leaves the Demo playing (the owner, 2026-10-28; Claude's call, open to the owner: Stop and the
 * lit Demo button stop it); the next Demo brings it back. When a Note or a control stops the Demo, it says so, so a
 * first visitor does not think they broke it.
 */
export function DemoBar({ playing, tookOver, onStop, onJump, onPlayAgain, onDismiss }: Props) {
  const card = useRef<HTMLElement>(null);
  useDocked(card, 'when-scrolling');
  const place = useCardPlacement(card, 'demo', playing ? 'playing' : 'stopped');
  const [closed, setClosed] = useState(false);
  // The segment the keyboard is on, while it is on one: the parts' one Tab stop follows it.
  const [focused, setFocused] = useState<number | null>(null);
  const running = playing !== null;
  const parts = playing?.track.parts ?? [];
  const part = parts[playing?.index ?? 0];
  const lengths = parts.map((p) => phraseLength(p.phrase, playing!.track.bpm));
  useEffect(() => {
    if (!running) setClosed(false);
  }, [running]);
  return (
    // data-demo: a tap on the card is not the person taking over.
    <section ref={card} className="docked demo-bar" aria-label="Demo" data-demo hidden={(running && closed) || undefined} {...place.cardProps}>
      {playing ? (
        <>
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
            {/* The parts in a row of their own under the name and the buttons, after them for Tab too (issue 99). */}
            <div className="demo-bar-track">
              <StepButton label="Previous part" to={playing.index - 1} count={parts.length} onJump={onJump} />
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
              <StepButton label="Next part" to={playing.index + 1} count={parts.length} onJump={onJump} />
            </div>
          </div>
          {part.caption && (
            <p className="demo-bar-caption" aria-live="polite">
              {part.caption}
            </p>
          )}
        </>
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
function StepButton({ label, to, count, onJump }: { label: string; to: number; count: number; onJump(index: number): void }) {
  const none = to < 0 || to >= count;
  return (
    <button type="button" className="tool tool-icon demo-bar-step" aria-label={label} aria-disabled={none || undefined} onClick={() => !none && onJump(to)}>
      {label.startsWith('Previous') ? '‹' : '›'}
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
