import { OVERLAYS, type Overlay, type Overlays } from '../viewers/overlays';
import { OVERLAY_TIPS } from './tips';
import { Tooltip } from './Tooltip';

// Each toggle shows a swatch of the mark it controls, so the row doubles as the legend.
const LABELS: Record<Overlay, string> = { harmonics: 'Harmonics', ideal: 'Ideal', curve: 'Curve', guides: 'Guides', maths: 'Maths' };

interface Props {
  value: Overlays;
  onToggle(overlay: Overlay): void;
}

export function OverlayToggles({ value, onToggle }: Props) {
  return (
    <div className="segmented overlays" role="group" aria-label="Show on Viewers">
      {OVERLAYS.map((o) => (
        <Tooltip key={o} content={OVERLAY_TIPS[o]}>
          <button type="button" aria-pressed={value[o]} data-overlay={o} onClick={() => onToggle(o)}>
            <span className="swatch" aria-hidden="true" />
            {LABELS[o]}
          </button>
        </Tooltip>
      ))}
    </div>
  );
}
