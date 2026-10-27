import { expect, test } from '@playwright/test';
import { cc, midiPanel, openMidi, play, withFakeController } from './fakeMidi';

// Issue 52: a keyboard's own controls do what a synth player expects, until they are mapped to something else.

test.beforeEach(({ page }) => withFakeController(page));

const piano = (page: import('@playwright/test').Page) => page.getByRole('group', { name: 'Piano' });

test('the sustain pedal holds a released Note until it lifts', async ({ page }) => {
  await play(page, [0x90, 60, 100], cc(64, 127), [0x80, 60, 0]);
  await expect(piano(page).locator('[data-note="60"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Hold' })).toHaveAttribute('aria-pressed', 'false'); // Hold itself is not on
  await play(page, cc(64, 0));
  await expect(piano(page).locator('[data-note="60"]')).toHaveAttribute('aria-pressed', 'false');
});

test('a Program Change loads that Preset, the mod wheel turns LFO 1’s Depth', async ({ page }) => {
  await play(page, [0xc0, 1]);
  await expect(page.getByRole('button', { name: /^Patch: / })).toHaveAttribute('aria-label', 'Patch: Pure Sine');
  await play(page, cc(1, 127));
  await expect(page.getByRole('slider', { name: 'LFO 1 Depth' })).toHaveAttribute('aria-valuetext', '100 %');
});

test('the bend wheel shows in the Activity Monitor, its range two semitones until changed', async ({ page }) => {
  await play(page, [0x90, 69, 100]); // A4, 440 Hz
  await play(page, [0xe0, 0x7f, 0x7f]); // all the way up: two semitones by default
  await openMidi(page);
  await expect(midiPanel(page)).toContainText('Pitch bend · +100 %');
  await expect(midiPanel(page).getByRole('radio', { name: '2 semitones', exact: true })).toHaveAttribute('aria-checked', 'true');
});
