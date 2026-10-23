/** Where ±1 sits, as a fraction of the half-height: the rest is the margin for peaks beyond it. */
const FULL_SCALE_AT = 0.8;
const MARGIN = 1 - FULL_SCALE_AT;

/**
 * The Scope's vertical scale, shared by every Scope. Linear up to ±1 (so everyday signals keep their true
 * shape); beyond, peaks are compressed into the margin, still in order and never past the edge, so a resonant
 * peak shows its shape instead of being cut flat. The two parts join with the same slope, so there is no kink.
 */
export function scopeScale(height: number) {
  const half = height / 2;
  const offset = (v: number) => {
    const a = Math.abs(v);
    if (a <= 1) return a * FULL_SCALE_AT;
    const u = ((a - 1) * FULL_SCALE_AT) / MARGIN;
    return FULL_SCALE_AT + MARGIN * (u / (1 + u));
  };
  return { yOf: (v: number) => half - Math.sign(v) * offset(v) * half };
}
