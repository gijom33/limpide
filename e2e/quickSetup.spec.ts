import { expect, test, type Page } from '@playwright/test';
import { cc, midiButton, midiPanel, openMidi, play, times, withFakeController } from './fakeMidi';

const setup = (page: Page) => page.getByRole('region', { name: 'Quick Setup' });
const prompt = (page: Page) => setup(page).getByRole('status');

async function startSetup(page: Page) {
  await openMidi(page);
  await midiPanel(page).getByRole('button', { name: /Quick Setup/ }).click();
  await expect(setup(page)).toBeVisible();
}

/** Plays what a factory C16 sends for each step: a turn of encoders 1–8, a move of faders 1–4, presses of buttons. */
const encoder = (n: number) => times(4, cc(n, 1));
const fader = (n: number) => [cc(32 + n, 10), cc(32 + n, 11), cc(32 + n, 12), cc(32 + n, 13)];
const button = (n: number) => [cc(48 + n, 127), cc(48 + n, 0)];

test.beforeEach(({ page }) => withFakeController(page));

test('Quick Setup walks through the C16 one control at a time and maps it all', async ({ page }) => {
  await startSetup(page);
  await expect(prompt(page)).toContainText('Turn encoder 1');
  await expect(prompt(page)).toContainText('Cutoff');
  await expect(setup(page)).toContainText('1 of 17');
  // The control being mapped is highlighted where it sits on screen.
  await expect(page.getByRole('region', { name: 'Filter' }).locator('.knob[data-learn-selected]')).toContainText('Cutoff');

  for (let n = 1; n <= 3; n++) await play(page, ...encoder(n));
  // Detune lives on the Osc 2 tab: the step shows it.
  await expect(prompt(page)).toContainText('Detune');
  await expect(page.getByRole('tablist', { name: 'Oscillator' }).getByRole('tab', { name: /Osc 2/ })).toHaveAttribute('aria-selected', 'true');
  for (let n = 4; n <= 8; n++) await play(page, ...encoder(n));
  await expect(prompt(page)).toContainText('Move fader 1');
  await expect(prompt(page)).toContainText('Attack');
  for (let n = 1; n <= 4; n++) await play(page, ...fader(n));
  await expect(prompt(page)).toContainText('Press button 1');
  for (let n = 1; n <= 5; n++) await play(page, ...button(n));

  await expect(setup(page)).toContainText('17 of 17 mapped');
  await setup(page).getByRole('button', { name: 'Close' }).click();
  await expect(setup(page)).toBeHidden();

  // It all works straight away: encoder 7 steps the Waveform, button 1 toggles Hold, fader 3 sets Sustain.
  await page.waitForTimeout(600);
  await play(page, ...times(2, cc(7, 1)));
  await expect(page.getByRole('radiogroup', { name: 'Osc 1 Waveform' }).getByRole('radio', { name: 'Square' })).toHaveAttribute('aria-checked', 'true');
  await play(page, ...button(1));
  await expect(page.getByRole('button', { name: 'Hold' })).toHaveAttribute('aria-pressed', 'true');
  await openMidi(page);
  await expect(midiPanel(page).getByRole('list', { name: 'Mappings' }).getByRole('listitem')).toHaveCount(17);
});

test('steps can be skipped and gone back to', async ({ page }) => {
  await startSetup(page);
  await play(page, ...encoder(1));
  await setup(page).getByRole('button', { name: 'Skip' }).click(); // no Resonance
  await expect(prompt(page)).toContainText('Turn encoder 3');
  await setup(page).getByRole('button', { name: 'Back' }).click();
  await expect(prompt(page)).toContainText('Turn encoder 2');
  await play(page, ...encoder(2));
  await expect(prompt(page)).toContainText('Turn encoder 3');
});

test('the MIDI button shows Learning during Quick Setup, and Done in its panel finishes the Setup', async ({ page }) => {
  await startSetup(page);
  await expect(midiButton(page)).toHaveAttribute('data-learning', 'true');
  await play(page, ...encoder(1));
  await openMidi(page);
  await midiPanel(page).getByRole('button', { name: 'Done' }).click();
  await expect(prompt(page)).toContainText('1 of 17 mapped');
  await expect(midiButton(page)).not.toHaveAttribute('data-learning', /./);
});

test('finishing early keeps what was mapped; Escape finishes too', async ({ page }) => {
  await startSetup(page);
  await play(page, ...encoder(1), ...encoder(2));
  await page.keyboard.press('Escape');
  await expect(setup(page)).toContainText('2 of 17 mapped');
  await setup(page).getByRole('button', { name: 'Close' }).click();
  await openMidi(page);
  await expect(midiPanel(page).getByRole('list', { name: 'Mappings' }).getByRole('listitem')).toHaveCount(2);
});

test('cancelling puts back the Mappings from before', async ({ page }) => {
  await startSetup(page);
  await play(page, ...encoder(1), ...encoder(2));
  await setup(page).getByRole('button', { name: 'Cancel' }).click();
  await expect(setup(page)).toBeHidden();
  await openMidi(page);
  await expect(midiPanel(page).getByRole('list', { name: 'Mappings' })).toHaveCount(0);
});

test('a control that is not the C16’s factory one is pointed out, and still mapped', async ({ page }) => {
  await startSetup(page);
  await play(page, ...times(4, cc(74, 1)));
  await expect(setup(page)).toContainText(/Cutoff ← CC 74.*usually CC 1/);
  await expect(prompt(page)).toContainText('Turn encoder 2');
});
