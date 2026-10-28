import { expect, test } from '@playwright/test';
import { openDisplay } from './helpers';

// Issue 51: a sound made and changed without the mouse, and every control named for a screen reader.

const patchName = (page: import('@playwright/test').Page) => page.getByRole('button', { name: /^Patch: / });

test('a radio group is one Tab stop, and the arrows move its choice', async ({ page }) => {
  await page.goto('/');
  const waveform = page.getByRole('radiogroup', { name: 'Osc 1 Waveform' });
  const saw = waveform.getByRole('radio', { name: 'Saw' });
  await expect(saw).toHaveAttribute('aria-checked', 'true');
  await expect(waveform.locator('[role="radio"][tabindex="0"]')).toHaveCount(1); // the chosen one only
  await saw.focus();
  await page.keyboard.press('ArrowRight');
  const next = waveform.locator('[role="radio"][aria-checked="true"]');
  await expect(next).not.toHaveAccessibleName('Saw');
  await expect(next).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(saw).toHaveAttribute('aria-checked', 'true');
  await page.keyboard.press('End');
  await expect(waveform.getByRole('radio').last()).toHaveAttribute('aria-checked', 'true');
});

test('Home, End, Page Up and Page Down on a knob', async ({ page }) => {
  await page.goto('/');
  const resonance = page.getByRole('region', { name: 'Filter' }).getByRole('slider', { name: 'Resonance' });
  await resonance.focus();
  await page.keyboard.press('End');
  await expect(resonance).toHaveAttribute('aria-valuenow', '100');
  await page.keyboard.press('Home');
  await expect(resonance).toHaveAttribute('aria-valuenow', '0');
  await page.keyboard.press('PageUp');
  await expect(resonance).toHaveAttribute('aria-valuenow', '10');
  await page.keyboard.press('PageDown');
  await expect(resonance).toHaveAttribute('aria-valuenow', '0');
});

test('closing a panel puts the focus back on the button that opened it', async ({ page }) => {
  await page.goto('/');
  await patchName(page).click();
  await page.keyboard.press('Escape');
  await expect(patchName(page)).toBeFocused();
  await patchName(page).click();
  await page.getByRole('dialog', { name: 'Patches' }).getByRole('button', { name: 'Pure Sine' }).click();
  await expect(patchName(page)).toBeFocused(); // a Preset loaded
  await openDisplay(page);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Display' })).toBeFocused();
});

test('Import file is a button the keyboard reaches', async ({ page }) => {
  await page.goto('/');
  await patchName(page).click();
  const importButton = page.getByRole('dialog', { name: 'Patches' }).getByRole('button', { name: 'Import file' });
  await importButton.focus();
  await expect(importButton).toBeFocused();
});

test('the new Preset is announced after Next Preset', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Next Preset' }).click();
  await expect(page.locator('.patch-bar [role="status"]')).toHaveText('Pure Sine');
});

test('sliders that share a label have distinct names: the Envelopes’ stages, the LFOs’ Rate and Depth', async ({ page }) => {
  await page.goto('/');
  for (const name of ['Filter Attack', 'Amp Attack', 'Filter Release', 'Amp Release', 'LFO 1 Rate', 'LFO 2 Rate', 'LFO 1 Depth', 'LFO 2 Depth', 'Osc 2 Octave']) {
    await expect(page.getByRole('slider', { name, exact: true }), name).toHaveCount(1);
  }
});

test('the Viewers are images with names, the LFO plots say what they show', async ({ page }) => {
  await page.goto('/');
  for (const name of ['Oscillator Scope', 'Filter Spectrum', 'Amp Scope', 'Envelope Timeline']) {
    await expect(page.getByRole('img', { name, exact: true }), name).toHaveCount(1);
  }
  await expect(page.getByRole('img', { name: /^LFO 1: Sine, 2\.00 Hz, Depth 0 %, on Cutoff$/ })).toHaveCount(1);
});

test('the Timeline key’s entries are reached by Tab, named, and described, their tooltip shown on focus (issue 67)', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('slider', { name: 'Filter Envelope Amount' }).press('ArrowUp'); // its key entry shows only then
  const names = ['Cutoff', 'Filter Envelope', 'Amp Envelope']; // the key's order (issue 63)
  for (const name of names) {
    const entry = page.locator('.timeline-key').getByRole('img', { name, exact: true });
    await expect(entry, name).toHaveAttribute('tabindex', '0');
    await expect(entry, name).toHaveAccessibleDescription(/(\w+\W+){6,}/);
  }
  // By Tab from the section's heading tip: each entry in turn, its tooltip shown.
  await page.locator('.timeline-key').getByRole('img', { name: names[0] }).focus();
  await page.keyboard.press('Shift+Tab');
  for (const name of names) {
    await page.keyboard.press('Tab');
    await expect(page.locator('.timeline-key').getByRole('img', { name, exact: true })).toBeFocused();
    await expect(page.getByRole('tooltip').locator('visible=true').locator('strong')).toHaveText(name);
  }
});

test('the letter keys can be turned off in Display, and stay off', async ({ page }) => {
  await page.goto('/');
  const piano = page.getByRole('group', { name: 'Piano' });
  await openDisplay(page);
  await page.getByRole('radio', { name: 'Letter keys off' }).click();
  await page.keyboard.press('Escape');
  await page.keyboard.down('a');
  await page.waitForTimeout(200);
  await expect(piano.locator('[aria-pressed="true"]')).toHaveCount(0);
  await page.keyboard.up('a');
  await page.reload();
  await page.keyboard.down('a');
  await page.waitForTimeout(200);
  await expect(piano.locator('[aria-pressed="true"]')).toHaveCount(0);
  await page.keyboard.up('a');
  await openDisplay(page);
  await page.getByRole('radio', { name: 'Letter keys play Notes' }).click();
  await page.keyboard.press('Escape');
  await page.keyboard.down('a');
  await expect(piano.locator('[aria-pressed="true"]')).toHaveCount(1);
  await page.keyboard.up('a');
});

test.describe('a first visit', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test('closing the welcome puts the focus on the Demo button, not the page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('dialog', { name: 'Limpide' }).getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('button', { name: 'Demo', exact: true })).toBeFocused();
  });
});
