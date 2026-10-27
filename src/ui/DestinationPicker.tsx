import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CHOICES, type LfoDestination, type LfoNumber } from '../patch/patch';
import { useLearnable } from './learn';

/** Each destination's name, and the stage it belongs to (the menu groups and colours them by it). */
export const DESTINATIONS: Record<LfoDestination, { label: string; stage: 'osc' | 'filter' | 'amp' }> = {
  pitch: { label: 'Pitch', stage: 'osc' },
  osc2Pitch: { label: 'Osc 2 Pitch', stage: 'osc' },
  detune: { label: 'Detune', stage: 'osc' },
  pulseWidth: { label: 'Pulse Width', stage: 'osc' },
  cutoff: { label: 'Cutoff', stage: 'filter' },
  resonance: { label: 'Resonance', stage: 'filter' },
  volume: { label: 'Volume', stage: 'amp' },
};
const STAGES = [
  { stage: 'osc', name: 'Oscillators' },
  { stage: 'filter', name: 'Filter' },
  { stage: 'amp', name: 'Amp' },
] as const;
const ORDER = CHOICES.lfoDestination;

interface Props {
  lfo: LfoNumber;
  value: LfoDestination;
  onChange(destination: LfoDestination): void;
}

/**
 * An LFO's destination, picked like a Patch: ‹ and › step through the list (wrapping round), and the name opens a
 * menu of every destination, grouped by stage in the stage's colour. The menu takes the arrow keys, Enter and Escape.
 */
export function DestinationPicker({ lfo, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const learnable = useLearnable({ kind: 'choice', id: lfo === 1 ? 'lfoDestination' : 'lfo2Destination' });
  const label = `LFO ${lfo} Destination`;

  const step = (delta: number) => onChange(ORDER[(ORDER.indexOf(value) + delta + ORDER.length) % ORDER.length]);
  const close = (focus: boolean) => {
    setOpen(false);
    if (focus) button.current?.focus();
  };
  const pick = (destination: LfoDestination) => {
    onChange(destination);
    close(true);
  };

  // Opened near the bottom of the window (the LFOs sit low on a laptop), the menu opens upwards instead.
  // biome-ignore lint/correctness/useExhaustiveDependencies: measured again each time the menu opens
  useLayoutEffect(() => {
    const menu = wrapper.current?.querySelector<HTMLElement>('[role="menu"]');
    if (!menu) return;
    const below = innerHeight - wrapper.current!.getBoundingClientRect().bottom;
    const above = wrapper.current!.getBoundingClientRect().top;
    menu.toggleAttribute('data-up', menu.offsetHeight > below && above > below);
  }, [open]);

  // Open: the destination in force takes the focus; a press outside closes the menu.
  // biome-ignore lint/correctness/useExhaustiveDependencies: close is rebuilt each render, the same each time
  useEffect(() => {
    if (!open) return;
    wrapper.current?.querySelector<HTMLElement>('[role="menuitemradio"][aria-checked="true"]')?.focus();
    const outside = (e: PointerEvent) => !wrapper.current?.contains(e.target as Node) && close(false);
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);

  const onMenuKey = (e: React.KeyboardEvent) => {
    const items = [...wrapper.current!.querySelectorAll<HTMLElement>('[role="menuitemradio"]')];
    const at = items.indexOf(document.activeElement as HTMLElement);
    const move = { ArrowDown: 1, ArrowUp: -1 }[e.key];
    if (move) items[(at + move + items.length) % items.length].focus();
    else if (e.key === 'Home') items[0].focus();
    else if (e.key === 'End') items[items.length - 1].focus();
    else if (e.key === 'Escape') close(true);
    else if (e.key === 'Tab') close(false);
    else return;
    e.preventDefault();
  };

  return (
    <div className="destination-picker" ref={wrapper} {...learnable}>
      <button type="button" className="tool tool-icon" aria-label="Previous destination" onClick={() => step(-1)}>
        ‹
      </button>
      <button
        ref={button}
        type="button"
        className="tool destination-name"
        aria-label={`${label}: ${DESTINATIONS[value].label}`}
        aria-haspopup="menu"
        aria-expanded={open}
        data-stage={DESTINATIONS[value].stage}
        onClick={() => setOpen((o) => !o)}
      >
        {DESTINATIONS[value].label}
      </button>
      <button type="button" className="tool tool-icon" aria-label="Next destination" onClick={() => step(1)}>
        ›
      </button>
      {open && (
        <div className="destination-menu" role="menu" aria-label={label} onKeyDown={onMenuKey}>
          {STAGES.map(({ stage, name }) => (
            <div key={stage} role="group" aria-label={name} data-stage={stage}>
              <span className="destination-stage" aria-hidden="true">
                {name}
              </span>
              {ORDER.filter((d) => DESTINATIONS[d].stage === stage).map((d) => (
                <button key={d} type="button" role="menuitemradio" aria-checked={d === value} tabIndex={-1} onClick={() => pick(d)}>
                  {DESTINATIONS[d].label}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
