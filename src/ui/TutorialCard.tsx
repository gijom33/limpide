import { type RefObject, useEffect, useRef } from 'react';
import { PARAMS } from '../patch/patch';
import { inDisplay, type Step, type Tutorial, targetText } from '../tutorial/tutorial';
import { endLine, FROM_INIT } from '../tutorial/tutorials';
import { CardShell } from './CardShell';
import { bringClear } from './docked';
import { NoteIcon } from './icons';
import type { Guide } from './mascotCling';
import { reveal } from './reveal';

interface Props {
  tutorial: Tutorial;
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

/**
 * The control a Step asks for: its Parameter's or choice's, or the Display option's (inside the Display panel). A note
 * value has no knob of its own: the Rate's turns it, Learn knowing it as the Rate's (issue 137).
 */
function selectorOf(step: Step): string {
  if (step.kind === 'display') return `[data-overlay="${step.overlay}"]`;
  return `[data-learn="${step.kind}:${step.kind === 'param' ? (PARAMS[step.id].knob ?? step.id) : step.id}"]`;
}
/** The Display button, which stands for an option in its panel while the panel is shut. */
const DISPLAY_BUTTON = 'button[aria-label="Display"]';

/**
 * What Bead points the way to through a Tutorial (issue 151): the Step's ringed control, the Display button standing
 * for an option in its shut panel until the Step is made; nothing on the first card; on the last, the last Step's
 * control still, the Tutorial finished.
 */
export function tutorialGuide(tutorial: Tutorial, index: number, done: readonly boolean[]): Guide {
  const steps = tutorial.steps;
  const step = steps[Math.min(index, steps.length - 1)];
  const made = index >= 0 && index < steps.length && done[index];
  return {
    selector: index >= 0 && step ? selectorOf(step) : null,
    standIn: index >= 0 && index < steps.length && inDisplay(step) && !made ? DISPLAY_BUTTON : null,
    step: `${tutorial.preset} ${index}`,
    made,
    finished: index >= steps.length,
  };
}

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
      if (inDisplay(step) && !element?.checkVisibility()) element = made ? null : document.querySelector(DISPLAY_BUTTON);
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
 * A Tutorial's card, docked at the bottom of the page (issue 57): what to do, then what to hear and see, with Back,
 * "Do it for me", Next, Listen and Quit. Picked, it takes the focus on its Start; the Steps never take it from the
 * control being turned. Each new text is announced.
 */
export function TutorialCard({ tutorial, index, done, differs, listening, onListen, onBack, onNext, onDoIt, onMatch, onQuit }: Props) {
  const steps = tutorial.steps;
  const step = index >= 0 ? steps[index] : undefined;
  const made = step ? done[index] : false;
  const card = useRef<HTMLElement>(null);
  useRing(step, made, card);

  // Until the Step is made, Next says it is unavailable but keeps the focus, so pressing it leaves the keyboard there.
  const waiting = !!step && !made;
  const primary = index < steps.length && (
    <button type="button" className="tool tool-primary" aria-disabled={waiting || undefined} onClick={() => !waiting && onNext()}>
      {index < 0 ? 'Start' : index === steps.length - 1 ? 'Finish' : 'Next'}
    </button>
  );
  const progress = step ? `Step ${index + 1} of ${steps.length}` : index < 0 ? `${steps.length} steps` : 'Done';
  const actions = {
    start: (
      <button type="button" className="tool" aria-pressed={listening} onClick={onListen}>
        <NoteIcon />
        Listen
      </button>
    ),
    before: (
      <>
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
      </>
    ),
    after: (
      <>
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
      </>
    ),
  };
  return (
    <CardShell
      card={card}
      kind="tutorial"
      opening={tutorial}
      label={`Tutorial: ${tutorial.preset}`}
      name={tutorial.preset}
      progress={progress}
      made={made}
      closeLabel="Quit the tutorial"
      onClose={onQuit}
      primary={primary}
      actions={actions}
    >
      {index < 0 && (
        <>
          {/* Its own words first, not its Preset's description (issue 129, decision 6). */}
          <p>{tutorial.intro}</p>
          <p className="card-then">{FROM_INIT}</p>
        </>
      )}
      {step && (
        <>
          <p className="tutorial-say" data-done={made || undefined}>
            {step.say}
          </p>
          {made && <p className="card-then">{step.note}</p>}
        </>
      )}
      {index >= steps.length && (
        <>
          <p>{tutorial.summary}</p>
          <p className="card-then">
            {differs.length ? `Not quite the Preset yet: ${differs.join(', ')}. Keep your version, or match it.` : `This is the ${tutorial.preset} Preset, built by you.`}
          </p>
          <p className="card-then">{endLine(tutorial)}</p>
        </>
      )}
    </CardShell>
  );
}
