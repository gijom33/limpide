import { expect, type Page, test } from '@playwright/test';

// On a phone the sections stack one under another; a strip under the header names them, shows where you are, and
// jumps to each (issue 23).

const SECTIONS = ['Oscillators', 'Filter', 'Amp', 'LFO & Envelopes'];
const strip = (page: Page) => page.getByRole('navigation', { name: 'Sections' });
const tab = (page: Page, name: string) => strip(page).getByRole('button', { name, exact: true });
/** How far a section's top sits below the strip's bottom. */
const below = (page: Page, name: string) =>
  page.evaluate((section) => {
    const top = document.querySelector(`section[aria-label="${section}"]`)!.getBoundingClientRect().top;
    return Math.round(top - document.querySelector('.section-strip')!.getBoundingClientRect().bottom);
  }, name);

test.describe('on a phone', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('a strip names the four sections, each tab a 44 pt target', async ({ page }) => {
    await page.goto('/');
    await expect(strip(page)).toBeVisible();
    for (const name of SECTIONS) {
      const box = (await tab(page, name).boundingBox())!;
      expect(box.height, name).toBeGreaterThanOrEqual(44);
    }
    await expect(strip(page)).toContainText(/OSC.*FILTER.*AMP.*LFO & ENV/i);
  });

  test('a tab lands its section just under the strip, going down and back up, and is highlighted', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-db', /.+/);
    for (const name of ['Filter', 'LFO & Envelopes', 'Amp', 'Oscillators', 'Filter']) {
      await tab(page, name).click();
      if (name === 'LFO & Envelopes') {
        // The last section: the page ends before its top reaches the strip, so it scrolls to the end, all of it in view.
        await expect.poll(() => page.evaluate(() => Math.round(innerHeight + scrollY - document.documentElement.scrollHeight))).toBe(0);
        expect(await below(page, name)).toBeGreaterThanOrEqual(8);
      } else {
        await expect.poll(() => below(page, name), { message: name }).toBe(8);
      }
      await expect(tab(page, name)).toHaveAttribute('aria-current', 'true');
    }
  });

  test('scrolling by hand moves the highlight to the section in view', async ({ page }) => {
    await page.goto('/');
    await expect(tab(page, 'Oscillators')).toHaveAttribute('aria-current', 'true');
    for (const name of ['Amp', 'Filter', 'Oscillators']) {
      // The section's top a little under the strip, as a thumb would leave it.
      await page.evaluate((section) => {
        const top = document.querySelector(`section[aria-label="${section}"]`)!.getBoundingClientRect().top;
        scrollBy(0, top - 260);
      }, name);
      await expect(tab(page, name)).toHaveAttribute('aria-current', 'true');
      for (const other of SECTIONS.filter((n) => n !== name)) await expect(tab(page, other)).not.toHaveAttribute('aria-current');
    }
  });

  test('scrolling down slides the header up until only the piano shows; scrolling up brings it back; nothing below moves', async ({ page }) => {
    await page.goto('/');
    const logo = page.getByRole('heading', { level: 1, name: 'Limpide' });
    const demo = page.getByRole('button', { name: 'Demo' });
    const piano = page.getByRole('group', { name: 'Piano' });
    const stripUnderHeader = () =>
      page.evaluate(() => Math.round(document.querySelector('.section-strip')!.getBoundingClientRect().top - document.querySelector('header')!.getBoundingClientRect().bottom));
    const headerHeight = () => page.locator('header').evaluate((h) => h.getBoundingClientRect().height);
    const tall = await headerHeight();
    await expect(logo).toBeInViewport();
    for (let i = 0; i < 6; i++) await page.mouse.wheel(0, 120);
    await expect(logo).not.toBeInViewport();
    await expect(demo).not.toBeInViewport(); // the playing row goes too
    await expect.poll(() => piano.boundingBox().then((b) => Math.round(b!.y))).toBeLessThanOrEqual(8); // the piano stays at hand, at the top
    await expect.poll(stripUnderHeader).toBe(-1);
    expect(await headerHeight()).toBe(tall); // it slides; it never changes height, so the page never jumps
    await page.mouse.wheel(0, -60);
    await expect(logo).toBeInViewport();
    await expect(demo).toBeInViewport();
    await expect.poll(stripUnderHeader).toBe(-1);
  });

  test('tapping a section keeps the header slid away, going down or up; only scrolling up brings it back', async ({ page }) => {
    await page.goto('/');
    const logo = page.getByRole('heading', { level: 1, name: 'Limpide' });
    await page.getByRole('navigation', { name: 'Sections' }).getByRole('button', { name: 'Amp' }).click();
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(500);
    await page.waitForTimeout(1000); // well after the page has stopped
    await expect(logo).not.toBeInViewport();
    // Nor does a jump back up: only a scroll of one's own brings the rows back.
    await page.getByRole('navigation', { name: 'Sections' }).getByRole('button', { name: 'Filter' }).click();
    await page.waitForTimeout(1000);
    await expect(logo).not.toBeInViewport();
    const filter = (await page.getByRole('region', { name: 'Filter' }).boundingBox())!;
    const strip = (await page.getByRole('navigation', { name: 'Sections' }).boundingBox())!;
    expect(Math.abs(filter.y - (strip.y + strip.height) - 8)).toBeLessThanOrEqual(2); // landed just under the strip
    await page.mouse.wheel(0, -60);
    await expect(logo).toBeInViewport();
  });

  test('Display sits in the playing row, left of About, icon over word; the first row is the logo and the Patch', async ({ page }) => {
    await page.goto('/');
    const box = (name: string) => page.getByRole('button', { name, exact: true }).boundingBox().then((b) => b!);
    const [display, about, demo, patch] = [await box('Display'), await box('About'), await box('Demo'), await page.getByRole('button', { name: /^Patch:/ }).boundingBox()];
    expect(Math.abs(display.y - about.y)).toBeLessThan(2);
    expect(Math.abs(display.y - demo.y)).toBeLessThan(2);
    expect(display.x + display.width).toBeLessThanOrEqual(about.x);
    expect(display.height).toBeGreaterThanOrEqual(44);
    await expect(page.getByRole('button', { name: 'Display', exact: true }).getByText('Display')).toBeVisible();
    expect(patch!.y + patch!.height).toBeLessThan(display.y);
  });

  test('the playing row’s icons carry their word, and About is one of them (tooltips need a pointer)', async ({ page }) => {
    await page.goto('/');
    const row = await page.evaluate(() =>
      ['Demo', 'Song', 'Hold', 'MIDI', 'About'].map((name) => {
        const button = [...document.querySelectorAll<HTMLElement>('header button')].find(
          (b) => b.getAttribute('aria-label') === name || b.textContent?.trim() === name,
        );
        if (!button?.checkVisibility()) return `${name}: not shown`;
        const word = [...button.querySelectorAll<HTMLElement>('span')].find((s) => s.textContent?.trim() === name);
        const r = button.getBoundingClientRect();
        return `${name}: word ${word?.checkVisibility() ? 'shown' : 'hidden'} top ${Math.round(r.top)}`;
      }),
    );
    expect(row.every((r) => r.includes('word shown')), row.join('; ')).toBe(true);
    expect(new Set(row.map((r) => r.split('top ')[1])).size, row.join('; ')).toBe(1); // one row
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  });

  test('the next section peeks above the fold: the Filter’s name and first row are on the first screen', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-db', /.+/);
    const filter = page.getByRole('region', { name: 'Filter' });
    const mode = (await filter.getByRole('radiogroup', { name: 'Filter Mode' }).boundingBox())!;
    expect(mode.y + mode.height).toBeLessThanOrEqual(812);
    await expect(filter.getByRole('heading', { name: 'Filter' })).toBeInViewport();
  });
});

test('on a laptop there is no strip: every section is on screen', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(strip(page)).toBeHidden();
});
