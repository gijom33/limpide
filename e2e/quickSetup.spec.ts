import { expect, type Page, test } from '@playwright/test';
import { cc, midiButton, midiPanel, openMidi, play, times, withFakeController } from './fakeMidi';

const setup = (page: Page) => page.getByRole('region', { name: 'Quick Setup' });
const prompt = (page: Page) => setup(page).getByRole('status');

async function startSetup(page: Page) {
  await openMidi(page);
  await midiPanel(page).getByRole('button', { name: /Quick Setup/ }).click();
  await expect(setup(page)).toBeVisible();
}

/** A Controller's moves: a turn of knob n (Relative), a move of fader n (Absolute), a press of button n. */
const knob = (n: number) => times(4, cc(n, 1));
/** The four knobs before the Mixer: Cutoff, Resonance, Amount, then Osc 2's Detune. */
const firstKnobs = () => [1, 2, 3, 4].flatMap(knob);
const fader = (n: number) => [cc(32 + n, 10), cc(32 + n, 11), cc(32 + n, 12), cc(32 + n, 13)];
const button = (n: number) => [cc(48 + n, 127), cc(48 + n, 0)];
const STEPS = 27;

test.beforeEach(({ page }) => withFakeController(page));

test('Quick Setup walks through every control played live, in the page’s order, and maps it all', async ({ page }) => {
  await startSetup(page);
  await expect(prompt(page)).toContainText('Move a control → Filter · Cutoff');
  await expect(setup(page)).toContainText(`1 of ${STEPS}`);
  // The control being mapped is shown and highlighted where it sits.
  await expect(page.getByRole('region', { name: 'Filter' }).locator('.knob[data-learn-selected]')).toContainText('Cutoff');

  for (let n = 1; n <= 3; n++) await play(page, ...knob(n)); // Cutoff, Resonance, Amount
  await expect(prompt(page)).toContainText('Osc 2 · Detune');
  // Shown even on a hidden tab.
  await expect(page.getByRole('region', { name: 'Oscillators' }).locator('.knob[data-learn-selected]')).toContainText('Detune');
  await play(page, ...knob(4));
  await expect(prompt(page)).toContainText('Mixer · Osc 1');
  await expect(page.getByRole('tab', { name: 'Mixer' })).toHaveAttribute('aria-selected', 'true');
  for (let n = 1; n <= 5; n++) await play(page, ...fader(n)); // the Mixer, Ring included (issue 88)
  await expect(prompt(page)).toContainText('Filter Envelope · Attack');
  for (let n = 6; n <= 13; n++) await play(page, ...fader(n)); // the two Envelopes
  await expect(prompt(page)).toContainText('Amp · Volume'); // issue 62
  await play(page, ...knob(9));
  await expect(prompt(page)).toContainText('LFO 1 · Rate');
  for (let n = 5; n <= 8; n++) await play(page, ...knob(n)); // the LFOs
  await expect(prompt(page)).toContainText('Press a button → Hold');
  for (let n = 1; n <= 5; n++) await play(page, ...button(n));

  await expect(setup(page)).toContainText(`${STEPS} of ${STEPS} mapped`);
  await setup(page).getByRole('button', { name: 'Close' }).click();
  await expect(setup(page)).toBeHidden();

  // It all works straight away: button 1 toggles Hold, knob 1 opens the Cutoff.
  await page.waitForTimeout(600);
  await play(page, ...button(1));
  await expect(page.getByRole('button', { name: 'Hold' })).toHaveAttribute('aria-pressed', 'true');
  const cutoff = page.getByRole('region', { name: 'Filter' }).getByRole('slider', { name: 'Cutoff' });
  const before = Number(await cutoff.getAttribute('aria-valuenow'));
  await play(page, ...times(10, cc(1, 1)));
  await expect.poll(async () => Number(await cutoff.getAttribute('aria-valuenow'))).toBeGreaterThan(before);
  await openMidi(page);
  await expect(midiPanel(page).getByRole('list', { name: 'Mappings' }).getByRole('listitem')).toHaveCount(STEPS);
});

test('a fader that pauses mid-move and moves on never fills the next step', async ({ page }) => {
  await startSetup(page);
  await play(page, ...firstKnobs());
  await play(page, ...fader(1)); // Mixer · Osc 1
  await expect(prompt(page)).toContainText('Mixer · Osc 2');
  await page.waitForTimeout(700); // longer than Learn waits for a control to settle
  await play(page, cc(33, 20), cc(33, 30), cc(33, 40), cc(33, 50));
  await page.waitForTimeout(700);
  await expect(prompt(page)).toContainText('Mixer · Osc 2');
  await expect(setup(page)).toContainText(`6 of ${STEPS}`);
  await play(page, ...fader(2));
  await expect(prompt(page)).toContainText('Mixer · Ring');
});

test('steps can be skipped and gone back to', async ({ page }) => {
  await startSetup(page);
  await play(page, ...firstKnobs());
  await setup(page).getByRole('button', { name: 'Skip' }).click(); // no Mixer Osc 1
  await expect(prompt(page)).toContainText('Mixer · Osc 2');
  await setup(page).getByRole('button', { name: 'Back' }).click();
  await expect(prompt(page)).toContainText('Mixer · Osc 1');
  await play(page, ...fader(1));
  await expect(prompt(page)).toContainText('Mixer · Osc 2');
});

test('the MIDI button shows Learning during Quick Setup, and Done in its panel finishes the Setup', async ({ page }) => {
  await startSetup(page);
  await expect(midiButton(page)).toHaveAttribute('data-learning', 'true');
  await play(page, ...knob(1));
  await openMidi(page);
  await midiPanel(page).getByRole('button', { name: 'Done' }).click();
  await expect(prompt(page)).toContainText(`1 of ${STEPS} mapped`);
  await expect(midiButton(page)).not.toHaveAttribute('data-learning', /./);
});

test('finishing early keeps what was mapped; Escape finishes too', async ({ page }) => {
  await startSetup(page);
  await play(page, ...knob(1), ...fader(1));
  await page.keyboard.press('Escape');
  await expect(setup(page)).toContainText(`2 of ${STEPS} mapped`);
  await setup(page).getByRole('button', { name: 'Close' }).click();
  await openMidi(page);
  await expect(midiPanel(page).getByRole('list', { name: 'Mappings' }).getByRole('listitem')).toHaveCount(2);
});

test('cancelling puts back the Mappings from before', async ({ page }) => {
  await startSetup(page);
  await play(page, ...knob(1), ...fader(1));
  await setup(page).getByRole('button', { name: 'Cancel' }).click();
  await expect(setup(page)).toBeHidden();
  await openMidi(page);
  await expect(midiPanel(page).getByRole('list', { name: 'Mappings' })).toHaveCount(0);
});
