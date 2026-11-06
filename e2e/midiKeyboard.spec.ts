import { expect, test } from '@playwright/test';
import { cc, midiPanel, openMidi, play, withFakeController } from './fakeMidi';
import { sliderName } from './helpers';

// Issue 52: a keyboard's own controls do what a synth player expects, until they are mapped to something else.

test.beforeEach(({ page }) => withFakeController(page));

const piano = (page: import('@playwright/test').Page) => page.getByRole('group', { name: 'Piano' });

/** Where a dot comes to rest once aftertouch’s glide there has arrived, in about 0.2 s (issue 219): two reads 0.3 s apart agree. */
async function restingCx(dot: import('@playwright/test').Locator) {
  // The poll's first read is at once: it has nothing to agree with yet.
  let last: string | null | undefined;
  await expect
    .poll(
      async () => {
        const now = await dot.getAttribute('cx');
        const resting = now === last;
        last = now;
        return resting;
      },
      { intervals: [300] },
    )
    .toBe(true);
  return last;
}

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

// Issue 241: Bank Select (CC 0) picks a bank of 128 Presets, so every one of the 142 is reachable by Program Change.
test('Bank Select and a Program Change reach the Presets past the 128th; one past the last leaves the Patch alone (issue 241)', async ({ page }) => {
  const patch = page.getByRole('button', { name: /^Patch: / });
  await play(page, cc(0, 1), cc(32, 0), [0xc0, 0]); // bank 1, Program 0: the 129th Preset
  await expect(patch).toHaveAttribute('aria-label', 'Patch: Wind');
  await play(page, [0xc0, 14], [0x90, 60, 100]); // bank 1, Program 14: past the 142nd, the last; then a Note
  await expect(piano(page).locator('[data-note="60"]')).toHaveAttribute('aria-pressed', 'true'); // heard after it
  await expect(patch).toHaveAttribute('aria-label', 'Patch: Wind');
  await play(page, [0x80, 60, 0], cc(0, 0), [0xc0, 1]); // back to bank 0
  await expect(patch).toHaveAttribute('aria-label', 'Patch: Pure Sine');
});

// Issue 242: as picking a Preset in the Patches panel does.
test('a Program Change during the Demo stops it, says so, and the Preset it named stays (issue 242)', async ({ page }) => {
  const demo = page.getByRole('button', { name: 'Demo', exact: true });
  const patch = page.getByRole('button', { name: /^Patch: / });
  await demo.click();
  await expect(patch).toHaveAttribute('aria-label', /Kick/);
  await play(page, [0xc0, 1]);
  await expect(demo).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByRole('status').filter({ hasText: 'The Demo stopped: you are playing now.' })).toBeVisible();
  await expect(patch).toHaveAttribute('aria-label', 'Patch: Pure Sine');
  await page.waitForTimeout(1500); // no part of the Demo loads over it
  await expect(patch).toHaveAttribute('aria-label', 'Patch: Pure Sine');
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
  const halfway = await restingCx(dot);
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
