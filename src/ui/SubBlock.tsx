import type { ReactNode } from 'react';
import { type TipContent, Tooltip } from './Tooltip';

/** A labelled cluster of controls inside a stage (Osc 1, Osc 2, Mixer, Filter Envelope). */
export function SubBlock({ title, label = title, tip, group, showTitle = true, children }: {
  title: string;
  /** What the row's label says, when shorter than the title (e.g. "Envelope" for "Filter Envelope"). */
  label?: string;
  tip?: TipContent;
  group?: boolean;
  /** Off when something else already names it on screen (e.g. its tab). */
  showTitle?: boolean;
  children: ReactNode;
}) {
  const heading = <h3 className={tip ? 'has-tip' : undefined}>{label}</h3>;
  return (
    // biome-ignore lint/a11y/useAriaPropsSupportedByRole: named only when it is a group
    <div className="sub-block" role={group ? 'group' : undefined} aria-label={group ? title : undefined}>
      {showTitle && (tip ? <Tooltip content={tip}>{heading}</Tooltip> : heading)}
      {children}
    </div>
  );
}
