import { useId } from 'react';

/**
 * The Limpide mark: a sharp saw tooth that softens into a smooth sine, which is subtractive synthesis in one
 * stroke, drawn through the three stage colours (Oscillators → Filter → Amp) so it follows the theme. It stands
 * on the page with no tile behind it.
 */
export function Logo({ size = 30 }: { size?: number }) {
  const gradient = useId();
  return (
    <svg className="logo" viewBox="3 2.5 26 26" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id={gradient} x1="4" y1="0" x2="28" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" style={{ stopColor: 'var(--stage-osc)' }} />
          <stop offset="0.55" style={{ stopColor: 'var(--stage-filter)' }} />
          <stop offset="1" style={{ stopColor: 'var(--stage-amp)' }} />
        </linearGradient>
      </defs>
      <path
        d="M4.5 21 L10.5 9.5 L10.8 21 C13.4 17.5 14.2 10.5 17.6 10.5 C21.2 10.5 21.6 21.5 24.6 21.5 C26.3 21.5 27 18 27.6 16"
        fill="none"
        stroke={`url(#${gradient})`}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
