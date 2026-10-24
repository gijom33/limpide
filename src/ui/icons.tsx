// Small line icons, drawn in currentColor so they follow the control's state colour.
const base = { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, 'aria-hidden': true } as const;

export const PauseIcon = () => (
  <svg {...base}>
    <path d="M5.5 3.5v9M10.5 3.5v9" strokeLinecap="round" />
  </svg>
);

export const CameraIcon = () => (
  <svg {...base}>
    <path d="M2.5 5.5h2l1.2-1.8h4.6l1.2 1.8h2v7h-11z" strokeLinejoin="round" />
    <circle cx="8" cy="8.8" r="2.2" />
  </svg>
);

export const CloseIcon = () => (
  <svg {...base} width={12} height={12}>
    <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
  </svg>
);

export const SunIcon = () => (
  <svg {...base}>
    <circle cx="8" cy="8" r="3" />
    <path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1" strokeLinecap="round" />
  </svg>
);

export const MoonIcon = () => (
  <svg {...base}>
    <path d="M13 9.5A5.5 5.5 0 0 1 6.5 3a5.5 5.5 0 1 0 6.5 6.5z" strokeLinejoin="round" />
  </svg>
);

export const SlidersIcon = () => (
  <svg {...base}>
    <path d="M3 4.5h10M3 8h10M3 11.5h10" strokeLinecap="round" />
    <circle cx="6" cy="4.5" r="1.6" fill="var(--panel)" />
    <circle cx="10.5" cy="8" r="1.6" fill="var(--panel)" />
    <circle cx="5" cy="11.5" r="1.6" fill="var(--panel)" />
  </svg>
);

/** A fermata, music's sign for "hold this note": Hold. */
export const HoldIcon = () => (
  <svg {...base} className="tool-glyph">
    <path d="M2.5 10.5a5.5 5.5 0 0 1 11 0" strokeLinecap="round" />
    <circle cx="8" cy="10" r="1.3" fill="currentColor" stroke="none" />
  </svg>
);

/** A circled "i": About. */
export const InfoIcon = () => (
  <svg {...base}>
    <circle cx="8" cy="8" r="6.25" />
    <path d="M8 7.2v4" strokeLinecap="round" />
    <circle cx="8" cy="4.9" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

/** A MIDI socket: five pins in a ring. */
export const MidiIcon = () => (
  <svg {...base}>
    <circle cx="8" cy="8" r="6.25" />
    {[[4.6, 8.4], [5.6, 5.6], [8, 4.6], [10.4, 5.6], [11.4, 8.4]].map(([x, y]) => (
      <circle key={x} cx={x} cy={y} r="0.9" fill="currentColor" stroke="none" />
    ))}
  </svg>
);

/** A quaver: the Song. */
export function NoteIcon() {
  return (
    <svg viewBox="0 0 12 12" width="11" height="11" aria-hidden="true">
      <ellipse cx="4" cy="9.3" rx="2.4" ry="1.8" fill="currentColor" />
      <path d="M5.7 9 V1.2 C7 2.8 9.6 3.4 9.6 6" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

/** A play triangle: the Demo. */
export function PlayIcon() {
  return (
    <svg viewBox="0 0 12 12" width="11" height="11" aria-hidden="true">
      <path d="M2.5 1.5 L10.5 6 L2.5 10.5 Z" fill="currentColor" />
    </svg>
  );
}
