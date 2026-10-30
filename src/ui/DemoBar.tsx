import { useEffect, useRef, useState } from 'react';
import type { Part } from '../demo/track';
import { FoldButton, useCardPlacement } from './cardPlacement';
import { useDocked } from './docked';
import { CloseIcon } from './icons';

interface Props {
  /** The part playing, where it falls in the track and every part's Preset; null once the Demo has stopped. */
  playing: { part: Part; index: number; names: readonly string[] } | null;
  /** The Demo was stopped by the person playing or touching something: the bar says so for a moment. */
  tookOver: boolean;
  onStop(): void;
  /** Play on from that part (a dot). */
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
  const running = playing !== null;
  useEffect(() => {
    if (!running) setClosed(false);
  }, [running]);
  return (
    // data-demo: a tap on the card is not the person taking over.
    <section ref={card} className="docked demo-bar" aria-label="Demo" data-demo hidden={(running && closed) || undefined} {...place.cardProps}>
      {playing ? (
        <>
          <div className="demo-bar-top" {...place.handle}>
            <span className="demo-bar-name">{playing.part.preset}</span>
            {/* A dot per part: which is playing, and a click plays on from any of them (the owner). */}
            <span className="demo-bar-parts" role="group" aria-label={`Part ${playing.index + 1} of ${playing.names.length}`}>
              {playing.names.map((name, i) => (
                <button
                  // biome-ignore lint/suspicious/noArrayIndexKey: a dot per part, in order; a Preset can play twice
                  key={i}
                  type="button"
                  aria-label={`Play from part ${i + 1}, ${name}`}
                  aria-current={i === playing.index ? 'step' : undefined}
                  data-done={i < playing.index || undefined}
                  data-current={i === playing.index || undefined}
                  onClick={() => onJump(i)}
                />
              ))}
            </span>
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
          </div>
          {playing.part.caption && (
            <p className="demo-bar-caption" aria-live="polite">
              {playing.part.caption}
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
