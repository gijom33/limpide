import { readFileSync } from 'node:fs';
import { expect, type Page, test } from '@playwright/test';
import { holding, WELCOMED } from './startState';

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
  // Issue 172: in the tip link's place (issue 146), a share-or-star line, the star linking to the repository.
  await expect(about).toContainText('Enjoying Limpide? Share it, or star it on GitHub');
  await expect(about.getByRole('link', { name: 'star it on GitHub' })).toHaveAttribute('href', 'https://github.com/gijom33/limpide');
  await expect(about.getByRole('link', { name: /coffee/i })).toHaveCount(0);
  // Issue 134: where the Synth Geek Layer's History lines come from.
  await expect(about.getByRole('link', { name: 'History’s sources' })).toHaveAttribute(
    'href',
    'https://github.com/gijom33/limpide/blob/main/docs/research/134-history-in-the-tooltips.md',
  );

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

// From 1100 px Demo, Tutorial and Song keep their words; About, in the set-up row beside the tempo, from 1366 px (issue 112).
test('an ⓘ button opens About at every width, with the word About from 1366 px up and under its icon in the 2 × 2 layout', async ({ page }) => {
  const about = page.getByRole('dialog', { name: 'Limpide' });
  const button = page.getByRole('button', { name: 'About' });
  for (const [width, height, word] of [[1440, 900, true], [1366, 900, true], [1365, 900, false], [1100, 900, false], [1099, 900, false], [1000, 800, false], [861, 800, false], [700, 800, true]] as const) {
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
test('About links the third-party notices, which carry React’s licence and end with Limpide’s own (issues 42, 111)', async ({ page, request }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'About', exact: true }).click();
  const link = page.getByRole('link', { name: 'Third-party notices' });
  await expect(link).toBeVisible();
  const notices = await (await request.get(new URL((await link.getAttribute('href'))!, page.url()).href)).text();
  for (const name of ['react', 'react-dom', 'scheduler']) expect(notices).toMatch(new RegExp(`^${name} \\d`, 'm'));
  expect(notices).toContain('MIT License');
  expect(notices).toContain('Modernizr');
  // Issue 111: the notices end with Limpide's own licence, the MIT terms the rest of the site ships under.
  const own = notices.split(`\n${'-'.repeat(72)}\n`).at(-1)!.trim();
  expect(own).toMatch(/^Limpide \d+\.\d+\.\d+\n\nMIT License\n\nCopyright \(c\) 2026 Guillaume Boillet\n/);
  expect(own).toMatch(/OTHER DEALINGS IN THE\nSOFTWARE\.$/);
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

test('About, opened any time, offers the Demo and the Tour beside Close (the owner, 2026-10-27; issue 128)', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'About' }).click();
  const about = page.getByRole('dialog', { name: 'Limpide' });
  await expect(about.locator('.about-actions').getByRole('button')).toHaveText(['Play the Demo', 'Take the Tour', 'Close']);
  await about.getByRole('button', { name: 'Play the Demo' }).click();
  await expect(about).toBeHidden();
  await expect(page.getByRole('button', { name: 'Demo', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

// Issue 163: Bead, out on the page by default (issue 150), stands beside About's logo at twice its page size, and a
// click on it shows its card of tricks in place of the credits. With its switch off, About is as before.
test.describe('Bead in About (issue 163)', () => {
  const about = (page: Page) => page.getByRole('dialog', { name: 'Limpide' });
  const bead = (page: Page) => about(page).getByRole('button', { name: 'Bead, Limpide’s water drop: its tricks' });
  const card = (page: Page) => about(page).getByRole('region', { name: 'Bead' });
  const credits = (page: Page) => about(page).locator('.about-credits');

  test.describe('switched on', () => {
    test.use({ storageState: holding({ ...WELCOMED, 'limpide.bead': 'on' }) });

    test('it stands on the logo’s baseline to its right, twice its size on the page', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('.mascot')).toHaveCount(1, { timeout: 6000 });
      const onPage = (await page.locator('.mascot-drop svg').boundingBox())!;
      await page.getByRole('button', { name: 'About', exact: true }).click();
      await expect(bead(page)).toBeVisible();
      const logo = (await about(page).locator('.logo').boundingBox())!;
      const drawn = (await bead(page).locator('svg').boundingBox())!;
      expect(drawn.width / onPage.width).toBeCloseTo(2, 1);
      expect(drawn.height / onPage.height).toBeCloseTo(2, 1);
      expect(drawn.x, 'to the logo’s right').toBeGreaterThanOrEqual(logo.x + logo.width);
      expect(Math.abs(drawn.y + drawn.height - (logo.y + logo.height)), 'on its baseline').toBeLessThanOrEqual(1);
    });

    test('it fits in About down to the narrowest window, the logo centred with it where the two need room', async ({ page }) => {
      for (const width of [280, 320, 340, 375]) {
        await page.setViewportSize({ width, height: 700 });
        await page.goto('/');
        await page.getByRole('button', { name: 'About', exact: true }).click();
        const dialog = (await about(page).boundingBox())!;
        const drawn = (await bead(page).boundingBox())!;
        expect(drawn.x + drawn.width, `${width}px`).toBeLessThanOrEqual(dialog.x + dialog.width - 8);
        expect(await about(page).evaluate((d) => d.scrollWidth <= d.clientWidth), `${width}px: no sideways scroll`).toBe(true);
      }
    });

    test('a click shows its card in place of the credits; Back returns to them', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: 'About', exact: true }).click();
      await expect(card(page)).toHaveCount(0);
      await bead(page).click();
      await expect(card(page)).toBeVisible();
      await expect(credits(page)).toHaveCount(0);
      await expect(bead(page)).toHaveAttribute('aria-expanded', 'true');
      for (const words of ['water drop', 'tickle', 'Display', 'B, E, A, D']) await expect(card(page)).toContainText(words);
      await expect(card(page).getByRole('listitem').first()).toBeVisible();
      await expect(card(page).getByRole('link', { name: 'All its secrets' })).toHaveAttribute('href', 'https://github.com/gijom33/limpide/blob/main/docs/bead.md');
      await card(page).getByRole('button', { name: 'Back' }).click();
      await expect(card(page)).toHaveCount(0);
      await expect(credits(page)).toContainText('Guillaume Boillet');
      await expect(bead(page)).toBeFocused();
    });

    test('opened, About puts the focus on its way in, the Demo, not on Bead, so no ring shows round Bead (Safari)', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: 'About', exact: true }).click();
      await expect(about(page).getByRole('button', { name: 'Play the Demo' })).toBeFocused();
      expect(await bead(page).evaluate((b) => b.matches(':focus-visible'))).toBe(false);
    });

    test('from the keyboard: Enter shows the card, Escape returns to the credits, a second Escape closes About', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: 'About', exact: true }).click();
      await bead(page).focus();
      await page.keyboard.press('Enter');
      await expect(card(page)).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(card(page)).toHaveCount(0);
      await expect(about(page)).toBeVisible();
      await expect(credits(page)).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(about(page)).toBeHidden();
      // Opened again, About shows the credits.
      await page.getByRole('button', { name: 'About', exact: true }).click();
      await expect(credits(page)).toBeVisible();
    });

    test('it is idle as on the page: it blinks and moves; with reduced motion it is there, still', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: 'About', exact: true }).click();
      await expect(bead(page)).toBeVisible();
      expect(await bead(page).evaluate((b) => b.getAnimations({ subtree: true }).length)).toBeGreaterThan(0);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.reload();
      await page.getByRole('button', { name: 'About', exact: true }).click();
      await expect(bead(page)).toBeVisible();
      expect(await bead(page).evaluate((b) => b.getAnimations({ subtree: true }).length)).toBe(0);
    });
  });

  test.describe('on a short phone, switched on', () => {
    test.use({ storageState: holding({ 'limpide.bead': 'on' }), viewport: { width: 393, height: 659 }, hasTouch: true });

    test('a tap shows its card; the welcome’s Demo and Tour stay on the first screen, with the credits or the card', async ({ page }) => {
      await page.goto('/');
      await expect(about(page)).toBeVisible();
      const wayIn = async (what: string) => {
        for (const name of ['Play the Demo', 'Take the Tour']) await expect(about(page).getByRole('button', { name, exact: true }), `${name}, ${what}`).toBeInViewport({ ratio: 1 });
        await expect(bead(page), what).toBeInViewport({ ratio: 1 });
        expect(await about(page).evaluate((d) => d.scrollHeight <= d.clientHeight), what).toBe(true);
      };
      await wayIn('the credits');
      await bead(page).tap();
      await expect(card(page)).toBeVisible();
      await wayIn('the card');
    });
  });

  test('switched off, it is not there: About is as before', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'About', exact: true }).click();
    await expect(credits(page)).toBeVisible();
    await expect(about(page).getByRole('button', { name: /Bead/ })).toHaveCount(0);
    await expect(about(page).locator('svg')).toHaveCount(1); // the logo alone
  });
});
