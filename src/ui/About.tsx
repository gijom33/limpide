import { useEffect, useId, useRef, useState } from 'react';
import type { Welcome } from '../app/welcome';
import { Logo } from './Logo';
import { BeadIdle } from './Mascot';

const SOURCE = 'https://github.com/gijom33/limpide';
/** Where to reach the author (issue 48). */
const AUTHOR = 'https://www.linkedin.com/in/guillaume-boillet-18208310';
/** Everything Bead does, written down (issue 163). */
const BEAD_SECRETS = `${SOURCE}/blob/main/docs/bead.md`;

/** "24 Oct 2026" from "2026-10-24". */
const day = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

/**
 * The About splash: the mark large, the version and the build it came from, and the credits. The logo opens it,
 * and so does the ⓘ button. It closes with its button, Escape, or a click outside it.
 *
 * A brand-new browser sees it once as a welcome, with a word on what to do first. Every time, its last row plays the
 * Demo (or, from a Share link, the shared sound), starts the Tour (issue 128), or closes it.
 *
 * While Bead's switch is on, Bead stands beside the logo (issue 163); a click on it shows its card of tricks in place of
 * the credits, and Back, Escape or Bead again return to them.
 */
export function About({
  open,
  welcome = null,
  onClose,
  onPlay,
  onTour,
  beadOn,
}: {
  open: boolean;
  welcome?: Welcome | null;
  onClose: () => void;
  /** The welcome's play button: the Demo, or the Demo's riff on the shared Patch. */
  onPlay?: () => void;
  /** The Tour: a first look at each Section (issue 128). */
  onTour?: () => void;
  /** Whether Bead's switch in Display is on: with it off, Bead is not in About either (issue 150, decision 9). */
  beadOn: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useId();
  const beadTitle = useId();
  const beadButton = useRef<HTMLButtonElement>(null);
  // Bead's card in place of the credits (issue 163); About opens on the credits every time.
  const [showsCard, setShowsCard] = useState(false);
  // What scrolls in the credits' place: the credits, or Bead's card.
  const [scroller, setScroller] = useState<HTMLElement | null>(null);
  const more = useMoreBelow(scroller, open);
  const back = () => {
    setShowsCard(false);
    beadButton.current?.focus();
  };

  useEffect(() => {
    const d = dialog.current!;
    if (open && !d.open) d.showModal();
    else if (!open && d.open) d.close();
    if (!open) setShowsCard(false);
  }, [open]);

  const { version, commit, date, counted } = __BUILD__;
  return (
    <dialog
      ref={dialog}
      className="about"
      aria-labelledby={title}
      onClose={onClose}
      // Escape on Bead's card goes back to the credits; on them, it closes About. So does any other close request (a
      // phone's back gesture), which comes as a cancel.
      onKeyDown={(e) => {
        if (e.key !== 'Escape' || !showsCard) return;
        e.preventDefault();
        back();
      }}
      onCancel={(e) => {
        if (!showsCard) return;
        e.preventDefault();
        back();
      }}
      // A click on the backdrop lands on the dialog itself; its content fills it edge to edge.
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="about-body">
        {/* Bead stands on the logo's baseline, to its right, so the logo stays in the middle over the name. */}
        <div className="about-mark">
          <Logo size={72} />
          {beadOn && (
            <button
              ref={beadButton}
              type="button"
              className="about-bead"
              aria-label="Bead, Limpide’s water drop: its tricks"
              aria-expanded={showsCard}
              onClick={() => setShowsCard((shows) => !shows)}
            >
              <BeadIdle />
            </button>
          )}
        </div>
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
        {/* On a short window the credits (or Bead's card) scroll inside About, faded at the foot while more is below, so the way in
            stays on the first screen, a 393 × 659 phone's included (issue 105). */}
        {showsCard ? (
          <section ref={setScroller} className="about-bead-card" aria-labelledby={beadTitle} data-more={more || undefined}>
            <div className="about-bead-head">
              <h3 id={beadTitle}>Bead</h3>
              <button type="button" className="tool" onClick={back}>
                Back
              </button>
            </div>
            <p>Limpide’s water drop, its tail the logo’s stroke: it lives on the page, on a section’s top edge, and makes no sound.</p>
            <p>It dances to what you play, answers every knob and fader you turn, giggles when you tickle it with the mouse and sprays droplets when clicked.</p>
            <p>Left alone a while, it does a funny turn now and then:</p>
            <ul>
              <li>a glass of water, then a burp</li>
              <li>a rain cloud and a big umbrella</li>
              <li>a water gun, a fountain show</li>
              <li>fishing off its edge for a ♪</li>
            </ul>
            <p>
              To send it away: Display’s Bead switch, for good; or play B, E, A, D (J, D, H, S on the computer keyboard) for
              this visit, and again to call it back.
            </p>
            <p>
              <a href={BEAD_SECRETS} target="_blank" rel="noreferrer">
                All its secrets
              </a>
            </p>
          </section>
        ) : (
          <dl ref={setScroller} className="about-credits" data-more={more || undefined}>
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
            <dt>Support</dt>
            <dd>
              {/* In the tip link's place (issue 172): what helps is a word to a friend, or a star. */}
              Enjoying Limpide? Share it, or{' '}
              <a href={SOURCE} target="_blank" rel="noreferrer">
                star it on GitHub
              </a>
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
        )}
        {/* At the bottom every time, beside Close (the owner, 2026-10-27): the Demo, in the green of a key that
            plays, and the Tour (issue 128), in the accent a Tutorial's control wears. */}
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
              onTour?.();
            }}
          >
            Take the Tour
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
function useMoreBelow(element: HTMLElement | null, open: boolean): boolean {
  const [more, setMore] = useState(false);
  useEffect(() => {
    if (!open || !element) return;
    const update = () => setMore(element.scrollTop + element.clientHeight < element.scrollHeight - 1);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    element.addEventListener('scroll', update, { passive: true });
    return () => {
      observer.disconnect();
      element.removeEventListener('scroll', update);
    };
  }, [element, open]);
  return more;
}
