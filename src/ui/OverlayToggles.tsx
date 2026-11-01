import { OVERLAYS, type Overlay, type Overlays } from '../viewers/overlays';
import { Tooltip } from './Tooltip';
import { OVERLAY_TIPS } from './tips';

// Each toggle shows a swatch of the mark it controls, so the row doubles as the legend. The Response Curve's toggle
// reads "Filter", what the line is of (the owner, issue 161); its accessible name still says what is drawn. Its stored
// key stays `curve`, so a visitor's choice still loads.
const LABELS: Record<Overlay, string> = { harmonics: 'Harmonics', ideal: 'Ideal', curve: 'Filter', guides: 'Guides', maths: 'Maths' };
const NAMES: Partial<Record<Overlay, string>> = { curve: 'Filter’s Response Curve' };

interface Props {
  value: Overlays;
  onToggle(overlay: Overlay): void;
}

export function OverlayToggles({ value, onToggle }: Props) {
  return (
    <div className="segmented overlays" role="group" aria-label="Show on Viewers">
      {OVERLAYS.map((o) => (
        <Tooltip key={o} content={OVERLAY_TIPS[o]}>
          <button type="button" aria-pressed={value[o]} aria-label={NAMES[o]} data-overlay={o} onClick={() => onToggle(o)}>
            <span className="swatch" aria-hidden="true" />
            {LABELS[o]}
          </button>
        </Tooltip>
      ))}
    </div>
  );
}
