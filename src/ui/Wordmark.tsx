import { useEffect, useId, useRef, useState } from 'react';
import { Logo } from './Logo';

const SOURCE = 'https://github.com/gijom33/limpide';

/** "24 Oct 2026" from "2026-10-24". */
const day = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

/**
 * The logo and name of the app, which open the About splash: the mark large, the version and the build it came
 * from, and the credits. It closes with its button, Escape, or a click outside it.
 */
export function Wordmark() {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useId();

  useEffect(() => {
    const d = dialog.current!;
    if (open && !d.open) d.showModal();
    else if (!open && d.open) d.close();
  }, [open]);

  const { version, commit, date } = __BUILD__;
  return (
    <>
      <h1 className="wordmark">
        <button type="button" className="wordmark-button" aria-haspopup="dialog" onClick={() => setOpen(true)}>
          <Logo />
          <span className="wordmark-text">Limpide</span>
        </button>
      </h1>
      <dialog
        ref={dialog}
        className="about"
        aria-labelledby={title}
        onClose={() => setOpen(false)}
        // A click on the backdrop lands on the dialog itself; its content fills it edge to edge.
        onClick={(e) => e.target === e.currentTarget && setOpen(false)}
      >
        <div className="about-body">
          <Logo size={72} />
          <h2 className="about-title wordmark-text" id={title}>
            Limpide
          </h2>
          <p className="about-tagline">A subtractive synthesizer that shows you what each stage does to the sound.</p>
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
            <dd>The Demo plays passages of classical, ragtime and folk pieces long out of copyright; the Song is an original.</dd>
            <dt>License</dt>
            <dd>
              Free and open source under the MIT License.{' '}
              <a href={SOURCE} target="_blank" rel="noreferrer">
                Source on GitHub
              </a>
            </dd>
          </dl>
          <button type="button" className="tool" onClick={() => setOpen(false)}>
            Close
          </button>
        </div>
      </dialog>
    </>
  );
}
