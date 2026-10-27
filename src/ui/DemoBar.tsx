import { useRef } from 'react';
import type { Part } from '../demo/track';
import { useDocked } from './docked';
import { CloseIcon } from './icons';

interface Props {
  /** The part playing and where it falls in the track; null once the Demo has stopped. */
  playing: { part: Part; index: number; count: number } | null;
  /** The Demo was stopped by the person playing or touching something: the bar says so for a moment. */
  tookOver: boolean;
  onStop(): void;
  onPlayAgain(): void;
  onDismiss(): void;
}

/**
 * The Demo's card, docked at the bottom of the page while it plays (issue 50): the sound's name, what to hear and
 * see in plain words, which part of how many, and Stop, all in view however far the page has scrolled. When a Note
 * or a control stops the Demo, it says so, so a first visitor does not think they broke it.
 */
export function DemoBar({ playing, tookOver, onStop, onPlayAgain, onDismiss }: Props) {
  const card = useRef<HTMLElement>(null);
  useDocked(card, 'when-scrolling');
  return (
    // data-demo: a tap on the card is not the person taking over.
    <section ref={card} className="docked demo-bar" aria-label="Demo" data-demo>
      {playing ? (
        <>
          <div className="demo-bar-top">
            <span className="demo-bar-name">{playing.part.preset}</span>
            <span className="demo-bar-parts" role="img" aria-label={`Part ${playing.index + 1} of ${playing.count}`}>
              {Array.from({ length: playing.count }, (_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: a dot per part, in order; the parts never change
                <span key={i} data-done={i < playing.index || undefined} data-current={i === playing.index || undefined} />
              ))}
            </span>
            <button type="button" className="tool" onClick={onStop}>
              Stop
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
