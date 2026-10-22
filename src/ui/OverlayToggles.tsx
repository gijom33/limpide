import { OVERLAYS, type Overlay, type Overlays } from '../viewers/overlays';

// Each toggle shows a swatch of the mark it controls, so the row doubles as the legend.
const LABELS: Record<Overlay, { label: string; hint: string }> = {
  harmonics: { label: 'Harmonics', hint: 'Harmonic Markers: a tick on each Harmonic, labelled by number (the fundamental by note)' },
  ideal: { label: 'Ideal', hint: 'Ideal Reference: where theory puts each Harmonic (after the Filter, on the Filter Tap)' },
  curve: { label: 'Curve', hint: 'Response Curve: the Filter’s gain at each frequency (scale on the right)' },
  ghost: { label: 'Ghost', hint: 'Ghost: energy the Filter removed (teal); energy Resonance added (orange)' },
  guides: { label: 'Guides', hint: 'Scope guides at the Oscillator’s level: beyond them, Resonance added a peak' },
};

interface Props {
  value: Overlays;
  onToggle(overlay: Overlay): void;
}

export function OverlayToggles({ value, onToggle }: Props) {
  return (
    <div className="overlays" role="group" aria-label="Show on Viewers">
      {OVERLAYS.map((o) => (
        <button key={o} type="button" aria-pressed={value[o]} title={LABELS[o].hint} data-overlay={o} onClick={() => onToggle(o)}>
          <span className="swatch" aria-hidden="true" />
          {LABELS[o].label}
        </button>
      ))}
    </div>
  );
}
