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
test('aftertouch moves the Cutoff’s dot, or the Destination picked in the MIDI panel instead, and the choice is kept', async ({ page }) => {
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
