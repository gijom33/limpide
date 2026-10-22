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
