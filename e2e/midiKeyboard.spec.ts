import { expect, test } from '@playwright/test';
import { cc, midiPanel, openMidi, play, withFakeController } from './fakeMidi';
import { sliderName } from './helpers';

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

test('a panic lets every Note go: All Notes Off, the pedal still holding them, until Reset All Controllers lifts it (issue 185)', async ({ page }) => {
  const key = (note: number) => piano(page).locator(`[data-note="${note}"]`);
  await play(page, [0x90, 60, 100], [0x91, 64, 100], cc(123, 0));
  await expect(key(60)).toHaveAttribute('aria-pressed', 'false');
  await expect(key(64)).toHaveAttribute('aria-pressed', 'false');
  await play(page, [0x90, 60, 100], cc(64, 127), cc(123, 0));
  await expect(key(60)).toHaveAttribute('aria-pressed', 'true'); // the pedal holds it, as MIDI says
  await play(page, cc(121, 0)); // Reset All Controllers lifts the pedal
  await expect(key(60)).toHaveAttribute('aria-pressed', 'false');
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

// Issue 132: channel aftertouch moves one Destination, the Cutoff by default, chosen in the MIDI panel and remembered.
test('aftertouch moves the Cutoff’s dot, or the Destination picked in the MIDI panel instead, and the choice is kept (issue 132)', async ({ page }) => {
  const knob = (name: string) => page.getByRole('region', { name: 'Filter' }).locator('.knob', { has: page.getByRole('slider', { name: sliderName(name) }) });
  const dot = (name: string) => knob(name).locator('.knob-live');
  const timeline = page.getByRole('img', { name: 'Envelope Timeline' });
  const aftertouch = midiPanel(page).getByRole('combobox', { name: 'Aftertouch' });
  await expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-db', /.+/); // the sound is running
  await expect(timeline).toHaveAttribute('data-shows', 'amp'); // nothing moves the Cutoff yet

  await play(page, [0x90, 57, 100]);
  await expect(page.getByRole('slider', { name: sliderName('Cutoff') })).toBeVisible();
  await expect(dot('Cutoff')).toBeHidden(); // nothing moves it: no dot
  await play(page, [0xd0, 64]); // pressed halfway: the dot shows where it took the Cutoff
  await expect(dot('Cutoff')).toBeVisible();
  const halfway = await dot('Cutoff').getAttribute('cx');
  await play(page, [0xd0, 127]); // all the way: further
  await expect.poll(() => dot('Cutoff').getAttribute('cx')).not.toBe(halfway);
  await expect(dot('Resonance')).toBeHidden();
  await expect(timeline).toHaveAttribute('data-shows', 'cutoff amp'); // its line, from the first pressure
  await openMidi(page);
  await expect(midiPanel(page)).toContainText('Aftertouch · 100 %');
  await expect(aftertouch).toHaveValue('cutoff');

  await aftertouch.selectOption({ label: 'Resonance' });
  await expect(dot('Cutoff')).toBeHidden(); // a new Destination starts from no pressure
  await play(page, [0xd0, 64]);
  await expect(dot('Resonance')).toBeVisible();
  const resonanceHalfway = await dot('Resonance').getAttribute('cx');
  await play(page, [0xd0, 127]);
  await expect.poll(() => dot('Resonance').getAttribute('cx')).not.toBe(resonanceHalfway);
  await expect(dot('Cutoff')).toBeHidden();
  await expect(timeline).toHaveAttribute('data-shows', 'lfo-resonance amp');
  await play(page, [0x80, 57, 0]);

  await page.reload();
  await openMidi(page);
  await expect(aftertouch).toHaveValue('resonance');
});

// Issue 132, the owner's decision 1: per-Note (polyphonic) aftertouch, a TempoPAD C16's, the highest held Note's moving
// the one Destination; a Note's pressure is forgotten on its release.
test('per-Note aftertouch moves the Cutoff’s dot by the Note pressed hardest, and a released Note’s is forgotten (issue 132)', async ({ page }) => {
  const dot = page
    .getByRole('region', { name: 'Filter' })
    .locator('.knob', { has: page.getByRole('slider', { name: sliderName('Cutoff') }) })
    .locator('.knob-live');
  await expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-db', /.+/); // the sound is running

  await play(page, [0x90, 57, 100], [0x90, 60, 100]);
  await expect(page.getByRole('slider', { name: sliderName('Cutoff') })).toBeVisible();
  await expect(dot).toBeHidden();
  await play(page, [0xa0, 57, 64]); // A3 pressed halfway
  await expect(dot).toBeVisible();
  const halfway = await dot.getAttribute('cx');
  await play(page, [0xa0, 60, 127]); // C4 all the way: the harder of the two
  await expect.poll(() => dot.getAttribute('cx')).not.toBe(halfway);
  await play(page, [0xa0, 57, 32]); // A3 lighter: C4's still holds it
  await openMidi(page);
  await expect(midiPanel(page)).toContainText('Aftertouch A3 · 25 %');
  await expect.poll(() => dot.getAttribute('cx')).not.toBe(halfway);
  const full = await dot.getAttribute('cx');
  await play(page, [0xa0, 57, 64], [0x80, 60, 0]); // C4 released: A3's halfway is the pressure
  await expect.poll(() => dot.getAttribute('cx')).toBe(halfway);
  expect(halfway).not.toBe(full);
  await play(page, [0x80, 57, 0]); // both released: no pressure
  await expect(dot).toBeHidden();
});
