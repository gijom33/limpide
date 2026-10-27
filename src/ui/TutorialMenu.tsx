import { useEffect, useRef, useState } from 'react';
import { TutorialIcon } from './icons';
import { Tooltip } from './Tooltip';

const TIP = {
  title: 'Tutorial',
  body: 'Build a Preset step by step, from Init: you turn each control, and hear and see what it does.',
  how: 'Pick one; a tick marks those you have finished.',
};

/**
 * The Tutorials from the header (issue 59, the owner's decision): after the welcome, only the Patch name led to
 * them. The button opens the list; picking one starts it. Escape or a press elsewhere closes it, Escape back to
 * its button (issue 51).
 */
export function TutorialMenu({ tutorials, onStart }: { tutorials: readonly { preset: string; finished: boolean }[]; onStart(preset: string): void }) {
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      button.current?.focus();
    };
    const onPointer = (e: PointerEvent) => !wrapper.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  return (
    <div className="tutorial-menu" ref={wrapper}>
      <Tooltip content={TIP}>
        <button ref={button} type="button" className="tool tool-mode demo-button" aria-label="Tutorial" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <TutorialIcon />
          <span className="demo-word">Tutorial</span>
        </button>
      </Tooltip>
      {open && (
        <div className="tutorial-menu-panel" role="group" aria-label="Tutorials">
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
              {t.preset}
              {t.finished && <span className="tutorial-menu-done" aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
