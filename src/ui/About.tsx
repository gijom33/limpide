import { useEffect, useId, useRef, useState } from 'react';
import type { Welcome } from '../app/welcome';
import { Logo } from './Logo';

const SOURCE = 'https://github.com/gijom33/limpide';
/** Where to reach the author (issue 48). */
const AUTHOR = 'https://www.linkedin.com/in/guillaume-boillet-18208310';

/** "24 Oct 2026" from "2026-10-24". */
const day = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

/**
 * The About splash: the mark large, the version and the build it came from, and the credits. The logo opens it,
 * and so does the ⓘ button. It closes with its button, Escape, or a click outside it.
 *
 * A brand-new browser sees it once as a welcome, with a word on what to do first. Every time, its last row plays the
 * Demo (or, from a Share link, the shared sound), starts the first Tutorial, or closes it.
 */
export function About({
  open,
  welcome = null,
  onClose,
  onPlay,
  onTutorial,
}: {
  open: boolean;
  welcome?: Welcome | null;
  onClose: () => void;
  /** The welcome's play button: the Demo, or the Demo's riff on the shared Patch. */
  onPlay?: () => void;
  /** The welcome's Tutorial button: the first Tutorial, Bass. */
  onTutorial?: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useId();
  const credits = useRef<HTMLDListElement>(null);
  const more = useMoreBelow(credits, open);

  useEffect(() => {
    const d = dialog.current!;
    if (open && !d.open) d.showModal();
    else if (!open && d.open) d.close();
  }, [open]);

  const { version, commit, date, counted } = __BUILD__;
  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: a click on the backdrop; the keyboard closes it with Escape
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
            <p className="about-touch-hint">Touch and hold any control to see what it does.</p>
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
        {/* On a short window the credits scroll inside the card, faded at the foot while more is below, so the way in
            stays on the first screen, a 393 × 659 phone's included (issue 105). */}
        <dl ref={credits} className="about-credits" data-more={more || undefined}>
          <dt>Made by</dt>
          <dd>
            Designed and directed by{' '}
            <a href={AUTHOR} target="_blank" rel="noreferrer">
              Guillaume Boillet
            </a>
            ; code written with Claude Code, Anthropic’s AI coding agent, following Matt Pocock’s{' '}
            <a href="https://www.aihero.dev" target="_blank" rel="noreferrer">
              AI Hero
            </a>{' '}
            methodology.
          </dd>
          <dt>Sound</dt>
          <dd>The Web Audio API, in your browser</dd>
          <dt>Music</dt>
          <dd>The Demo and the Song are originals.</dd>
          <dt>License</dt>
          <dd>
            Free and open source under the MIT License: the code, the Presets, the music and the docs.{' '}
            <a href={SOURCE} target="_blank" rel="noreferrer">
              Source on GitHub
            </a>
            {' · '}
            <a href="./third-party-notices.txt" target="_blank" rel="noreferrer">
              Third-party notices
            </a>
          </dd>
          {counted && (
            <>
              <dt>Privacy</dt>
              <dd>
                Visits are counted with{' '}
                <a href="https://www.goatcounter.com" target="_blank" rel="noreferrer">
                  GoatCounter
                </a>
                : no cookies, no personal data stored. Like any web page it receives your IP address and browser, to
                count you once. Your sounds stay in your browser: a share link carries one after its #, which is never sent.
              </dd>
            </>
          )}
        </dl>
        {/* At the bottom every time, beside Close (the owner, 2026-10-27): the Demo, in the green of a key that
            plays, and the first Tutorial, in the accent a Tutorial's control wears. */}
        <div className="about-actions">
          <button
            type="button"
            className="tool about-demo"
            // The way in: the dialog's first focus, not the build link above (biome: a dialog's opening focus).
            // biome-ignore lint/a11y/noAutofocus: a modal dialog moves the focus into itself; this is where it lands
            autoFocus
            onClick={() => {
              onClose();
              onPlay?.();
            }}
          >
            {welcome === 'shared' ? 'Play the shared sound' : 'Play the Demo'}
          </button>
          <button
            type="button"
            className="tool tool-primary"
            onClick={() => {
              onClose();
              onTutorial?.();
            }}
          >
            Follow the Tutorial
          </button>
          <button type="button" className="tool" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </dialog>
  );
}

/** Whether the element, scrolled inside, has more below what it shows: its foot fades while it has. */
function useMoreBelow(element: React.RefObject<HTMLElement | null>, open: boolean): boolean {
  const [more, setMore] = useState(false);
  useEffect(() => {
    const e = element.current;
    if (!open || !e) return;
    const update = () => setMore(e.scrollTop + e.clientHeight < e.scrollHeight - 1);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(e);
    e.addEventListener('scroll', update, { passive: true });
    return () => {
      observer.disconnect();
      e.removeEventListener('scroll', update);
    };
  }, [element, open]);
  return more;
}
