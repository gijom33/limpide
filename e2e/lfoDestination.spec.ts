import { expect, test, type Page } from '@playwright/test';

// Each LFO's destination is picked like a Patch (issue 26): ‹ and › step through the six, and the name in the
// middle opens a menu of them all, grouped by stage.

const lfo = (page: Page, n: 1 | 2) => page.getByRole('group', { name: `LFO ${n}`, exact: true });
const name = (page: Page, n: 1 | 2) => lfo(page, n).getByRole('button', { name: /Destination:/ });

test('‹ and › step through the six destinations, wrapping round', async ({ page }) => {
  await page.goto('/');
  await expect(name(page, 1)).toHaveAccessibleName('LFO 1 Destination: Cutoff');
  const next = lfo(page, 1).getByRole('button', { name: 'Next destination' });
  const seen: string[] = [];
  for (let i = 0; i < 6; i++) {
    await next.click();
    seen.push(((await name(page, 1).getAttribute('aria-label')) ?? '').replace('LFO 1 Destination: ', ''));
  }
  expect(seen).toEqual(['Resonance', 'Pitch', 'Osc 2 Pitch', 'Detune', 'Pulse Width', 'Cutoff']);
  await lfo(page, 1).getByRole('button', { name: 'Previous destination' }).click();
  await expect(name(page, 1)).toHaveAccessibleName('LFO 1 Destination: Pulse Width');
});

test('the name opens a menu of every destination, grouped by stage; picking one closes it', async ({ page }) => {
  await page.goto('/');
  await name(page, 2).click();
  const menu = lfo(page, 2).getByRole('menu');
  await expect(menu).toBeVisible();
  await expect(menu.getByRole('group', { name: 'Oscillators' }).getByRole('menuitemradio')).toHaveText(['Pitch', 'Osc 2 Pitch', 'Detune', 'Pulse Width']);
  await expect(menu.getByRole('group', { name: 'Filter' }).getByRole('menuitemradio')).toHaveText(['Cutoff', 'Resonance']);
  await expect(menu.getByRole('menuitemradio', { name: 'Pitch', exact: true })).toHaveAttribute('aria-checked', 'true'); // LFO 2 starts on Pitch
  await menu.getByRole('menuitemradio', { name: 'Detune' }).click();
  await expect(menu).toBeHidden();
  await expect(name(page, 2)).toHaveAccessibleName('LFO 2 Destination: Detune');
  await expect(name(page, 1)).toHaveAccessibleName('LFO 1 Destination: Cutoff'); // LFO 1 untouched
});

test('the menu works from the keyboard: arrows move, Enter picks, Escape closes and gives focus back', async ({ page }) => {
  await page.goto('/');
  await name(page, 1).focus();
  await page.keyboard.press('Enter');
  const menu = lfo(page, 1).getByRole('menu');
  await expect(menu.getByRole('menuitemradio', { name: 'Cutoff' })).toBeFocused(); // the one in force
  await page.keyboard.press('ArrowDown');
  await expect(menu.getByRole('menuitemradio', { name: 'Resonance' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(name(page, 1)).toHaveAccessibleName('LFO 1 Destination: Resonance');
  await expect(name(page, 1)).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(name(page, 1)).toBeFocused();
});

test('a click outside closes the menu without picking', async ({ page }) => {
  await page.goto('/');
  await name(page, 1).click();
  await page.mouse.click(5, 5);
  await expect(lfo(page, 1).getByRole('menu')).toBeHidden();
  await expect(name(page, 1)).toHaveAccessibleName('LFO 1 Destination: Cutoff');
});

test('near the bottom of the window the menu opens upwards, every destination on screen', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await name(page, 2).click();
  for (const item of await lfo(page, 2).getByRole('menuitemradio').all()) await expect(item).toBeInViewport({ ratio: 1 });
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 393, height: 852 } });

  test('the menu opens by its button and its destinations can be picked', async ({ page }) => {
    await page.goto('/');
    await name(page, 1).click();
    const item = lfo(page, 1).getByRole('menuitemradio', { name: 'Resonance' });
    const button = (await name(page, 1).boundingBox())!;
    const box = (await item.boundingBox())!;
    expect(Math.abs(box.y - button.y)).toBeLessThan(320); // right by the button
    await item.click();
    await expect(name(page, 1)).toHaveAccessibleName('LFO 1 Destination: Resonance');
  });
});
