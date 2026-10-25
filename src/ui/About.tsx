import { useEffect, useId, useRef } from 'react';
import type { Welcome } from '../app/welcome';
import { Logo } from './Logo';

const SOURCE = 'https://github.com/gijom33/limpide';

/** "24 Oct 2026" from "2026-10-24". */
const day = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

/**
 * The About splash: the mark large, the version and the build it came from, and the credits. The logo opens it,
 * and so does the ⓘ button. It closes with its button, Escape, or a click outside it.
 *
 * A brand-new browser sees it once as a welcome, offering to play the Demo (or, from a Share link, the shared
 * sound) or to explore on its own.
 */
export function About({
  open,
  welcome = null,
  onClose,
  onPlay,
}: {
  open: boolean;
  welcome?: Welcome | null;
  onClose: () => void;
  /** The welcome's play button: the Demo, or the Demo's riff on the shared Patch. */
  onPlay?: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useId();

  useEffect(() => {
    const d = dialog.current!;
    if (open && !d.open) d.showModal();
    else if (!open && d.open) d.close();
  }, [open]);

  const { version, commit, date } = __BUILD__;
  return (
    <dialog
      ref={dialog}
      className="about"
      aria-labelledby={title}
      onClose={onClose}
      // A click on the backdrop lands on the dialog itself; its content fills it edge to edge.
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="about-body">
        <Logo size={72} />
        <h2 className="about-title wordmark-text" id={title}>
          Limpide
        </h2>
        <p className="about-tagline">A subtractive synthesizer that shows you what each stage does to the sound.</p>
        {welcome && (
          <div className="about-welcome">
            <p>
              {welcome === 'shared'
                ? 'Someone shared a sound with you. Hear it, then turn any knob and see what changes.'
                : 'Hear what it can do, or start playing: your keyboard, the piano or any knob.'}
            </p>
            <div className="about-actions">
              <button
                type="button"
                className="tool tool-primary"
                onClick={() => {
                  onClose();
                  onPlay?.();
                }}
              >
                {welcome === 'shared' ? 'Play the shared sound' : 'Play the Demo'}
              </button>
              <button type="button" className="tool" onClick={onClose}>
                Explore
              </button>
            </div>
          </div>
        )}
        <p className="about-version">
          Version {version}
          {commit && (
            <>
              {' · build '}
              <a href={`${SOURCE}/commit/${commit}`} target="_blank" rel="noreferrer">
                {commit}
              </a>
            </>
          )}
          {' · '}
          {day(date)}
        </p>
        <dl className="about-credits">
          <dt>Made by</dt>
          <dd>Guillaume Boillet</dd>
          <dt>Sound</dt>
          <dd>The Web Audio API, in your browser</dd>
          <dt>Music</dt>
          <dd>The Demo and the Song are originals.</dd>
          <dt>License</dt>
          <dd>
            Free and open source under the MIT License.{' '}
            <a href={SOURCE} target="_blank" rel="noreferrer">
              Source on GitHub
            </a>
          </dd>
        </dl>
        {!welcome && (
          <button type="button" className="tool" onClick={onClose}>
            Close
          </button>
        )}
      </div>
    </dialog>
  );
}
