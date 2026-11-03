import { useState } from 'react';
import { useHeaderPanel } from './hooks/useHeaderPanel';
import { useUnderHeader } from './hooks/useUnderHeader';
import { TutorialIcon } from './icons';
import { Tooltip } from './Tooltip';

const TIP = {
  title: 'Tutorial',
  body: 'Build a Preset step by step, from Init: you turn each control, and hear and see what it does.',
  how: 'Pick one; a tick marks those you have finished.',
};

/**
 * The Tutorials from the header (issue 59, the owner's decision): after the welcome, only the Patch name led to
 * them. The button opens the list, each Tutorial with a short line of what it teaches (issue 129); picking one starts
 * it. Escape, a press elsewhere or Tab out of it closes it, Escape back to its button (issues 51 and 189).
 */
export function TutorialMenu({ tutorials, onStart }: { tutorials: readonly { preset: string; teaches: string; finished: boolean }[]; onStart(preset: string): void }) {
  const [open, setOpen] = useState(false);
  // The list opens under the header (issue 188), along its button's left edge, or along its right edge when the button sits in the right
  // half of the window, so it never runs off the page.
  const [side, setSide] = useState<'left' | 'right'>('left');
  const { wrapper, button } = useHeaderPanel(open, setOpen);
  const panel = useUnderHeader<HTMLDivElement>(open);
  const toggle = () => {
    const box = button.current?.getBoundingClientRect();
    setSide(box && box.left + box.width / 2 > window.innerWidth / 2 ? 'right' : 'left');
    setOpen((o) => !o);
  };

  return (
    <div className="tutorial-menu" ref={wrapper}>
      <Tooltip content={TIP}>
        <button ref={button} type="button" className="tool tool-mode demo-button" aria-label="Tutorial" aria-expanded={open} onClick={toggle}>
          <TutorialIcon />
          <span className="demo-word">Tutorial</span>
        </button>
      </Tooltip>
      {open && (
        <div ref={panel} className="tutorial-menu-panel" data-panel role="group" aria-label="Tutorials" data-side={side}>
          {tutorials.map((t) => (
            <button
              key={t.preset}
              type="button"
              className="tool"
              aria-label={`Tutorial: ${t.preset}${t.finished ? ', finished' : ''}`}
              onClick={() => {
                setOpen(false);
                onStart(t.preset);
              }}
            >
              <TutorialIcon />
              <span className="tutorial-menu-words">
                <span className="tutorial-menu-name">{t.preset}</span>
                <span className="tutorial-menu-teaches">{t.teaches}</span>
              </span>
              {t.finished && <span className="tutorial-menu-done" aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
