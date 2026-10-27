import { useEffect, useRef, useState } from 'react';
import { type Step, type Tutorial, targetText } from '../tutorial/tutorial';
import { useDocked } from './docked';
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
 * Rings the Step's control, with its target beside it ("→ 800 Hz"), and marks its section in the phone's strip. A
 * Display option rings the Display button until its panel opens. A control on a hidden tab, or out of sight, is
 * brought into view above the card.
 */
function useRing(step: Step | undefined, made: boolean) {
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
      // Until the Display option is on, the Display button stands for it while its panel is shut; once on, nothing.
      if (step.kind === 'display' && !element?.checkVisibility()) element = made ? null : document.querySelector('button[aria-label="Display"]');
      if (!element) return null;
      element.setAttribute('data-tutorial', '');
      if (step.kind !== 'display') element.setAttribute('data-tutorial-target', `→ ${targetText(step)}`);
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
    let scroll: ReturnType<typeof setTimeout> | undefined;
    if (element) {
      reveal(element);
      // After the tab it was on has had a frame to show.
      scroll = setTimeout(() => {
        const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;
        element.scrollIntoView({ block: 'nearest', behavior: smooth ? 'smooth' : 'auto' });
      }, 50);
    }
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
    };
  }, [step, made]);
}

/**
 * A Tutorial's card, docked at the bottom of the page (issue 57): what to do, then what to hear and see, with Back,
 * "Do it for me", Next, Listen and Quit. It never takes the focus; each new text is announced.
 */
export function TutorialCard({ tutorial, about, index, done, differs, listening, onListen, onBack, onNext, onDoIt, onMatch, onQuit }: Props) {
  const steps = tutorial.steps;
  const step = index >= 0 ? steps[index] : undefined;
  const made = step ? done[index] : false;
  const card = useRef<HTMLElement>(null);
  // On a phone the card shows two lines; a tap on them, or on +, shows the rest (issue 40, decision 7).
  const [expanded, setExpanded] = useState(false);
  useRing(step, made);
  useDocked(card);

  const progress = step ? `Step ${index + 1} of ${steps.length}` : index < 0 ? `${steps.length} steps` : 'Done';
  return (
    <section ref={card} className="docked tutorial" aria-label={`Tutorial: ${tutorial.preset}`} data-expanded={expanded || undefined}>
      <div className="tutorial-top">
        <span className="tutorial-name">{tutorial.preset}</span>
        <span className="tutorial-progress">{progress}</span>
        <button type="button" className="tool tool-icon tutorial-more" aria-expanded={expanded} aria-label="Show the whole text" onClick={() => setExpanded((e) => !e)}>
          {expanded ? '−' : '+'}
        </button>
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
        {index < steps.length && (
          <button type="button" className="tool tool-primary" disabled={!!step && !made} onClick={onNext}>
            {index < 0 ? 'Start' : index === steps.length - 1 ? 'Finish' : 'Next'}
          </button>
        )}
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
