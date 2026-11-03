import { expect, type Locator, type Page, test } from '@playwright/test';
import { openDisplay } from './helpers';

/**
 * Brings the page's clock past a tip's hover delay (the Tooltip's 350 ms) at once, firing its timer: a test that waits
 * the delay out by the wall clock checks too soon on a loaded machine, where the timer fires late, and spends seconds
 * on every hover (issue 177). Needs `page.clock.install()` before the page loads.
 */
const pastTheHoverDelay = (page: Page) => page.clock.runFor(400);

test('hovering Freeze explains what it does, and how to use it', async ({ page }) => {
  await page.goto('/');
  await openDisplay(page);
  const freeze = page.getByRole('button', { name: 'Freeze' });
  await freeze.hover();
  const tip = page.getByRole('tooltip');
  await expect(tip).toBeVisible();
  await expect(tip).toContainText('not the sound');
  await expect(tip).toContainText('Space');
  await expect(freeze).toHaveAttribute('aria-describedby', (await tip.getAttribute('id'))!);

  await page.mouse.move(0, 400);
  await expect(tip).toBeHidden();
});

test('hovering Snapshot explains the grey comparison trace', async ({ page }) => {
  await page.goto('/');
  await openDisplay(page);
  await page.getByRole('button', { name: 'Snapshot', exact: true }).hover();
  await expect(page.getByRole('tooltip')).toContainText('grey');
});

test('keyboard users get the same explanation on focus, and Escape dismisses it', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Display' }).focus(); // open the panel from the keyboard, as a keyboard user would
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Snapshot', exact: true }).focus();
  const snapshotTip = page.getByRole('tooltip').filter({ hasText: 'faint grey trace' });
  await expect(snapshotTip).toBeVisible();
  await page.keyboard.press('Escape');
  // Gone (Escape also closes the panel, back to the Display button, whose own explanation may show: issue 51).
  await expect(snapshotTip).toBeHidden();
});

test('a knob’s and a fader’s tip say their steps for the keys (issue 160)', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab'); // the keys in use: a focus shows its tip
  await page.getByRole('slider', { name: 'Cutoff', exact: true }).focus();
  const tip = page.getByRole('tooltip').filter({ hasText: 'Where the Filter starts' });
  await expect(tip).toBeVisible();
  await expect(tip.locator('.tooltip-keys')).toHaveText('↑↓ a semitone · Shift 10 cents · Page an octave');
  await expect(tip.locator('.tooltip-keys')).toBeVisible();
  await page.getByRole('slider', { name: 'Amp Sustain', exact: true }).focus();
  await expect(page.getByRole('tooltip').filter({ hasText: '↑↓ 1 % · Shift 0.1 % · Page 10 %' })).toBeVisible();
});

// Issue 201: a Mixer fader's steps in the unit it reads, % outside the Synth Geek Layer and dB inside it; Ring's in %.
test('a Mixer fader’s tip says its steps in the unit it reads (issue 201)', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'Mixer' }).click();
  await page.keyboard.press('Tab'); // the keys in use: a focus shows its tip
  const keysOf = async (name: string) => {
    await page.getByRole('slider', { name, exact: true }).focus();
    return page.getByRole('tooltip').locator('.tooltip-keys');
  };
  await expect(await keysOf('Osc 1')).toHaveText('↑↓ 1 % · Shift 0.1 % · Page 10 %');

  await page.evaluate(() => localStorage.setItem('limpide.overlays', JSON.stringify({ geek: true })));
  await page.reload();
  await page.getByRole('tab', { name: 'Mixer' }).click();
  await page.keyboard.press('Tab');
  await expect(await keysOf('Osc 1')).toHaveText('↑↓ 0.5 dB · Shift 0.1 dB · Page 6 dB');
  await expect(await keysOf('Ring')).toHaveText('↑↓ 1 % · Shift 0.1 % · Page 10 %');
});

// Issue 134: with the Synth Geek Layer on, a control with a musical past ends its tip with History; off, no tip has one.
test('with the Synth Geek Layer on, a tip ends with its History line; off, or on Freeze, there is none (issue 134)', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab'); // the keys in use: a focus shows its tip
  const cutoff = page.getByRole('slider', { name: 'Cutoff', exact: true });
  const tip = page.getByRole('tooltip').filter({ hasText: 'Where the Filter starts' });
  await cutoff.focus();
  await expect(tip).toBeVisible();
  await expect(tip.locator('.tooltip-history')).toHaveCount(0);

  await page.evaluate(() => localStorage.setItem('limpide.overlays', JSON.stringify({ geek: true })));
  await page.reload();
  await page.keyboard.press('Tab');
  await cutoff.focus();
  await expect(tip.locator('.tooltip-history')).toHaveText(/^History Moog’s 1964 paper set a Filter’s frequency by a voltage/);
  await expect(tip.locator(':scope > :last-child')).toHaveClass('tooltip-history'); // last, after the keys
  await openDisplay(page);
  await page.getByRole('button', { name: 'Freeze' }).hover();
  await expect(page.getByRole('tooltip').filter({ hasText: 'Stops the pictures' })).toBeVisible();
  await expect(page.getByRole('tooltip').filter({ hasText: 'Stops the pictures' }).locator('.tooltip-history')).toHaveCount(0);
});

test('every toolbar control explains itself, without doubling up on native browser tooltips', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  await openDisplay(page);
  const toolbar = page.getByRole('region', { name: 'Viewer controls' });
  await expect(toolbar.locator('[title]')).toHaveCount(0);
  for (const name of ['Harmonics', 'Ideal', 'Filter’s Response Curve', 'Guides']) {
    await toolbar.getByRole('button', { name }).hover();
    await pastTheHoverDelay(page);
    await expect(page.getByRole('tooltip'), name).toBeVisible();
  }
  for (const name of ['Frequency axis', 'Level axis', 'Scope cycles', 'Env Timeline length']) {
    await toolbar.getByRole('radiogroup', { name }).hover();
    await pastTheHoverDelay(page);
    await expect(page.getByRole('tooltip'), name).toBeVisible();
  }
});

test('headings with an explanation are plain text, with no dotted underline, and still explain themselves on hover', async ({ page }) => {
  await page.goto('/');
  const dotted = await page.evaluate(() =>
    [...document.querySelectorAll('body *')].filter((el) => getComputedStyle(el).textDecorationStyle === 'dotted' && getComputedStyle(el).textDecorationLine.includes('underline')).length,
  );
  expect(dotted).toBe(0);
  await page.getByRole('region', { name: 'LFO & Envelopes' }).getByText('LFO & Envelopes', { exact: true }).hover();
  await expect(page.getByRole('tooltip')).toBeVisible();
});

// Issue 59: the Viewers, every fader, the LFO knobs and the Timeline's key explain themselves too.
test('every Viewer, fader and the Timeline key explain themselves, the tooltip beside what it explains', async ({ page }) => {
  test.slow(); // twenty-odd hovers
  await page.clock.install();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const tip = page.getByRole('tooltip').locator('visible=true');
  const check = async (target: import('@playwright/test').Locator, title: string) => {
    await expect(async () => {
      await page.mouse.move(0, 0);
      await target.hover({ timeout: 2000 });
      await pastTheHoverDelay(page);
      await expect(tip.locator('strong'), title).toHaveText(title, { timeout: 2000 });
      // Placed by what it explains, not at the page's corner (a Viewer's anchor has no box of its own).
      const [t, b] = [(await tip.boundingBox({ timeout: 1000 }))!, (await target.boundingBox())!];
      expect(Math.abs(t.x + t.width / 2 - (b.x + b.width / 2)), title).toBeLessThan(Math.max(b.width, t.width));
    }).toPass({ timeout: 15000 });
  };
  for (const tap of ['Oscillator', 'Filter', 'Amp']) {
    await check(page.getByRole('img', { name: `${tap} Scope` }), `${tap} Scope`);
    await check(page.getByRole('img', { name: `${tap} Spectrum` }), `${tap} Spectrum`);
  }
  await check(page.getByRole('img', { name: 'Envelope Timeline' }), 'Envelope Timeline');
  for (const stage of ['Attack', 'Decay', 'Sustain', 'Release']) {
    await check(page.getByRole('slider', { name: `Amp ${stage}` }), stage);
    await check(page.getByRole('slider', { name: `Filter ${stage}` }), stage);
  }
  await check(page.getByRole('slider', { name: 'LFO 1 Rate' }), 'Rate');
  await check(page.getByRole('slider', { name: 'LFO 2 Depth' }), 'Depth');
  await page.getByRole('slider', { name: 'Filter Envelope Amount' }).press('ArrowUp'); // its key entry shows only then
  await page.evaluate(() => (document.activeElement as HTMLElement).blur()); // and its own tooltip goes
  for (const [mark, title] of [['filterEnvelope', 'Filter Envelope'], ['cutoff', 'Cutoff'], ['amp', 'Amp Envelope']]) {
    await check(page.locator(`.timeline-key [data-mark="${mark}"]`), title);
  }
  await page.getByRole('tab', { name: 'Mixer' }).click();
  await check(page.getByRole('slider', { name: 'Osc 1', exact: true }), 'Osc 1');
  await check(page.getByRole('slider', { name: 'Osc 2', exact: true }), 'Osc 2');
  // Screen readers hear them too: every slider and picture is described.
  const undescribed = await page.evaluate(() =>
    [...document.querySelectorAll('[role=slider], [role=img]')].filter((e) => e.getClientRects().length && !e.hasAttribute('aria-describedby')).map((e) => e.getAttribute('aria-label')),
  );
  expect(undescribed).toEqual([]);
});

// Issue 175: a tip stayed up over the menu its control opens (LFO 2's Destination first), hiding choices.
test.describe('no tip over an open menu (issue 175)', () => {
  test.beforeEach(({ page }) => page.clock.install());
  const tip = (page: Page) => page.getByRole('tooltip').locator('visible=true');
  /** Nothing drawn over any of them: each is what the pointer would find at its centre. */
  const allSeen = async (items: Locator) => {
    const covered = await items.evaluateAll((els) =>
      els.filter((el) => {
        const r = el.getBoundingClientRect();
        return !el.contains(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2));
      }).map((el) => el.textContent),
    );
    expect(covered).toEqual([]);
  };
  /** Hovered until its tip shows, then clicked. */
  const hoverThenClick = async (page: Page, control: Locator) => {
    await control.hover();
    await pastTheHoverDelay(page);
    await expect(tip(page)).toBeVisible();
    await control.click();
  };

  for (const n of [2, 1] as const) {
    test(`LFO ${n}'s Destination: the tip goes as its menu opens, none shows over the choices, and it comes back after`, async ({ page }) => {
      await page.goto('/');
      const lfo = page.getByRole('group', { name: `LFO ${n}`, exact: true });
      const name = lfo.getByRole('button', { name: /Destination:/ });
      await hoverThenClick(page, name);
      const menu = lfo.getByRole('menu');
      await expect(menu).toBeVisible();
      await expect(tip(page)).toHaveCount(0);
      const items = menu.getByRole('menuitemradio');
      await allSeen(items);
      // The pointer slides from the name onto the nearest choice, a pixel at a time across the gap between them, as a
      // hand does; then rests on every choice past the hover delay: still none, nothing covered.
      const [from, menuBox] = [(await name.boundingBox())!, (await menu.boundingBox())!];
      const up = menuBox.y < from.y; // the menu opens upwards near the bottom of the window
      const nearest = up ? items.last() : items.first();
      const to = (await nearest.boundingBox())!;
      const [x, y0, y1] = [from.x + from.width / 2, from.y + from.height / 2, to.y + to.height / 2];
      await page.mouse.move(x, y0);
      await page.mouse.move(x, y1, { steps: Math.ceil(Math.abs(y1 - y0)) });
      for (const item of [nearest, ...(await items.all())]) {
        await item.hover();
        await pastTheHoverDelay(page);
        await expect(tip(page)).toHaveCount(0);
        await allSeen(items);
      }
      await name.hover();
      await pastTheHoverDelay(page);
      await expect(tip(page)).toHaveCount(0);
      await menu.getByRole('menuitemradio', { name: 'Resonance' }).click();
      await expect(menu).toBeHidden();
      await expect(name).toHaveAccessibleName(`LFO ${n} Destination: Resonance`);
      // The next hover shows it again.
      await page.mouse.move(0, 0);
      await name.hover();
      await pastTheHoverDelay(page);
      await expect(tip(page)).toBeVisible();
    });
  }

  test('from the keyboard too: the tip shown on focus goes as the menu opens', async ({ page }) => {
    await page.goto('/');
    const lfo = page.getByRole('group', { name: 'LFO 2', exact: true });
    const name = lfo.getByRole('button', { name: /Destination:/ });
    await name.focus();
    await expect(tip(page)).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(lfo.getByRole('menuitemradio', { name: 'Pitch', exact: true })).toBeFocused();
    await expect(tip(page)).toHaveCount(0);
    await page.keyboard.press('ArrowDown');
    await expect(tip(page)).toHaveCount(0);
    // A panel that leaves the focus on its button: the tip goes all the same.
    await page.keyboard.press('Escape');
    const display = page.getByRole('button', { name: 'Display' });
    await display.focus();
    await expect(tip(page)).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('region', { name: 'Viewer controls' })).toBeVisible();
    await expect(display).toBeFocused();
    await expect(tip(page)).toHaveCount(0);
  });

  test('the Patch picker, Display, MIDI and the Tutorial menu: no tip of theirs over what they open', async ({ page }) => {
    await page.goto('/');
    for (const [control, opened] of [
      [page.getByRole('button', { name: /^Patch:/ }), page.getByRole('dialog', { name: 'Patches' })],
      [page.getByRole('button', { name: 'Display' }), page.getByRole('region', { name: 'Viewer controls' })],
      [page.getByRole('button', { name: 'MIDI', exact: true }), page.getByRole('dialog', { name: 'MIDI' })],
      [page.getByRole('button', { name: 'Tutorial', exact: true }), page.getByRole('group', { name: 'Tutorials' })],
    ] as const) {
      await page.mouse.move(0, 0);
      await hoverThenClick(page, control);
      await expect(opened).toBeVisible();
      await expect(tip(page)).toHaveCount(0);
      // Back over the control while it is open, past the hover delay: still none.
      await page.mouse.move(0, 0);
      await control.hover();
      await pastTheHoverDelay(page);
      await expect(tip(page)).toHaveCount(0);
      await page.keyboard.press('Escape');
      await expect(opened).toBeHidden();
      await page.mouse.move(0, 0);
      await control.hover();
      await pastTheHoverDelay(page);
      await expect(tip(page)).toBeVisible();
    }
  });

  // Issue 188 (added in triage): no tip of a control outside an open panel, where it would lie over the panel's rows;
  // the panel's own controls keep theirs (decided by the owner in issue 175: "Keep it as is").
  test('while a header panel is open, only its own controls show their tips (issue 188)', async ({ page }) => {
    await page.goto('/');
    const header = page.locator('header');
    for (const [control, opened, own] of [
      [header.getByRole('button', { name: 'Display', exact: true }), page.getByRole('region', { name: 'Viewer controls' }), page.getByRole('button', { name: 'Freeze', exact: true })],
      [header.getByRole('button', { name: 'MIDI', exact: true }), page.getByRole('dialog', { name: 'MIDI' }), null],
      [header.getByRole('button', { name: 'Tutorial', exact: true }), page.getByRole('group', { name: 'Tutorials' }), null],
      [page.getByRole('button', { name: /^Patch:/ }), page.getByRole('dialog', { name: 'Patches' }), null],
    ] as const) {
      await control.click();
      await expect(opened).toBeVisible();
      for (const outside of [header.getByRole('button', { name: 'About', exact: true }), header.getByRole('button', { name: 'Song', exact: true })]) {
        await page.mouse.move(0, 0);
        await outside.hover();
        await pastTheHoverDelay(page);
        await expect(tip(page)).toHaveCount(0);
      }
      if (own) {
        await own.hover();
        await pastTheHoverDelay(page);
        await expect(tip(page)).toBeVisible();
      }
      await page.keyboard.press('Escape');
      await expect(opened).toBeHidden();
    }
    // Every panel closed: the tips are back (the focus, back on the Patch's button, taken off it first).
    await page.evaluate(() => (document.activeElement as HTMLElement).blur());
    await page.mouse.move(0, 0);
    await header.getByRole('button', { name: 'About', exact: true }).hover();
    await pastTheHoverDelay(page);
    await expect(tip(page)).toBeVisible();
  });

  test.describe('on a narrow screen', () => {
    test.use({ viewport: { width: 800, height: 900 } });

    test('the Tempo button: no tip of its over the field it opens', async ({ page }) => {
      await page.goto('/');
      const open = page.locator('header').getByRole('button', { name: 'Tempo' });
      await hoverThenClick(page, open);
      await expect(page.getByRole('spinbutton', { name: 'Tempo' })).toBeVisible();
      await expect(tip(page)).toHaveCount(0);
      await page.mouse.move(0, 0);
      await open.hover();
      await pastTheHoverDelay(page);
      await expect(tip(page)).toHaveCount(0);
    });

    test('the Tempo button’s tip says it opens the BPM, and the BPM in the field has its own (issue 194)', async ({ page }) => {
      await page.goto('/');
      const open = page.locator('header').getByRole('button', { name: 'Tempo' });
      await open.hover();
      await pastTheHoverDelay(page);
      await expect(tip(page)).toContainText('Press it');
      await expect(tip(page)).not.toContainText('Drag');
      await page.mouse.move(0, 0);
      await open.click();
      await page.getByRole('spinbutton', { name: 'Tempo' }).hover();
      await pastTheHoverDelay(page);
      await expect(tip(page)).toContainText('Drag it');
    });
  });
});
