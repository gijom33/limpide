import { type FocusEvent, type RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { inDisplay, type Step, type Tutorial, targetText } from '../tutorial/tutorial';
import { FoldButton, useCardPlacement } from './cardPlacement';
import { bringClear, useDocked } from './docked';
import { CloseIcon, NoteIcon } from './icons';
import { reveal } from './reveal';

interface Props {
  tutorial: Tutorial;
  /** The Preset's about line, for the first card. */
  about: string;
  /** −1 for the first card, then each Step, then `steps.length` for the last card. */
  index: number;
  /** Which Steps have been made. */
  done: readonly boolean[];
  /** At the last card: the controls that differ from the Preset, by name. */
  differs: readonly string[];
  listening: boolean;
  onListen(): void;
  onBack(): void;
  onNext(): void;
  onDoIt(): void;
  onMatch(): void;
  onQuit(): void;
}

/** The control a Step asks for: its Parameter's or choice's, or the Display option's (inside the Display panel). */
const selectorOf = (step: Step) => (step.kind === 'display' ? `[data-overlay="${step.overlay}"]` : `[data-learn="${step.kind}:${step.id}"]`);

/**
 * Rings the Step's control, with its target above it ("→ 800 Hz"), and marks its section in the phone's strip. A
 * Display option rings the Display button until its panel opens. A control on a hidden tab, or out of sight, is
 * brought into view between the header and the card, with the Viewer the Step points at where both fit; once the Step
 * is made its note speaks of that Viewer, so the Viewer comes first (issue 105).
 */
function useRing(step: Step | undefined, made: boolean, card: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!step) return;
    let marked: Element[] = [];
    // A click that moves the card to the next Step reaches this Step's listener too: once it is gone, it marks nothing.
    let live = true;
    const clear = () => {
      for (const e of marked) {
        e.removeAttribute('data-tutorial');
        e.removeAttribute('data-tutorial-target');
      }
      marked = [];
    };
    const mark = () => {
      clear();
      if (!live) return null;
      let element = document.querySelector(selectorOf(step));
      // Until the Display option is on (or the Snapshot taken), the Display button stands for it while its panel is shut;
      // once made, nothing.
      if (inDisplay(step) && !element?.checkVisibility()) element = made ? null : document.querySelector('button[aria-label="Display"]');
      if (!element) return null;
      element.setAttribute('data-tutorial', '');
      if (step.kind === 'param' || step.kind === 'choice') element.setAttribute('data-tutorial-target', `→ ${targetText(step)}`);
      marked.push(element);
      const section = element.closest('section[aria-label]')?.getAttribute('aria-label');
      const strip = section && document.querySelector(`.section-strip [data-section="${section}"]`);
      if (strip) {
        strip.setAttribute('data-tutorial', '');
        marked.push(strip);
      }
      return element;
    };
    const element = mark();
    const viewer = step.viewer ? document.querySelector(`[aria-label="${step.viewer}"]`) : null;
    viewer?.setAttribute('data-tutorial-viewer', '');
    if (element) reveal(element);
    // After the tab it was on has had a frame to show, and the card its new height.
    const scroll = setTimeout(() => {
      const behavior = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
      // The Display button, standing for an option in its panel, is in the header: the header comes back for it.
      if (element?.closest('header')) element.scrollIntoView({ block: 'nearest', behavior });
      else if (card.current) {
        const both = [element, viewer].filter((e) => e !== null);
        bringClear(card.current, made ? both.reverse() : both, behavior);
      }
    }, 50);
    // A tab switched or the Display panel opened by the person: the ring follows its control.
    let again: ReturnType<typeof setTimeout> | undefined;
    const follow = () => {
      clearTimeout(again);
      again = setTimeout(mark, 0);
    };
    document.addEventListener('click', follow);
    return () => {
      live = false;
      clearTimeout(again);
      clearTimeout(scroll);
      document.removeEventListener('click', follow);
      clear();
      viewer?.removeAttribute('data-tutorial-viewer');
    };
  }, [step, made, card]);
}

/**
 * Where the keyboard's focus goes on the card (issue 104): to its way forward (Start) when a Tutorial is picked, after
 * the welcome or the panel it was picked from has put it back on their buttons; and there again when a button it was on
 * goes (Back on the first card, "Do it for me" once the Step is made, Finish at the end: Done), never to the page.
 */
function useCardFocus(card: RefObject<HTMLElement | null>, tutorial: Tutorial) {
  const forward = () => card.current?.querySelector<HTMLElement>('.tool-primary')?.focus();
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new Tutorial is the trigger; forward reads the card's ref
  useEffect(() => {
    const frame = requestAnimationFrame(forward);
    return () => cancelAnimationFrame(frame);
  }, [tutorial]);
  // The last element the focus was on in the card, to tell a button that went from a click elsewhere on the page.
  const last = useRef<Element | null>(null);
  useLayoutEffect(() => {
    if (last.current && !last.current.isConnected && document.activeElement === document.body) forward();
  });
  return { onFocus: (e: FocusEvent) => (last.current = e.target) };
}

/**
 * A Tutorial's card, docked at the bottom of the page (issue 57): what to do, then what to hear and see, with Back,
 * "Do it for me", Next, Listen and Quit. Picked, it takes the focus on its Start; the Steps never take it from the
 * control being turned. Each new text is announced.
 */
export function TutorialCard({ tutorial, about, index, done, differs, listening, onListen, onBack, onNext, onDoIt, onMatch, onQuit }: Props) {
  const steps = tutorial.steps;
  const step = index >= 0 ? steps[index] : undefined;
  const made = step ? done[index] : false;
  const card = useRef<HTMLElement>(null);
  // On a phone the card shows two lines; a tap on them, or on +, shows the rest (issue 40, decision 7). A made Step's
  // note shows whole, as it says what to hear and see (issue 105).
  const [expanded, setExpanded] = useState(false);
  useRing(step, made, card);
  useDocked(card);
  const place = useCardPlacement(card, 'tutorial', tutorial.preset);
  const focus = useCardFocus(card, tutorial);

  // Until the Step is made, Next says it is unavailable but keeps the focus, so pressing it leaves the keyboard there.
  const waiting = !!step && !made;
  const primary = index < steps.length && (
    <button type="button" className="tool tool-primary" aria-disabled={waiting || undefined} onClick={() => !waiting && onNext()}>
      {index < 0 ? 'Start' : index === steps.length - 1 ? 'Finish' : 'Next'}
    </button>
  );
  const progress = step ? `Step ${index + 1} of ${steps.length}` : index < 0 ? `${steps.length} steps` : 'Done';
  return (
    <section ref={card} className="docked tutorial" aria-label={`Tutorial: ${tutorial.preset}`} data-expanded={expanded || undefined} data-made={made || undefined} {...place.cardProps} {...focus}>
      <div className="tutorial-top" {...place.handle}>
        <span className="tutorial-name">{tutorial.preset}</span>
        <span className="tutorial-progress" data-done={made || undefined}>
          {progress}
        </span>
        <button type="button" className="tool tool-icon tutorial-more" aria-expanded={expanded} aria-label="Show the whole text" onClick={() => setExpanded((e) => !e)}>
          {expanded ? '−' : '+'}
        </button>
        {/* Folded, the card keeps its way forward in the top row. */}
        {place.folded && primary}
        <FoldButton folded={place.folded} onToggle={place.toggleFold} />
        <button type="button" className="tool tool-icon" aria-label="Quit the tutorial" onClick={onQuit}>
          <CloseIcon />
        </button>
      </div>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: a tap on the text is the touch shortcut; the + button is the keyboard's and the screen reader's */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: as above, + is the keyboard route */}
      <div className="tutorial-words" aria-live="polite" onClick={() => setExpanded((e) => !e)}>
        {index < 0 && (
          <>
            <p>{about}</p>
            {tutorial.intro && <p>{tutorial.intro}</p>}
            <p className="tutorial-then">Build it from Init, one control at a time. Play any Note, or press Listen, to hear each change.</p>
          </>
        )}
        {step && (
          <>
            <p className="tutorial-say" data-done={made || undefined}>
              {step.say}
            </p>
            {made && <p className="tutorial-then">{step.note}</p>}
          </>
        )}
        {index >= steps.length && (
          <>
            <p>{tutorial.summary}</p>
            <p className="tutorial-then">
              {differs.length ? `Not quite the Preset yet: ${differs.join(', ')}. Keep your version, or match it.` : `This is the ${tutorial.preset} Preset, built by you.`}
            </p>
          </>
        )}
      </div>
      <div className="tutorial-actions">
        <button type="button" className="tool" aria-pressed={listening} onClick={onListen}>
          <NoteIcon />
          Listen
        </button>
        <span className="tutorial-spacer" />
        {index >= 0 && (
          <button type="button" className="tool" onClick={onBack}>
            Back
          </button>
        )}
        {step && !made && (
          <button type="button" className="tool" onClick={onDoIt}>
            Do it for me
          </button>
        )}
        {!place.folded && primary}
        {index >= steps.length && differs.length > 0 && (
          <button type="button" className="tool" onClick={onMatch}>
            Match the Preset
          </button>
        )}
        {index >= steps.length && (
          <button type="button" className="tool tool-primary" onClick={onQuit}>
            Done
          </button>
        )}
      </div>
    </section>
  );
}
