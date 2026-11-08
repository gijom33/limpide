import { type ReactNode, useEffect, useState } from 'react';
import { useHeaderPanel } from './hooks/useHeaderPanel';
import { SlidersIcon } from './icons';
import { Tooltip } from './Tooltip';

/**
 * The display settings (Freeze, Snapshot, axes, overlays) behind one button, so they take no room while you
 * play. The panel stays open while you change several things; Escape, a click elsewhere or Tab out of it closes it. A dot on
 * the button shows when something is held (Freeze or a Snapshot), so a hidden setting is never a mystery. Each new
 * `shut` closes it from outside (a Tutorial's Display Step made on a phone, issue 260), the focus on an option going
 * back to its button, as Escape takes it.
 */
export function DisplayMenu({ active, shut = 0, children }: { active: boolean; shut?: number; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { wrapper, button } = useHeaderPanel(open, setOpen);
  useEffect(() => {
    if (!shut) return;
    if (wrapper.current?.contains(document.activeElement)) button.current?.focus();
    setOpen(false);
  }, [shut, wrapper, button]);

  return (
    <div className="display-menu" ref={wrapper}>
      <Tooltip
        content={{
          title: 'Display',
          body: 'How the Viewers show the sound: Freeze, Snapshot, which Voices the Viewers follow, the Glow, the axes, Scope cycles, the Env Timeline’s length and which overlays are drawn; and the page’s own settings: the letter keys, the tips, Bead and the theme.',
          how: 'Space freezes without opening it. A dot here means Freeze or a Snapshot is on.',
        }}
      >
        <button
          ref={button}
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
      {open && <div className="display-panel" data-panel>{children}</div>}
    </div>
  );
}
