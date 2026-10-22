import type { ReactNode } from 'react';
import { Tooltip, type TipContent } from './Tooltip';

/** A labelled cluster of controls inside a stage (Osc 1, Osc 2, Mixer, Filter Envelope). */
export function SubBlock({ title, tip, group, showTitle = true, children }: {
  title: string;
  tip?: TipContent;
  group?: boolean;
  /** Off when something else already names it on screen (e.g. its tab). */
  showTitle?: boolean;
  children: ReactNode;
}) {
  const heading = <h3 className={tip ? 'has-tip' : undefined}>{title}</h3>;
  return (
    <div className="sub-block" role={group ? 'group' : undefined} aria-label={group ? title : undefined}>
      {showTitle && (tip ? <Tooltip content={tip}>{heading}</Tooltip> : heading)}
      {children}
    </div>
  );
}
