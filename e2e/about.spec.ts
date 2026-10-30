import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const { version } = JSON.parse(readFileSync('package.json', 'utf8'));

test('the logo opens the About splash: version, build and credits; Close, Escape or a click outside close it', async ({ page }) => {
  await page.goto('/');
  const about = page.getByRole('dialog', { name: 'Limpide' });
  await expect(about).toBeHidden();
  await page.getByRole('heading', { level: 1 }).getByRole('button', { name: 'Limpide' }).click();
  await expect(about).toBeVisible();
  await expect(about).toContainText(`Version ${version}`);
  await expect(about).toContainText('Guillaume Boillet');
  await expect(about.getByRole('link', { name: 'Source on GitHub' })).toHaveAttribute('href', 'https://github.com/gijom33/limpide');

  await about.getByRole('button', { name: 'Close' }).click();
  await expect(about).toBeHidden();

  await page.getByRole('button', { name: 'Limpide' }).click();
  await page.keyboard.press('Escape');
  await expect(about).toBeHidden();

  await page.getByRole('button', { name: 'Limpide' }).click();
  await page.mouse.click(5, 5); // the backdrop
  await expect(about).toBeHidden();
  await page.getByRole('button', { name: 'Limpide' }).click(); // and it opens again
  await expect(about).toBeVisible();
});

test('an ⓘ button opens About at every width, with the word About from 1100 px up and under its icon in the 2 × 2 layout', async ({ page }) => {
  const about = page.getByRole('dialog', { name: 'Limpide' });
  const button = page.getByRole('button', { name: 'About' });
  for (const [width, height, word] of [[1440, 900, true], [1100, 900, true], [1099, 900, false], [1000, 800, false], [861, 800, false], [700, 800, true]] as const) {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await expect(button, `${width}px`).toBeVisible();
    await expect(button.getByText('About'), `${width}px`).toBeVisible({ visible: word });
    await button.click();
    await expect(about, `${width}px`).toContainText(`Version ${version}`);
    await about.getByRole('button', { name: 'Close' }).click();
    await expect(about).toBeHidden();
  }
});

test('About is centred over a dimmed page, on a phone, a laptop and a large screen', async ({ page }) => {
  for (const [width, height] of [[375, 812], [1000, 800], [1440, 900]]) {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await page.getByRole('button', { name: 'Limpide' }).click();
    const box = (await page.getByRole('dialog', { name: 'Limpide' }).boundingBox())!;
    const view = await page.evaluate(() => ({ w: document.documentElement.clientWidth, h: document.documentElement.clientHeight }));
    expect(Math.abs(box.x - (view.w - box.x - box.width)), `${width}×${height} horizontally`).toBeLessThanOrEqual(1);
    expect(Math.abs(box.y - (view.h - box.y - box.height)), `${width}×${height} vertically`).toBeLessThanOrEqual(1);
    const backdrop = await page.locator('dialog.about').evaluate((d) => getComputedStyle(d, '::backdrop').backgroundColor);
    expect(backdrop, 'dimmed').toMatch(/rgba\(0, 0, 0, 0\.\d+\)/);
  }
});

// Issue 42's legal review: the site ships React, whose MIT notice the minified bundle drops, so the build writes the
// notices beside the page; and only the published site's deploy counts visits, never a fork's or a test build.
test('About links the third-party notices, which carry React’s licence', async ({ page, request }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'About', exact: true }).click();
  const link = page.getByRole('link', { name: 'Third-party notices' });
  await expect(link).toBeVisible();
  const notices = await (await request.get(new URL((await link.getAttribute('href'))!, page.url()).href)).text();
  for (const name of ['react', 'react-dom', 'scheduler']) expect(notices).toMatch(new RegExp(`^${name} \\d`, 'm'));
  expect(notices).toContain('MIT License');
  expect(notices).toContain('Modernizr');
});

test('a build without a counter address counts no visits, and About makes no claim about them', async ({ page }) => {
  const counted: string[] = [];
  page.on('request', (r) => r.url().includes('goatcounter') || r.url().includes('gc.zgo.at') ? counted.push(r.url()) : undefined);
  await page.goto('/');
  await page.getByRole('button', { name: 'About', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Limpide' })).toContainText('MIT License');
  await expect(page.getByRole('dialog', { name: 'Limpide' })).not.toContainText('Privacy');
  expect(counted).toEqual([]);
});

test('About, opened any time, offers the Demo and the first Tutorial beside Close (the owner, 2026-10-27)', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'About' }).click();
  const about = page.getByRole('dialog', { name: 'Limpide' });
  await expect(about.locator('.about-actions').getByRole('button')).toHaveText(['Play the Demo', 'Follow the Tutorial', 'Close']);
  await about.getByRole('button', { name: 'Play the Demo' }).click();
  await expect(about).toBeHidden();
  await expect(page.getByRole('button', { name: 'Demo', exact: true })).toHaveAttribute('aria-pressed', 'true');
});
