import { expect, type Page, test } from '@playwright/test';

// Issue 57: a Tutorial rebuilds a Preset from Init, the person turning each control.

const card = (page: Page) => page.getByRole('region', { name: /^Tutorial: / });
const action = (page: Page, name: string) => card(page).getByRole('button', { name, exact: true });
const progress = (page: Page) => card(page).locator('.tutorial-progress');
const patchName = (page: Page) => page.getByRole('button', { name: /^Patch: / });
const ringed = (page: Page) => page.locator('[data-tutorial]:not(.section-strip button)');

async function open(page: Page, preset: string) {
  await page.goto('/');
  await patchName(page).click();
  await page.getByRole('dialog', { name: 'Patches' }).getByRole('group', { name: 'Tutorials' }).getByRole('button', { name: new RegExp(`^Tutorial: ${preset}`) }).click();
  await expect(card(page)).toBeVisible();
}

/**
 * The Step on the card made with "Do it for me", then Next (or Finish). The Step is made a moment after the press, once
 * the control rests within reach, and one already made (a Display option on at first) hides the button by itself: so
 * click while it shows, until Next is enabled, however slow the machine.
 */
async function makeStep(page: Page) {
  const next = card(page).getByRole('button', { name: /^(Next|Finish)$/ });
  const doIt = action(page, 'Do it for me');
  await expect(async () => {
    if (await doIt.isVisible()) await doIt.click({ timeout: 2000 });
    await expect(next).toBeEnabled({ timeout: 2000 });
  }).toPass({ timeout: 30000 });
  await next.click();
}

/** Every Step made with "Do it for me", to the last card. */
async function doEverything(page: Page) {
  while (await card(page).getByRole('button', { name: /^(Next|Finish)$/ }).isVisible()) await makeStep(page);
}

test('a Tutorial from the Patches panel: Init loaded, the control ringed with its target, turned by hand, then its note', async ({ page }) => {
  await open(page, 'Bass');
  await expect(patchName(page)).toHaveAttribute('aria-label', 'Patch: Init');
  await expect(card(page)).toContainText('A saw with a square an octave below');
  await expect(progress(page)).toHaveText('15 steps');
  await action(page, 'Start').click();
  await expect(progress(page)).toHaveText('Step 1 of 15');

  // Osc 2's level, on the Mixer tab: the tab is brought into view, the fader ringed with its target.
  const fader = page.getByRole('slider', { name: 'Osc 2', exact: true });
  await expect(fader).toBeVisible();
  await expect(ringed(page)).toHaveAttribute('data-learn', 'param:mixOsc2');
  await expect(ringed(page)).toHaveAttribute('data-tutorial-target', '→ 50 %');
  await expect(card(page).getByRole('button', { name: 'Next' })).toBeDisabled();

  // Turned by keys to near half: the Step is made, the fader snaps to the exact target, and the note shows.
  // "Step n of m" against the name beside it: the card grows as the note shows, so only the offset tells.
  const wordsTop = () => card(page).evaluate((e) => {
    const top = (node: Element) => {
      const range = document.createRange();
      range.selectNodeContents(node);
      return range.getClientRects()[0].top;
    };
    return top(e.querySelector('.tutorial-progress')!) - top(e.querySelector('.tutorial-name')!);
  });
  const before = await wordsTop();
  await fader.focus();
  const note = card(page).getByText('Louder, not different');
  // Up to 46 %, within reach: once it rests there a moment, the Step counts and the fader snaps to the target.
  for (let i = 0; i < 23; i++) await page.keyboard.press('ArrowUp');
  await expect(fader).toHaveAttribute('aria-valuetext', '46 %');
  await expect(note).toBeVisible();
  await expect(progress(page)).toHaveAttribute('data-done'); // its tick, in the top row too, which leaves the words put
  expect(Math.abs((await wordsTop()) - before)).toBeLessThan(1);
  await expect(fader).toHaveAttribute('aria-valuetext', '50 %');
  await expect(fader).toBeFocused(); // the card never takes the focus
  await action(page, 'Next').click();
  await expect(ringed(page)).toHaveAttribute('data-learn', 'choice:osc2Waveform');

  // Back moves the card only: nothing is undone.
  await action(page, 'Back').click();
  await expect(progress(page)).toHaveText('Step 1 of 15');
  await expect(fader).toHaveAttribute('aria-valuetext', '50 %');
  await expect(card(page)).toContainText('Louder, not different');
});

test('"Do it for me" to the end: the sound is the Preset, named after it, and the Tutorial is ticked, even after a reload', async ({ page }) => {
  test.slow(); // fifteen Steps
  await open(page, 'Bass');
  await action(page, 'Start').click();
  await doEverything(page);
  await expect(progress(page)).toHaveText('Done');
  await expect(card(page)).toContainText('This is the Bass Preset, built by you.');
  await expect(patchName(page)).toHaveAttribute('aria-label', 'Patch: Bass');
  await expect(page.locator('.patch-changed')).toHaveCount(0);
  await action(page, 'Done').click();
  await expect(card(page)).toBeHidden();
  await expect(page.locator('[data-tutorial]')).toHaveCount(0);

  await page.reload();
  await patchName(page).click();
  await expect(page.getByRole('button', { name: 'Tutorial: Bass, finished' })).toBeVisible();
});

test('off the path: nothing is locked, and the last card names what differs and matches the Preset in one tap', async ({ page }) => {
  test.slow(); // every Step of Acid: past 30 s in WebKit under load
  await page.goto('/');
  await patchName(page).click();
  // The door beside the Preset itself.
  await page.getByRole('dialog', { name: 'Patches' }).getByRole('group', { name: 'Bass' }).getByRole('button', { name: 'Tutorial: Acid' }).click();
  await action(page, 'Start').click();
  // A control the Tutorial does not ask for still turns.
  const keyTrack = page.getByRole('slider', { name: 'Key Track' });
  await keyTrack.focus();
  await page.keyboard.press('ArrowUp');
  await expect(keyTrack).not.toHaveAttribute('aria-valuetext', '0 %');
  await doEverything(page);
  await expect(card(page)).toContainText('Not quite the Preset yet: Key Track.');
  await action(page, 'Match the Preset').click();
  await expect(card(page)).toContainText('This is the Acid Preset, built by you.');
  await expect(patchName(page)).toHaveAttribute('aria-label', 'Patch: Acid');
  await expect(keyTrack).toHaveAttribute('aria-valuetext', '0 %');
});

test('a Display option Step rings the Display button, then the option once the panel is open', async ({ page }) => {
  // Ideal is on at first (the owner, 2026-10-28): a learner who turned it off is asked for it again.
  await page.addInitScript(() => localStorage.setItem('limpide.overlays', JSON.stringify({ ideal: false })));
  await open(page, 'Bass');
  await action(page, 'Start').click();
  for (let i = 0; i < 3; i++) {
    await action(page, 'Do it for me').click();
    await action(page, 'Next').click();
  }
  await expect(progress(page)).toHaveText('Step 4 of 15');
  await expect(ringed(page)).toHaveAttribute('aria-label', 'Display');
  await page.getByRole('button', { name: 'Display' }).click();
  const ideal = page.getByRole('button', { name: 'Ideal' });
  await expect(ringed(page)).toHaveAttribute('data-overlay', 'ideal');
  await ideal.click();
  await expect(ideal).toHaveAttribute('aria-pressed', 'true');
  await expect(card(page)).toContainText('Circles mark where Osc 1’s saw puts its Harmonics');
});

test('Listen repeats the Tutorial’s phrase on the sound as it is, until pressed again; Quit stops it and leaves the sound', async ({ page }) => {
  await open(page, 'Pluck');
  const listen = action(page, 'Listen');
  await listen.click();
  await expect(listen).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.piano [aria-pressed="true"]').first()).toBeVisible({ timeout: 5000 });
  await listen.click();
  await expect(listen).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('.piano [aria-pressed="true"]')).toHaveCount(0, { timeout: 3000 });

  await action(page, 'Start').click();
  await action(page, 'Do it for me').click();
  await listen.click();
  await card(page).getByRole('button', { name: 'Quit the tutorial' }).click();
  await expect(card(page)).toBeHidden();
  await expect(page.locator('.piano [aria-pressed="true"]')).toHaveCount(0, { timeout: 3000 });
  await expect(page.getByRole('radio', { name: 'Pulse' }).first()).toHaveAttribute('aria-checked', 'true'); // what was built stays
});

test('the Demo ends a Tutorial (it loads its own Presets)', async ({ page }) => {
  await open(page, 'Wobble');
  await page.getByRole('button', { name: 'Demo' }).click();
  await expect(card(page)).toBeHidden();
});

for (const [layout, width, height] of [['phone', 375, 812], ['2 × 2', 690, 830]] as const) {
  test(`on a ${layout}, every Step's control comes into view, clear of the header and the card`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width, height });
    await open(page, 'Wobble');
    await action(page, 'Start').click();
    for (;;) {
      await page.waitForTimeout(150); // the jump to the control
      const clear = await page.evaluate(() => {
        const control = document.querySelector('[data-tutorial]:not(.section-strip button)')!.getBoundingClientRect();
        const card = document.querySelector('.tutorial')!.getBoundingClientRect();
        const header = document.querySelector('header')!.getBoundingClientRect();
        const strip = document.querySelector('.section-strip')?.getBoundingClientRect();
        const top = Math.max(header.bottom, strip?.height ? strip.bottom : 0);
        return { above: control.bottom <= card.top, below: control.top >= top, control: Math.round(control.top), card: Math.round(card.top), top: Math.round(top) };
      });
      const step = await progress(page).textContent();
      expect(clear, `${step}`).toMatchObject({ above: true, below: true });
      const next = card(page).getByRole('button', { name: /^(Next|Finish)$/ });
      await action(page, 'Do it for me').click();
      if ((await next.textContent()) === 'Finish') break;
      await next.click();
    }
  });
}

test('on a phone the card shows two lines; a tap on the text, or on +, shows it whole, and another folds it', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await open(page, 'Bass');
  const words = card(page).locator('.tutorial-words');
  const height = () => words.evaluate((w) => Math.round(w.getBoundingClientRect().height));
  const folded = await height();
  const lineHeight = await words.evaluate((w) => Number.parseFloat(getComputedStyle(w).lineHeight));
  expect(folded).toBeLessThanOrEqual(Math.ceil(2 * lineHeight) + 1);
  await words.click();
  await expect.poll(height).toBeGreaterThan(folded);
  const more = card(page).getByRole('button', { name: 'Show the whole text' });
  await expect(more).toHaveAttribute('aria-expanded', 'true');
  await words.click();
  await expect.poll(height).toBe(folded);
  await more.click();
  await expect.poll(height).toBeGreaterThan(folded);
});

test('the header’s Tutorial button lists the Tutorials, ticks the finished, and starts the one picked (issue 59)', async ({ page }) => {
  await page.goto('/');
  const button = page.getByRole('button', { name: 'Tutorial', exact: true });
  await button.click();
  const list = page.getByRole('group', { name: 'Tutorials' }).filter({ has: page.getByRole('button', { name: /^Tutorial: Bass/ }) }).last();
  await expect(list.getByRole('button')).toHaveText(['Bass', 'Acid', 'Pluck', 'Wobble']);
  await page.keyboard.press('Escape');
  await expect(list).toBeHidden();
  await expect(button).toBeFocused();
  await button.click();
  await page.getByRole('button', { name: 'Tutorial: Acid', exact: true }).last().click();
  await expect(card(page)).toHaveAccessibleName('Tutorial: Acid');
  await expect(button).toHaveAttribute('aria-expanded', 'false');
});

test.describe('a first visit', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('the welcome offers the Tutorial, which opens Bass', async ({ page }) => {
    await page.goto('/');
    const about = page.getByRole('dialog', { name: 'Limpide' });
    await about.getByRole('button', { name: 'Follow the Tutorial' }).click();
    await expect(about).toBeHidden();
    await expect(card(page)).toHaveAccessibleName('Tutorial: Bass');
  });
});

test('a drag that passes through the target on its way past does not count: the control must rest within reach', async ({ page }) => {
  await open(page, 'Bass');
  await action(page, 'Start').click();
  const fader = page.getByRole('slider', { name: 'Osc 2', exact: true });
  await expect(fader).toBeVisible();
  await fader.focus();
  // Through 50 % to 80 % in quick presses: never at rest within reach.
  for (let i = 0; i < 40; i++) await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(800);
  await expect(card(page).getByText('Louder, not different')).toBeHidden();
  await expect(action(page, 'Next')).toBeDisabled();
});

test('a knob already within reach when its Step comes waits for a touch, then counts and snaps (issue 59)', async ({ page }) => {
  await open(page, 'Bass');
  await action(page, 'Start').click();
  // Step 4's Ideal is on at first, so that Step makes itself and its "Do it for me" goes: `makeStep` waits either way.
  for (let i = 0; i < 9; i++) await makeStep(page);
  // The Filter Decay: Init's 250 ms is within reach of 180 ms, and stays as it is until the learner moves it.
  await expect(progress(page)).toHaveText('Step 10 of 15');
  const decay = ringed(page).getByRole('slider');
  await expect(decay).toHaveAttribute('aria-valuetext', '250 ms');
  await page.waitForTimeout(800);
  await expect(decay).toHaveAttribute('aria-valuetext', '250 ms');
  await expect(action(page, 'Next')).toBeDisabled();
  await decay.focus();
  await page.keyboard.press('ArrowDown');
  await expect(card(page).getByText('That fall is the thump')).toBeVisible();
  await expect(decay).toHaveAttribute('aria-valuetext', '180 ms');
});

test('a Snapshot Step rings the Display button, then Snapshot, and counts a new Snapshot (issue 59)', async ({ page }) => {
  await open(page, 'Acid');
  await action(page, 'Start').click();
  await action(page, 'Do it for me').click();
  await action(page, 'Next').click();
  await expect(progress(page)).toHaveText('Step 2 of 15');
  await expect(ringed(page)).toHaveAttribute('aria-label', 'Display');
  await page.getByRole('button', { name: 'Display' }).click();
  const snapshot = page.getByRole('button', { name: 'Snapshot', exact: true });
  await expect(ringed(page)).toHaveAttribute('data-learn', 'action:snapshot');
  await expect(ringed(page)).not.toHaveAttribute('data-tutorial-target');
  await snapshot.click();
  await expect(snapshot).toHaveAttribute('aria-pressed', 'true');
  await expect(card(page)).toContainText('a faint trace of this bright saw');
});

for (const [width, text, small, cardWidth] of [[1920, '15px', '14px', 720], [1024, '13px', '12px', 640]] as const) {
  test(`at ${width} px the Tutorial card's text is ${text} and the card ${cardWidth} px wide (issue 59)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await open(page, 'Bass');
    await expect(card(page).locator('.tutorial-words')).toHaveCSS('font-size', text);
    await expect(progress(page)).toHaveCSS('font-size', small);
    expect((await card(page).boundingBox())!.width).toBe(cardWidth);
  });
}
