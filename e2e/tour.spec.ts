import { expect, type Page, test } from '@playwright/test';
import { FIRST_VISIT } from './startState';

// Issue 128: the Tour, a card for each Section while the synth turns its controls itself, on a Patch of its own.

const card = (page: Page) => page.getByRole('region', { name: 'Tour' });
const action = (page: Page, name: string) => card(page).getByRole('button', { name, exact: true });
const progress = (page: Page) => card(page).locator('.tutorial-progress');
const patchName = (page: Page) => page.getByRole('button', { name: /^Patch: / });
const about = (page: Page) => page.getByRole('dialog', { name: 'Limpide' });
const slider = (page: Page, name: string) => page.getByRole('slider', { name, exact: true });
const waveform = (page: Page) => page.getByRole('radiogroup', { name: 'Osc 1 Waveform' }).locator('[aria-checked="true"]');

async function startFromAbout(page: Page) {
  await page.getByRole('button', { name: 'About' }).click();
  await about(page).getByRole('button', { name: 'Take the Tour' }).click();
  await expect(card(page)).toBeVisible();
}

/** What a control shows, read again and again over `ms`: more than one value means it moved by itself. */
async function valuesOver(read: () => Promise<string | null>, ms: number) {
  const seen = new Set<string | null>();
  const end = Date.now() + ms;
  while (Date.now() < end) {
    seen.add(await read());
    await new Promise((r) => setTimeout(r, 100));
  }
  return seen;
}

/** The Notes the synth plays: lit on the piano. */
const playing = (page: Page) => expect(page.getByRole('group', { name: 'Piano' }).locator('[aria-pressed="true"]').first()).toBeVisible({ timeout: 8000 });

/**
 * Where an element stands: "clear" between the header (and the phone's strip) and the card, as a Tutorial's control
 * must (tutorial.spec.ts).
 */
const standing = (page: Page, name: string) =>
  page.evaluate((name) => {
    const element = document.querySelector(`[aria-label="${name}"]`);
    if (!element) return 'none';
    const box = element.getBoundingClientRect();
    const card = document.querySelector('.docked')!.getBoundingClientRect();
    const header = document.querySelector('header')!.getBoundingClientRect();
    const strip = document.querySelector('.section-strip')?.getBoundingClientRect();
    const top = Math.max(header.bottom, strip?.height ? strip.bottom : 0);
    return box.bottom <= card.top + 1 && box.top >= top - 1 ? 'clear' : `hidden: ${Math.round(box.top)} to ${Math.round(box.bottom)} between ${Math.round(top)} and ${Math.round(card.top)}`;
  }, name);

test.describe('a first visit', () => {
  test.use({ storageState: FIRST_VISIT });

  test('the welcome offers the Demo and the Tour, no Tutorial; the Tour starts on Init and takes the focus (issue 128)', async ({ page }) => {
    await page.goto('/');
    await expect(about(page).locator('.about-actions').getByRole('button')).toHaveText(['Play the Demo', 'Take the Tour', 'Close']);
    await about(page).getByRole('button', { name: 'Take the Tour' }).click();
    await expect(about(page)).toBeHidden();
    await expect(card(page)).toBeVisible();
    await expect(patchName(page)).toHaveAttribute('aria-label', 'Patch: Init');
    await expect(action(page, 'Next')).toBeFocused(); // not the Demo button behind it
  });
});

test('About offers the Tour every time; the Patches panel lists no Tour (issue 128)', async ({ page }) => {
  await page.goto('/');
  await patchName(page).click();
  await expect(page.getByRole('dialog', { name: 'Patches' })).not.toContainText(/\bTour\b/);
  await page.keyboard.press('Escape');
  await startFromAbout(page);
  await expect(progress(page)).toHaveText('1 of 4');
});

test('the Tour stops the Demo and the Song when it starts (issue 128)', async ({ page }) => {
  await page.goto('/');
  for (const name of ['Demo', 'Song']) {
    const button = page.getByRole('button', { name, exact: true });
    await button.click();
    await expect(button, name).toHaveAttribute('aria-pressed', 'true');
    await startFromAbout(page);
    await expect(button, name).toHaveAttribute('aria-pressed', 'false');
    await card(page).getByRole('button', { name: 'Close the Tour' }).click();
  }
});

test('each card turns its control by itself and plays the phrase; Next and Back move between them (issue 128)', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('/');
  await startFromAbout(page);

  await expect(card(page)).toContainText('The sound starts here');
  await playing(page);
  expect((await valuesOver(() => waveform(page).getAttribute('aria-label'), 5500)).size).toBeGreaterThan(1);

  await action(page, 'Next').click();
  await expect(progress(page)).toHaveText('2 of 4');
  await expect(card(page)).toContainText('The Filter takes what the Oscillators make');
  expect((await valuesOver(() => slider(page, 'Cutoff').getAttribute('aria-valuetext'), 1500)).size).toBeGreaterThan(2);
  await expect(waveform(page)).toHaveAttribute('aria-label', 'Saw'); // each card starts on the Tour's own Patch

  await action(page, 'Next').click();
  await expect(card(page)).toContainText('The Amp takes the Filter’s sound');
  await expect(slider(page, 'Cutoff')).toHaveAttribute('aria-valuetext', '2.00 kHz');
  expect((await valuesOver(() => slider(page, 'Amp Attack').getAttribute('aria-valuetext'), 1500)).size).toBeGreaterThan(2);

  await action(page, 'Next').click();
  await expect(card(page)).toContainText('The LFOs send no sound down the chain');
  expect((await valuesOver(() => slider(page, 'LFO 1 Depth').getAttribute('aria-valuetext'), 1500)).size).toBeGreaterThan(2);
  await playing(page);
  await expect(action(page, 'Next')).toBeHidden();

  await action(page, 'Back').click();
  await expect(progress(page)).toHaveText('3 of 4');
});

test('grabbing the control being turned takes it over: it stops moving for that card (issue 128)', async ({ page }) => {
  await page.goto('/');
  await startFromAbout(page);
  await action(page, 'Next').click();
  const cutoff = slider(page, 'Cutoff');
  await cutoff.focus();
  await page.keyboard.press('ArrowDown');
  const held = await cutoff.getAttribute('aria-valuetext');
  expect([...(await valuesOver(() => cutoff.getAttribute('aria-valuetext'), 1500))]).toEqual([held]);
  await expect(cutoff).toBeFocused(); // the card never takes the focus from it
});

test('Next, Back and Close work from the keyboard (issue 128)', async ({ page }) => {
  await page.goto('/');
  await startFromAbout(page);
  await expect(action(page, 'Next')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(progress(page)).toHaveText('2 of 4');
  await expect(action(page, 'Next')).toBeFocused();
  await action(page, 'Back').focus(); // Safari tabs to buttons only when its settings ask it to
  await page.keyboard.press('Enter');
  await expect(progress(page)).toHaveText('1 of 4');
  await expect(action(page, 'Next')).toBeFocused(); // Back went with the second card: the way forward has the focus
  await card(page).getByRole('button', { name: 'Close the Tour' }).focus();
  await page.keyboard.press('Enter');
  await expect(card(page)).toBeHidden();
});

for (const at of [1, 2, 3, 4]) {
  test(`closed at card ${at}, the Tour gives back the Patch the person had, value for value (issue 128)`, async ({ page }) => {
    await page.goto('/');
    await patchName(page).click();
    await page.getByRole('dialog', { name: 'Patches' }).getByRole('button', { name: 'Acid', exact: true }).first().click();
    await page.keyboard.press('Escape');
    await slider(page, 'Resonance').focus();
    await page.keyboard.press('ArrowUp');
    await expect(patchName(page)).toHaveAttribute('data-changed');
    const saved = () => page.evaluate(() => localStorage.getItem('limpide.current'));
    await expect.poll(saved).toContain('"resonance":0.82'); // the turn itself saved, not only Acid
    const mine = await saved();
    expect(mine).not.toBeNull();
    await expect.poll(saved).toBe(mine); // the autosave has settled

    await startFromAbout(page);
    await expect(patchName(page)).toHaveAttribute('aria-label', 'Patch: Init');
    for (let i = 1; i < at; i++) await action(page, 'Next').click();
    await page.waitForTimeout(500); // the synth turning its controls
    await card(page).getByRole('button', { name: at === 4 ? 'Done' : 'Close the Tour' }).click();
    await expect(card(page)).toBeHidden();
    await expect(patchName(page)).toHaveAttribute('aria-label', 'Patch: Acid');
    await expect(patchName(page)).toHaveAttribute('data-changed');
    expect(await saved()).toBe(mine);
    await page.waitForTimeout(500); // nothing turns it after
    expect(await saved()).toBe(mine);
  });
}

test('the last card’s Bass button starts the Bass Tutorial (issue 128)', async ({ page }) => {
  await page.goto('/');
  await startFromAbout(page);
  for (let i = 1; i < 4; i++) await action(page, 'Next').click();
  await action(page, 'Build a Bass').click();
  await expect(card(page)).toBeHidden();
  await expect(page.getByRole('region', { name: 'Tutorial: Bass' })).toBeVisible();
  await expect(patchName(page)).toHaveAttribute('aria-label', 'Patch: Init');
});

test('a card that grows while shown still leaves its Viewer clear (issue 128)', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  await startFromAbout(page);
  for (let i = 1; i < 4; i++) await action(page, 'Next').click();
  await expect.poll(() => standing(page, 'Envelope Timeline')).toBe('clear');
  // As GitHub's Linux fonts did: the card 30 px taller after the page has been scrolled for it.
  await card(page).evaluate((el) => (el.style.paddingBottom = `${parseFloat(getComputedStyle(el).paddingBottom) + 30}px`));
  await expect.poll(() => standing(page, 'Envelope Timeline')).toBe('clear');
});

for (const [layout, width, height] of [['phone', 375, 812], ['short phone', 393, 659], ['2 × 2', 690, 830], ['laptop', 1280, 800], ['large screen', 1920, 1080]] as const) {
  test(`on a ${layout}, each card brings its Viewers into view, clear of the header and the card (issue 128)`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await startFromAbout(page);
    const viewers = [['Oscillator Scope', 'Oscillator Spectrum'], ['Filter Scope', 'Filter Spectrum'], ['Amp Scope', 'Amp Spectrum'], ['Envelope Timeline']];
    for (const [i, names] of viewers.entries()) {
      for (const viewer of names) await expect.poll(() => standing(page, viewer), viewer).toBe('clear');
      if (i < viewers.length - 1) await action(page, 'Next').click();
    }
  });
}
