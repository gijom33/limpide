import { type ReactNode, useEffect, useId, useRef, useState } from 'react';
import { REVEAL_EVENT } from './reveal';
import { type TipContent, Tooltip } from './Tooltip';

export interface Tab {
  id: string;
  label: string;
  /** Extra state shown on the tab itself (e.g. "this Oscillator is sounding"). */
  badge?: boolean;
  badgeLabel?: string;
  tip?: TipContent;
  /** Its content stretches to the tallest panel's height (the Mixer's faders). */
  fill?: boolean;
  content: ReactNode;
}

/**
 * Tabs in the WAI-ARIA pattern: one tab stop for the whole list, ←/→/Home/End move and select, each panel is
 * labelled by its tab. Hidden panels stay mounted, so switching is instant and keeps their state.
 */
export function Tabs({ label, tabs }: { label: string; tabs: Tab[] }) {
  const base = useId();
  const [selected, setSelected] = useState(tabs[0].id);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const root = useRef<HTMLDivElement>(null);

  // Something inside a hidden panel asked to be seen (a Controller moved it): show its panel, leaving focus alone.
  useEffect(() => {
    const element = root.current!;
    const onReveal = (e: Event) => {
      const panel = (e.target as Element).closest<HTMLElement>('[role="tabpanel"]');
      if (panel?.closest('.tabs') !== element || !panel.dataset.tab) return;
      setSelected(panel.dataset.tab);
    };
    element.addEventListener(REVEAL_EVENT, onReveal);
    return () => element.removeEventListener(REVEAL_EVENT, onReveal);
  }, []);

  const select = (index: number) => {
    const i = (index + tabs.length) % tabs.length;
    setSelected(tabs[i].id);
    refs.current[i]?.focus();
  };

  return (
    <div className="tabs" ref={root}>
      <div className="tab-list" role="tablist" aria-label={label}>
        {tabs.map((t, i) => {
          const button = (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${base}-tab-${t.id}`}
            aria-selected={t.id === selected}
            aria-controls={`${base}-panel-${t.id}`}
            tabIndex={t.id === selected ? 0 : -1}
            data-sounding={t.badge || undefined}
            onClick={() => setSelected(t.id)}
            onKeyDown={(e) => {
              const moves: Record<string, number> = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 };
              if (!(e.key in moves)) return;
              e.preventDefault();
              select(moves[e.key]);
            }}
          >
            {t.label}
            {/* The dot's room is kept while it is hidden, so it never pushes the tabs after it. */}
            {/* Its meaning in words for a screen reader, which reads no label on a plain span (issue 51). */}
            {t.badgeLabel && (
              <span className="tab-badge" data-on={t.badge || undefined}>
                {t.badge && <span className="visually-hidden">{` (${t.badgeLabel})`}</span>}
              </span>
            )}
          </button>
          );
          return t.tip ? (
            <Tooltip key={t.id} content={t.tip}>
              {button}
            </Tooltip>
          ) : (
            button
          );
        })}
      </div>
      {/* Panels share one grid cell, so the tabs always take the tallest panel's height: switching never
          moves what is below. Inactive panels are hidden from view and from assistive technology. */}
      <div className="tab-panels">
        {tabs.map((t) => (
          <div
            key={t.id}
            role="tabpanel"
            id={`${base}-panel-${t.id}`}
            aria-labelledby={`${base}-tab-${t.id}`}
            aria-hidden={t.id !== selected}
            inert={t.id !== selected}
            data-active={t.id === selected || undefined}
            data-tab={t.id}
            data-fill={t.fill || undefined}
            className="tab-panel"
          >
            {t.content}
          </div>
        ))}
      </div>
    </div>
  );
}
