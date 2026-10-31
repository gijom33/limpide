import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { STACKED } from './sections';

describe('the stacked layout (the 1.16.1 review)', () => {
  it('is where the stylesheet stacks the header and sticks the strip: the breakpoint the App and the mascot read', () => {
    const styles = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
    expect(styles).toContain(`@media ${STACKED}`);
  });
});
