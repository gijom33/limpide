import { type RefObject, useEffect, useRef, useState } from 'react';
import { formatParam, PARAMS, type ParamId } from '../patch/patch';
import { inDisplay, type Step, type Tutorial, targetText } from '../tutorial/tutorial';
import { endLine, FROM_INIT } from '../tutorial/tutorials';
import { CardShell } from './CardShell';
import { pinned } from './cardPlacement';
import { DISPLAY_BUTTON, optionOrDisplay, overlaySelector } from './displayOption';
import { bringClear } from './docked';
import { scrollBehavior } from './glide';
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
  /** The Tutorial after this one, which the last card's way forward starts (issue 190, decision 1); none after the last. */
  next?: Tutorial;
  listening: boolean;
  onListen(): void;
  onBack(): void;
  onNext(): void;
  onDoIt(): void;
  onMatch(): void;
  onStartNext(next: Tutorial): void;
  onQuit(): void;
  /** Closes the Display panel. */
  onShutDisplay(): void;
}

/** What Next before the Step is made says, the first time in a Tutorial (issue 190, decision 2). */
export const NEXT_HINT = 'Turn the ringed control first, or press Do it for me.';

/**
 * The control a Step asks for: its Parameter's or choice's, or the Display option's (inside the Display panel). A note
 * value has no knob of its own: the Rate's turns it, Learn knowing it as the Rate's (issue 137).
 */
function selectorOf(step: Step): string {
  return controlsOf(step)[0].selector;
}
const knobOf = (id: ParamId) => `[data-learn="param:${PARAMS[id].knob ?? id}"]`;

/**
 * Each control a Step asks for, the first leading, with the target it shows above it ("→ 800 Hz"): one, or a Step's
 * several faders (issue 190, decision 3), whose targets go without the arrow so that four side by side stay apart.
 */
function controlsOf(step: Step): { selector: string; target?: string }[] {
  if (step.kind === 'params') return step.faders.map(({ id, to }) => ({ selector: knobOf(id), target: formatParam(id, to) }));
  if (step.kind === 'display') return [{ selector: overlaySelector(step.overlay) }];
  if (step.kind === 'action') return [{ selector: `[data-learn="action:${step.id}"]` }];
  return [{ selector: step.kind === 'param' ? knobOf(step.id) : `[data-learn="choice:${step.id}"]`, target: `→ ${targetText(step)}` }];
}
/** What the keyboard can rest on: the element itself, or the first in it the Tab key reaches. */
const FOCUSABLE = '[tabindex="0"], button:not([disabled]), input, select';
const focusableIn = (element: Element) =>
  (element.matches(FOCUSABLE) ? element : element.querySelector(FOCUSABLE)) as HTMLElement | SVGElement | null;

/** The Step's control on the page as it is shown now: its own, or the Display button standing for it. */
function controlOf(step: Step): Element | null {
  const element = document.querySelector(selectorOf(step));
  return inDisplay(step) ? optionOrDisplay(element) : element;
}

/**
 * The keyboard's short way between the card and the Step's control (issue 189, decision 2): "Go to the control" puts
 * the focus on it, shown between the header and the card, and Escape there brings it back to the card's way forward,
 * instead of some 30 to 50 Tabs each way. Escape closes the Display panel as it leaves it, the focus no longer in it.
 */
function useWayToControl(step: Step | undefined, card: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!step) return;
    const onKey = (e: KeyboardEvent) => {
      const control = controlOf(step);
      const target = e.target as Element;
      // MIDI Learn's Escape is its own, and so is a menu's or a field's inside the control.
      if (e.key !== 'Escape' || !control?.contains(target) || target.closest('[role="menu"], [role="listbox"], input, select')) return;
      if (document.querySelector('main[data-learning]')) return;
      e.preventDefault();
      e.stopPropagation();
      card.current?.querySelector<HTMLElement>('.tool-primary')?.focus();
    };
    // Before the Display panel's own Escape, which would take the focus to its button.
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [step, card]);
  return () => {
    const control = step && controlOf(step);
    if (!control || !card.current) return;
    reveal(control); // its tab shown first
    const target = focusableIn(control);
    if (!target) return;
    // The Display button, standing for an option in its shut panel, is in the header: the header comes back for it.
    if (target.closest('header')) return target.focus();
    target.focus({ preventScroll: true });
    bringClear(card.current, [target], scrollBehavior());
  };
}

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
      if (!live) return [];
      const elements: Element[] = [];
      for (const { selector, target } of controlsOf(step)) {
        let element = document.querySelector(selector);
        // Until the Display option is on (or the Snapshot taken), the Display button stands for it while its panel is
        // shut; once made, nothing.
        if (inDisplay(step) && !element?.checkVisibility()) element = made ? null : document.querySelector(DISPLAY_BUTTON);
        if (!element) continue;
        element.setAttribute('data-tutorial', '');
        if (target) element.setAttribute('data-tutorial-target', target);
        marked.push(element);
        elements.push(element);
      }
      const section = elements[0]?.closest('section[aria-label]')?.getAttribute('aria-label');
      const strip = section && document.querySelector(`.section-strip [data-section="${section}"]`);
      if (strip) {
        strip.setAttribute('data-tutorial', '');
        marked.push(strip);
      }
      return elements;
    };
    const elements = mark();
    const element = elements[0] ?? null;
    const viewer = step.viewer ? document.querySelector(`[aria-label="${step.viewer}"]`) : null;
    viewer?.setAttribute('data-tutorial-viewer', '');
    if (element) reveal(element);
    // After the tab it was on has had a frame to show, and the card its new height.
    const scroll = setTimeout(() => {
      const behavior = scrollBehavior();
      // The Display button, standing for an option in its panel, is in the header: the header comes back for it.
      if (element?.closest('header')) element.scrollIntoView({ block: 'nearest', behavior });
      else if (card.current) {
        const both = [...elements, viewer].filter((e) => e !== null);
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
export function TutorialCard({ tutorial, index, done, differs, next, listening, onListen, onBack, onNext, onDoIt, onMatch, onStartNext, onQuit, onShutDisplay }: Props) {
  const steps = tutorial.steps;
  const step = index >= 0 ? steps[index] : undefined;
  const made = step ? done[index] : false;
  const card = useRef<HTMLElement>(null);
  useRing(step, made, card);
  // On a phone the Display panel covers the page: a Display Step, as it is made, closes it, so the circles or the trace
  // its note speaks of are in view (issue 260); coming back to one made already leaves it. Wider, the panel leaves the
  // Viewers beside it, open for the next change.
  const shown = useRef({ step, made });
  useEffect(() => {
    const before = shown.current;
    shown.current = { step, made };
    if (step && made && before.step === step && !before.made && inDisplay(step) && pinned(card.current)) onShutDisplay();
  }, [step, made, onShutDisplay]);
  const goToControl = useWayToControl(step, card);

  // Until the Step is made, Next says it is unavailable but keeps the focus, so pressing it leaves the keyboard there.
  // Pressed then, the first time in the Tutorial, it says why under the words, until the Step is made (issue 190).
  const waiting = !!step && !made;
  const [hint, setHint] = useState<{ tutorial: Tutorial; index: number } | null>(null);
  const hinting = waiting && hint?.tutorial === tutorial && hint.index === index;
  const pressNext = () => {
    if (!waiting) onNext();
    else if (hint?.tutorial !== tutorial) setHint({ tutorial, index });
  };
  const atEnd = index >= steps.length;
  const primary = !atEnd ? (
    <button type="button" className="tool tool-primary" aria-disabled={waiting || undefined} onClick={pressNext}>
      {index < 0 ? 'Start' : index === steps.length - 1 ? 'Finish' : 'Next'}
    </button>
  ) : (
    // The last card's way forward is the next Tutorial, on every width (issue 190, decision 1); after the last, Done.
    next && (
      <button type="button" className="tool tool-primary" onClick={() => onStartNext(next)}>
        Next: {next.preset}
      </button>
    )
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
        {step && (
          <button type="button" className="tool" onClick={goToControl}>
            Go to the control
          </button>
        )}
        {step && !made && (
          <button type="button" className="tool" onClick={onDoIt}>
            Do it for me
          </button>
        )}
        {atEnd && differs.length > 0 && (
          <button type="button" className="tool" onClick={onMatch}>
            Match the Preset
          </button>
        )}
      </>
    ),
    after: atEnd && (
      <button type="button" className={next ? 'tool' : 'tool tool-primary'} onClick={onQuit}>
        Done
      </button>
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
      under={
        // Always on the page, so a screen reader hears it come; empty, it takes no room.
        <p className="card-hint" aria-live="polite">
          {hinting && NEXT_HINT}
        </p>
      }
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
