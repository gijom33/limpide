import { readFileSync } from 'node:fs';
import { expect, type Page, test } from '@playwright/test';
import { BEAD_ON, holding, WELCOMED } from './startState';

const { version } = JSON.parse(readFileSync('package.json', 'utf8'));

test('the logo opens the About splash: version, build and credits; its ×, Escape or a click outside close it (issue 209)', async ({ page }) => {
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

  // Issue 209: a × in its top corner closes it, as the Demo's card closes; there is no Close button.
  const cross = about.getByRole('button', { name: 'Close About' });
  const [crossBox, aboutBox] = [(await cross.boundingBox())!, (await about.boundingBox())!];
  expect(crossBox.y - aboutBox.y, 'at the top').toBeLessThan(20);
  expect(aboutBox.x + aboutBox.width - (crossBox.x + crossBox.width), 'in the right corner').toBeLessThan(20);
  await expect(about.getByRole('button', { name: 'Close', exact: true })).toHaveCount(0);
  await cross.click();
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

// From 1100 px About keeps its word, one of the newcomer's four with Demo, Tutorial and Song, under Tutorial (issue 154).
test('an ⓘ button opens About at every width, with the word About from 1100 px up and under its icon in the 2 × 2 layout', async ({ page }) => {
  const about = page.getByRole('dialog', { name: 'Limpide' });
  const button = page.getByRole('button', { name: 'About' });
  for (const [width, height, word] of [[1440, 900, true], [1366, 900, true], [1100, 900, true], [1099, 900, false], [1000, 800, false], [861, 800, false], [700, 800, true]] as const) {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await expect(button, `${width}px`).toBeVisible();
    await expect(button.getByText('About'), `${width}px`).toBeVisible({ visible: word });
    await button.click();
    await expect(about, `${width}px`).toContainText(`Version ${version}`);
    await about.getByRole('button', { name: 'Close About' }).click();
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

test('About, opened any time, offers the Demo and the Tour at its foot (the owner, 2026-10-27; issues 128, 209)', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'About' }).click();
  const about = page.getByRole('dialog', { name: 'Limpide' });
  await expect(about.locator('.about-actions').getByRole('button')).toHaveText(['Play the Demo', 'Take the Tour']);
  await about.getByRole('button', { name: 'Play the Demo' }).click();
  await expect(about).toBeHidden();
  await expect(page.getByRole('button', { name: 'Demo', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

// Issue 163: Bead, out on the page by default (issue 150), stands in About right of the name (at its page size, issue 178),
// and a click on it shows its card of tricks in place of the credits. With its switch off, About is as before.
test.describe('Bead in About (issue 163)', () => {
  const about = (page: Page) => page.getByRole('dialog', { name: 'Limpide' });
  const bead = (page: Page) => about(page).getByRole('button', { name: 'Bead, Limpide’s water drop: its tricks' });
  const card = (page: Page) => about(page).getByRole('region', { name: 'Bead' });
  const credits = (page: Page) => about(page).locator('.about-credits');
  const name = (page: Page) => about(page).getByRole('heading', { name: 'Limpide', exact: true });

  test.describe('switched on', () => {
    test.use({ storageState: holding({ ...WELCOMED, ...BEAD_ON }) });

    // Issue 178: at its own size, to the right of the word "Limpide", its foot on the word's baseline; the mark and the
    // word centred as without Bead (decisions 3 and 4, the owner's).
    test('it stands at its size on the page, to the right of the name, its foot on the name’s baseline', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('.mascot')).toHaveCount(1, { timeout: 6000 });
      const onPage = (await page.locator('.mascot-drop svg').boundingBox())!;
      for (const [width, height] of [[393, 659], [1440, 900]] as const) {
        await page.setViewportSize({ width, height });
        await page.goto('/');
        await page.getByRole('button', { name: 'About', exact: true }).click();
        await expect(bead(page)).toBeVisible();
        const logo = (await about(page).locator('.logo').boundingBox())!;
        const drawn = (await bead(page).locator('svg').boundingBox())!;
        const body = (await about(page).locator('.about-body').boundingBox())!;
        // The name's words and baseline, in the window's pixels: an empty inline block sits on the baseline.
        const line = await name(page).evaluate((h) => {
          const range = document.createRange();
          range.selectNodeContents(h);
          const words = range.getBoundingClientRect();
          const probe = document.createElement('span');
          probe.style.display = 'inline-block';
          h.append(probe);
          const baseline = probe.getBoundingClientRect().bottom;
          probe.remove();
          return { left: words.left, right: words.right, baseline };
        });
        const middle = body.x + body.width / 2;
        expect(drawn.width, `${width}px: its width on the page`).toBeCloseTo(onPage.width, 0);
        expect(drawn.height, `${width}px: its height on the page`).toBeCloseTo(onPage.height, 0);
        expect(drawn.x, `${width}px: to the name’s right`).toBeGreaterThanOrEqual(line.right);
        expect(Math.abs(drawn.y + drawn.height - line.baseline), `${width}px: its foot on the name’s baseline`).toBeLessThanOrEqual(1);
        expect(Math.abs((line.left + line.right) / 2 - middle), `${width}px: the name centred alone`).toBeLessThanOrEqual(1);
        expect(Math.abs(logo.x + logo.width / 2 - middle), `${width}px: the mark centred alone`).toBeLessThanOrEqual(1);
        // Bead adds no height: the row is as tall as the name, so the name stands where it does without Bead.
        const row = (await about(page).locator('.about-name').boundingBox())!;
        const title = (await name(page).boundingBox())!;
        expect(Math.abs(row.height - title.height), `${width}px: the row as tall as the name`).toBeLessThanOrEqual(1);
      }
    });

    test('down to the narrowest window it fits in About, the name still centred', async ({ page }) => {
      for (const width of [280, 320, 340, 375]) {
        await page.setViewportSize({ width, height: 700 });
        await page.goto('/');
        await page.getByRole('button', { name: 'About', exact: true }).click();
        const dialog = (await about(page).boundingBox())!;
        const drawn = (await bead(page).boundingBox())!;
        const body = (await about(page).locator('.about-body').boundingBox())!;
        const words = await name(page).evaluate((h) => {
          const range = document.createRange();
          range.selectNodeContents(h);
          const box = range.getBoundingClientRect();
          return (box.left + box.right) / 2;
        });
        expect(Math.abs(words - (body.x + body.width / 2)), `${width}px: the name centred`).toBeLessThanOrEqual(1);
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
    test.use({ storageState: holding(BEAD_ON), viewport: { width: 393, height: 659 }, hasTouch: true });

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
    await expect(about(page).locator(':not(.about-close) > svg')).toHaveCount(1); // the logo alone, beside its × (issue 209)
  });
});

// Issue 209: a finger, the wheel or a key on About scrolls nothing behind it; About's own credits still scroll inside it;
// and closing it leaves the page where it was (decisions 1 and 4).
test.describe('About holds the page still (issue 209)', () => {
  const about = (page: Page) => page.getByRole('dialog', { name: 'Limpide' });
  /** The page scrolled halfway down, then About opened from its ⓘ button without scrolling to it: where the page is. */
  const openScrolled = async (page: Page) => {
    await page.goto('/');
    const y = await page.evaluate(() => Math.round((document.documentElement.scrollHeight - innerHeight) / 2));
    expect(y, 'the page scrolls').toBeGreaterThan(100);
    await page.evaluate((y) => window.scrollTo(0, y), y);
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(y);
    await page.getByRole('button', { name: 'About', exact: true }).dispatchEvent('click');
    await expect(about(page)).toBeVisible();
    expect(await page.evaluate(() => scrollY), 'opening scrolls nothing').toBe(y);
    return y;
  };
  const centre = async (locator: ReturnType<Page['locator']>) => {
    const box = (await locator.boundingBox())!;
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  };

  test('on a computer, the wheel over About or a key in it leaves the page where it is; its × leaves it there too', async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 600 });
    const y = await openScrolled(page);
    for (const part of [about(page).locator('.about-mark'), about(page).locator('.about-credits'), about(page).locator('.about-actions')]) {
      const at = await centre(part);
      await page.mouse.move(at.x, at.y);
      for (const dy of [600, -200, 600]) await page.mouse.wheel(0, dy);
      await page.waitForTimeout(300);
      expect(await page.evaluate(() => scrollY), 'the wheel').toBe(y);
    }
    for (const key of ['PageDown', 'ArrowDown', 'End']) await page.keyboard.press(key);
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => scrollY), 'the keys').toBe(y);
    await about(page).getByRole('button', { name: 'Close About' }).click();
    await expect(about(page)).toBeHidden();
    expect(await page.evaluate(() => scrollY), 'closed').toBe(y);
  });

  test('Escape and a click outside leave the page where it was', async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 600 });
    for (const close of ['Escape', 'a click outside'] as const) {
      const y = await openScrolled(page);
      if (close === 'Escape') await page.keyboard.press('Escape');
      else await page.mouse.click(5, 5);
      await expect(about(page)).toBeHidden();
      expect(await page.evaluate(() => scrollY), close).toBe(y);
    }
  });

  test.describe('on a short phone', () => {
    test.use({ viewport: { width: 393, height: 540 }, hasTouch: true, isMobile: true });
    test.skip(({ browserName }) => browserName !== 'chromium', 'drives a real finger through the Chrome DevTools Protocol');

    /** A real finger dragged up the screen by `by` pixels from `from`. */
    const drag = async (page: Page, from: { x: number; y: number }, by: number) => {
      const cdp = await page.context().newCDPSession(page);
      const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', y: number) =>
        cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x: from.x, y }] });
      await touch('touchStart', from.y);
      for (let i = 1; i <= 10; i++) await touch('touchMove', from.y - (by * i) / 10);
      await touch('touchEnd', from.y - by);
      await page.waitForTimeout(400); // any fling done
    };

    test('a finger dragged on About scrolls nothing behind it; the credits scroll inside it; its × leaves the page there', async ({ page }) => {
      const y = await openScrolled(page);
      const credits = about(page).locator('.about-credits');
      expect(await credits.evaluate((dl) => dl.scrollHeight > dl.clientHeight), 'the credits are taller than their room').toBe(true);

      // Outside the credits: the mark, the version, the buttons' row.
      for (const part of ['.about-mark', '.about-version', '.about-actions']) {
        await drag(page, await centre(about(page).locator(part)), 150);
        expect(await page.evaluate(() => scrollY), part).toBe(y);
      }
      // On the credits: they scroll inside About, the page behind does not, nor when they are at their end.
      await drag(page, await centre(credits), 120);
      expect(await credits.evaluate((dl) => dl.scrollTop), 'the credits scrolled').toBeGreaterThan(20);
      expect(await page.evaluate(() => scrollY), 'the credits').toBe(y);
      for (let i = 0; i < 3; i++) await drag(page, await centre(credits), 200);
      expect(await page.evaluate(() => scrollY), 'the credits at their end').toBe(y);
      // And back down past their top.
      for (let i = 0; i < 3; i++) await drag(page, await centre(credits), -200);
      expect(await credits.evaluate((dl) => dl.scrollTop), 'the credits back at their top').toBe(0);
      expect(await page.evaluate(() => scrollY), 'the credits at their top').toBe(y);

      await about(page).getByRole('button', { name: 'Close About' }).tap();
      await expect(about(page)).toBeHidden();
      expect(await page.evaluate(() => scrollY), 'closed').toBe(y);
    });
  });
});

// Issue 209, decision 3 (Claude's call, open to the owner): About's × the size of the Demo card's.
test('About’s × is the Demo card’s ×, on a computer and a phone (issue 209)', async ({ page }) => {
  for (const [width, height] of [[1440, 900], [393, 659]] as const) {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await page.getByRole('button', { name: 'Demo', exact: true }).click();
    const demoCross = (await page.getByRole('region', { name: 'Demo' }).getByRole('button', { name: 'Close the card' }).boundingBox())!;
    await page.getByRole('button', { name: 'About', exact: true }).click();
    const cross = (await page.getByRole('dialog', { name: 'Limpide' }).getByRole('button', { name: 'Close About' }).boundingBox())!;
    expect([cross.width, cross.height], `${width}px`).toEqual([demoCross.width, demoCross.height]);
  }
});
