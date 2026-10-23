import { expect, test, type Page } from '@playwright/test';

const scope = (page: Page, tap: string) => page.getByLabel(`${tap} Scope`, { exact: true });

/** Opens Limpide with a Patch already in place (as if autosaved), then holds a Note. */
async function play(page: Page, patch: Record<string, unknown>) {
  await page.addInitScript((p) => {
    if (sessionStorage.getItem('seeded')) return;
    localStorage.clear();
    localStorage.setItem('limpide.current', JSON.stringify(p));
    sessionStorage.setItem('seeded', 'true');
  }, patch);
  await page.goto('/');
  await expect(scope(page, 'Amp')).toHaveAttribute('data-db', /.+/);
  await page.getByRole('button', { name: 'Hold' }).click();
  await page.keyboard.down('KeyA');
  await expect.poll(() => scope(page, 'Amp').getAttribute('data-db').then(Number), { timeout: 10000 }).toBeGreaterThan(-30);
}

test('LIMITING shows on the Amp Scope only while the safety limiter is bending the sound', async ({ page }) => {
  // Every source at full level into a fully resonant Filter: far past what the output can take unaltered.
  await play(page, {
    mixOsc1: 1, mixOsc2: 1, mixNoise: 1, mixSub: 1, osc2Octave: 1,
    resonance: 1, cutoff: 300, filterSlope: 24, ampSustain: 1, ampAttack: 0.001,
  });
  await expect(scope(page, 'Amp')).toHaveAttribute('data-limiting', 'true', { timeout: 5000 });
  // Only the Amp Scope says so: that is where the limiter sits (after it).
  await expect(scope(page, 'Filter')).not.toHaveAttribute('data-limiting', 'true');
});

test('an ordinary sound, even with Resonance boosting past the guides, never shows LIMITING', async ({ page }) => {
  await play(page, { resonance: 0.9, cutoff: 1400, filterSlope: 24, ampSustain: 1 }); // Resonant Ring
  await page.waitForTimeout(1500);
  await expect(scope(page, 'Amp')).toHaveAttribute('data-limiting', 'false');
});
