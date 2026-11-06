import type { ReactNode } from 'react';
import type { SwitchId } from '../patch/patch';
import { useInactive } from './inactive';
import { useLearnable } from './learn';
import type { TipContent } from './Tooltip';
import { Tooltip } from './Tooltip';

/**
 * A two-way switch: an icon button, on while pressed, its short name under it as the knobs' are, centred on a big
 * dial's height (an LFO's Retrigger and Sync), or beside it on a line of its own (Legato, issue 119). Learnable as its
 * choice; greyed out, with the reason read after its name, while it has no effect.
 */
export function Switch({ name, short, on, icon, tip, learn, labelAt = 'under', inactive, onToggle }: {
  /** Its full name, for a screen reader. */
  name: string;
  short: string;
  on: boolean;
  icon: ReactNode;
  tip: TipContent;
  /** Learnable as its choice: one of the Switches (`SWITCHES`). */
  learn: { kind: 'choice'; id: SwitchId };
  /** Where its name goes: under it, among knobs; beside it, on a line of its own. */
  labelAt?: 'under' | 'beside';
  inactive?: string | false;
  onToggle(): void;
}) {
  const learnable = useLearnable(learn);
  const dimmed = useInactive(inactive);
  return (
    <Tooltip content={tip}>
      <div className="switch-field" data-label={labelAt} {...dimmed.props}>
        <button type="button" className="tool tool-icon switch" aria-label={name} aria-pressed={on} onClick={onToggle} {...learnable}>
          {icon}
        </button>
        <div className="knob-label" aria-hidden="true">
          {short}
        </div>
        {dimmed.note}
      </div>
    </Tooltip>
  );
}
