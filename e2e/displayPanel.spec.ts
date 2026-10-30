import { expect, test } from '@playwright/test';
import { openDisplay } from './helpers';

test('the display controls hide behind a Display button, leaving the space to the synth', async ({ page }) => {
  await page.goto('/');
  const controls = page.getByRole('region', { name: 'Viewer controls' });
  await expect(controls).toBeHidden();
  await openDisplay(page);
  for (const group of ['View', 'Axes', 'Show']) await expect(controls.getByRole('group', { name: group, exact: true })).toBeVisible();
});

test('the panel stays open while several settings are changed, and Escape closes it', async ({ page }) => {
  await page.goto('/');
  await openDisplay(page);
  await page.getByRole('radiogroup', { name: 'Frequency axis' }).getByRole('radio', { name: 'Lin' }).click();
  await page.getByRole('button', { name: 'Guides' }).click();
  await expect(page.getByRole('region', { name: 'Viewer controls' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('region', { name: 'Viewer controls' })).toBeHidden();
  await expect(page.getByRole('button', { name: 'Display' })).toHaveAttribute('aria-expanded', 'false');
});

test('clicking elsewhere closes the panel', async ({ page }) => {
  await page.goto('/');
  await openDisplay(page);
  await page.locator('.timeline h2').click(); // well away from the panel, which overlays the stages below the header
  await expect(page.getByRole('region', { name: 'Viewer controls' })).toBeHidden();
});

test('Space still freezes with the panel closed, and the Display button shows that something is held', async ({ page }) => {
  await page.goto('/');
  const display = page.getByRole('button', { name: 'Display' });
  await expect(display).not.toHaveAttribute('data-active', 'true');
  await page.keyboard.press('Space');
  await expect(page.locator('main')).toHaveAttribute('data-frozen', 'true');
  await expect(display).toHaveAttribute('data-active', 'true');
  await page.keyboard.press('Space');
  await expect(display).not.toHaveAttribute('data-active', 'true');
});

test('the header is a single line at every laptop width, no taller than the piano', async ({ page }) => {
  for (const width of [1710, 1100, 872]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.locator('.piano')).toBeVisible(); // drawn: under load the page may still be starting
    const [header, piano] = await page.evaluate(() => ['header', '.piano'].map((s) => document.querySelector(s)!.getBoundingClientRect().height));
    expect(header, `${width}px`).toBeLessThanOrEqual(64);
    expect(header, `${width}px`).toBe(piano);
  }
});

for (const width of [1710, 1300, 960, 872, 420]) {
  test(`the open Display panel fits inside the window (${width}px)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await openDisplay(page);
    const box = (await page.getByRole('region', { name: 'Viewer controls' }).boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
  });
}

test('the keyboard sits at the top centre', async ({ page }) => {
  await page.setViewportSize({ width: 1710, height: 1060 });
  await page.goto('/');
  const piano = (await page.getByRole('group', { name: 'Piano' }).boundingBox())!;
  const header = (await page.locator('header').boundingBox())!;
  expect(piano.y + piano.height).toBeLessThanOrEqual(header.y + header.height + 1);
  expect(Math.abs(piano.x + piano.width / 2 - 1710 / 2)).toBeLessThan(60);
});

test('the theme is chosen in the Display panel, and remembered', async ({ page }) => {
  await page.goto('/');
  await openDisplay(page);
  await page.getByRole('radiogroup', { name: 'Theme' }).getByRole('radio', { name: 'Light' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('every Display setting is remembered across a reload, Freeze and the Snapshot aside (issue 85)', async ({ page }) => {
  await page.goto('/');
  await openDisplay(page);
  const choose = (group: string, option: string) => page.getByRole('radiogroup', { name: group }).getByRole('radio', { name: option, exact: true });
  const settings = [['Frequency axis', 'Lin'], ['Level axis', 'Lin'], ['Scope cycles', '4'], ['Env Timeline length', '3s'], ['Viewers follow', 'Newest']] as const;
  for (const [group, option] of settings) await choose(group, option).click();
  await page.getByRole('button', { name: 'Freeze' }).click();
  await page.reload();
  await openDisplay(page);
  for (const [group, option] of settings) await expect(choose(group, option)).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('button', { name: 'Freeze' })).toHaveAttribute('aria-pressed', 'false');
});

test('Tooltips can be switched off in Display: none opens, a knob keeps its description, and the choice is kept (issue 81)', async ({ page }) => {
  await page.goto('/');
  const open = page.getByRole('tooltip');
  const cutoff = page.getByRole('slider', { name: 'Cutoff' });
  const tooltips = page.getByRole('radiogroup', { name: 'Tooltips' });
  await openDisplay(page);
  await expect(tooltips.getByRole('radio', { name: 'On', exact: true })).toHaveAttribute('aria-checked', 'true'); // on at first
  await tooltips.getByRole('radio', { name: 'Off', exact: true }).click();
  await page.keyboard.press('Escape');
  await cutoff.hover();
  await page.waitForTimeout(700);
  await expect(open).toHaveCount(0);
  await page.keyboard.press('Shift'); // the keyboard in use, so focus shows as it would from Tab
  for (const control of [cutoff, page.getByRole('button', { name: 'Demo', exact: true })]) {
    await control.focus();
    await page.waitForTimeout(200);
    await expect(open).toHaveCount(0);
  }
  await expect(cutoff).toHaveAccessibleDescription(/Cutoff/);
  await page.reload();
  await openDisplay(page);
  await expect(tooltips.getByRole('radio', { name: 'Off', exact: true })).toHaveAttribute('aria-checked', 'true');
  await tooltips.getByRole('radio', { name: 'On', exact: true }).click();
  await page.keyboard.press('Escape');
  // Escape puts the focus back on the Display button, whose tip opens: away from it, so only the knob's is counted (it
  // passed only while the knob's had not opened yet, and failed under load).
  await page.evaluate(() => (document.activeElement as HTMLElement).blur());
  await cutoff.hover();
  await expect(open).toHaveCount(1);
  await expect(open).toContainText('Cutoff');
});

test('with Tooltips off, the header’s buttons shown as icons alone still show their names, and a worded one nothing (issue 106)', async ({ page }) => {
  // From 861 to 1099 px the buttons right of the keyboard drop their words.
  await page.setViewportSize({ width: 1000, height: 800 });
  await page.goto('/');
  await openDisplay(page);
  await page.getByRole('radiogroup', { name: 'Tooltips' }).getByRole('radio', { name: 'Off', exact: true }).click();
  await page.keyboard.press('Escape');
  const shown = page.locator('.tooltip:visible');
  // Escape put the focus back on the Display button, which may show its name: away from it first.
  await page.evaluate(() => (document.activeElement as HTMLElement).blur());
  await expect(shown).toHaveCount(0);
  const headerButton = (name: string) => page.getByRole('button', { name, exact: true });
  for (const name of ['Hold', 'MIDI', 'Display', 'About', 'Demo', 'Tutorial', 'Song']) {
    const button = headerButton(name);
    await button.hover();
    await expect(shown).toHaveText(name); // its name alone, no explanation
    // Where its tip would open: under the button.
    const [tip, own] = [await shown.boundingBox(), await button.boundingBox()];
    expect(tip!.y).toBeGreaterThanOrEqual(own!.y + own!.height);
    await page.mouse.move(500, 500);
    await expect(shown).toHaveCount(0);
  }
  // The keyboard too; the button's description is still its full tip.
  await page.keyboard.press('Shift');
  await page.getByRole('button', { name: 'Demo', exact: true }).focus();
  await expect(shown).toHaveText('Demo');
  await expect(page.getByRole('button', { name: 'Demo', exact: true })).toHaveAccessibleDescription(/A track of about three minutes/);
  await page.keyboard.press('Escape');
  await expect(shown).toHaveCount(0);
  await page.evaluate(() => (document.activeElement as HTMLElement).blur());
  // Wide enough for the words, the buttons show nothing more.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.mouse.move(500, 500);
  for (const name of ['Hold', 'Demo']) {
    // With its word in view, a hover starts no tip at all (Tooltip's show), so none can open later either.
    await expect(headerButton(name).getByText(name, { exact: true })).toBeVisible();
    await headerButton(name).hover();
    await expect(shown).toHaveCount(0);
  }
});

test('switching Tooltips off with the arrow keys leaves no tooltip open, the switch’s own included (the 1.15.0 review)', async ({ page }) => {
  await page.goto('/');
  await openDisplay(page);
  const on = page.getByRole('radiogroup', { name: 'Tooltips' }).getByRole('radio', { name: 'On', exact: true });
  await page.keyboard.press('Shift');
  await on.focus();
  await page.keyboard.press('ArrowRight'); // to Off
  await expect(page.getByRole('radiogroup', { name: 'Tooltips' }).getByRole('radio', { name: 'Off', exact: true })).toHaveAttribute('aria-checked', 'true');
  await page.waitForTimeout(200);
  await expect(page.getByRole('tooltip')).toHaveCount(0);
});
