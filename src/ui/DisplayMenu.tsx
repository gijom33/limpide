import { type ReactNode, useEffect, useRef, useState } from 'react';
import { SlidersIcon } from './icons';
import { Tooltip } from './Tooltip';

/**
 * The display settings (Freeze, Snapshot, axes, overlays) behind one button, so they take no room while you
 * play. The panel stays open while you change several things; Escape or a click elsewhere closes it. A dot on
 * the button shows when something is held (Freeze or a Snapshot), so a hidden setting is never a mystery.
 */
export function DisplayMenu({ active, children }: { active: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const onPointer = (e: PointerEvent) => !wrapper.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  return (
    <div className="display-menu" ref={wrapper}>
      <Tooltip
        content={{
          title: 'Display',
          body: 'How the Viewers show the sound: Freeze, Snapshot, the axes, Scope cycles, and which overlays are drawn.',
          how: 'Space freezes without opening it. A dot here means Freeze or a Snapshot is on.',
        }}
      >
        <button
          type="button"
          className="tool"
          aria-label="Display"
          aria-expanded={open}
          data-active={active || undefined}
          onClick={() => setOpen((o) => !o)}
        >
          <SlidersIcon />
          <span className="tool-word">Display</span>
          {active && <span className="display-dot" aria-hidden="true" />}
        </button>
      </Tooltip>
      {open && <div className="display-panel">{children}</div>}
    </div>
  );
}
