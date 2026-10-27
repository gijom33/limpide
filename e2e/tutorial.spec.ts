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

/** Every Step made with "Do it for me", to the last card. */
async function doEverything(page: Page) {
  for (;;) {
    const next = card(page).getByRole('button', { name: /^(Next|Finish)$/ });
    if (!(await next.isVisible())) return;
    const doIt = action(page, 'Do it for me');
    if (await doIt.isVisible()) await doIt.click();
    await expect(next).toBeEnabled();
    await next.click();
  }
}

test('a Tutorial from the Patches panel: Init loaded, the control ringed with its target, turned by hand, then its note', async ({ page }) => {
  await open(page, 'Bass');
  await expect(patchName(page)).toHaveAttribute('aria-label', 'Patch: Init');
  await expect(card(page)).toContainText('A saw with a square an octave below');
  await expect(progress(page)).toHaveText('15 steps');
  await action(page, 'Start').click();
  await expect(progress(page)).toHaveText('Step 1 of 15');

  // Osc 2's level, on the Mixer tab: the tab is brought into view, the fader ringed with its target.
  const fader = page.getByRole('slider', { name: 'Osc 2' });
  await expect(fader).toBeVisible();
  await expect(ringed(page)).toHaveAttribute('data-learn', 'param:mixOsc2');
  await expect(ringed(page)).toHaveAttribute('data-tutorial-target', '→ 50 %');
  await expect(card(page).getByRole('button', { name: 'Next' })).toBeDisabled();

  // Turned by keys to near half: the Step is made, the fader snaps to the exact target, and the note shows.
  await fader.focus();
  const note = card(page).getByText('Louder, not different');
  // A press at a time, at a person's pace: the Step snaps the fader when it is reached, on the next render.
  for (let i = 0; i < 30 && !(await note.isVisible()); i++) {
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(60);
  }
  await expect(note).toBeVisible();
  await expect(fader).toHaveAttribute('aria-valuetext', '50 %'); // from 46 %, within reach
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
  await expect(card(page)).toContainText('The rings mark Osc 1’s saw alone');
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

test.describe('a first visit', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('the welcome offers the Tutorial, which opens Bass', async ({ page }) => {
    await page.goto('/');
    const about = page.getByRole('dialog', { name: 'Limpide' });
    await about.getByRole('button', { name: 'Tutorial' }).click();
    await expect(about).toBeHidden();
    await expect(card(page)).toHaveAccessibleName('Tutorial: Bass');
  });
});
