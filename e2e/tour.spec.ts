import { expect, type Locator, type Page, test } from '@playwright/test';
import { cycleLength, TOUR } from '../src/tutorial/tour';
import { firstChange } from './helpers';
import { FIRST_VISIT } from './startState';

// Issue 128: the Tour, a card for each Section while the synth turns its controls itself, on a Patch of its own.

const card = (page: Page) => page.getByRole('region', { name: 'Tour' });
const action = (page: Page, name: string) => card(page).getByRole('button', { name, exact: true });
const progress = (page: Page) => card(page).locator('.card-progress');
const patchName = (page: Page) => page.getByRole('button', { name: /^Patch: / });
const about = (page: Page) => page.getByRole('dialog', { name: 'Limpide' });
const slider = (page: Page, name: string) => page.getByRole('slider', { name, exact: true });
const waveform = (page: Page) => page.getByRole('radiogroup', { name: 'Osc 1 Waveform' }).locator('[aria-checked="true"]');

async function startFromAbout(page: Page) {
  await page.getByRole('button', { name: 'About', exact: true }).click();
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
 * must (tutorial.spec.ts); or, where the card does not cover it side to side, beside the card, down to the window's
 * foot (issue 254).
 */
const standing = (page: Page, name: string) => standingOf(page.locator(`[aria-label="${name}"]`).first());
/** Where the element `locator` finds stands, as `standing` says. */
const standingOf = (locator: Locator) =>
  locator.evaluate((element) => {
    const box = element.getBoundingClientRect();
    const card = document.querySelector('.docked')!.getBoundingClientRect();
    const header = document.querySelector('header')!.getBoundingClientRect();
    const strip = document.querySelector('.section-strip')?.getBoundingClientRect();
    const top = Math.max(header.bottom, strip?.height ? strip.bottom : 0);
    const floor = box.left < card.right && box.right > card.left ? card.top : innerHeight;
    return box.bottom <= floor + 1 && box.top >= top - 1 ? 'clear' : `hidden: ${Math.round(box.top)} to ${Math.round(box.bottom)} between ${Math.round(top)} and ${Math.round(floor)}`;
  });

test.describe('a first visit', () => {
  test.use({ storageState: FIRST_VISIT });

  test('the welcome offers the Demo and the Tour, no Tutorial; the Tour starts on Init and takes the focus (issue 128)', async ({ page }) => {
    await page.goto('/');
    await expect(about(page).locator('.about-actions').getByRole('button')).toHaveText(['Play the Demo', 'Take the Tour']);
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
  await expect(progress(page)).toHaveText('1 of 6');
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

test('starting the Song ends the Tour, the person’s Patch given back, and the Song plays on it (issue 242)', async ({ page }) => {
  await page.goto('/');
  await patchName(page).click();
  await page.getByRole('dialog', { name: 'Patches' }).getByRole('button', { name: 'Acid', exact: true }).first().click();
  await page.keyboard.press('Escape');
  await startFromAbout(page);
  await expect(patchName(page)).toHaveAttribute('aria-label', 'Patch: Init');
  const song = page.getByRole('button', { name: 'Song', exact: true });
  await song.click();
  await expect(card(page)).toBeHidden();
  await expect(patchName(page)).toHaveAttribute('aria-label', 'Patch: Acid');
  await expect(song).toHaveAttribute('aria-pressed', 'true');
  await playing(page);
  // Nothing of the Tour comes back to stop it.
  expect(await firstChange(page, [[song, 'aria-pressed'], [patchName(page), 'aria-label']], 1000)).toBeNull();
});

test('each card turns its control by itself and plays the phrase; Next and Back move between them (issue 128)', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('/');
  await startFromAbout(page);

  await expect(card(page)).toContainText('The sound starts here');
  await playing(page);
  expect((await valuesOver(() => waveform(page).getAttribute('aria-label'), 5500)).size).toBeGreaterThan(1);

  await action(page, 'Next').click();
  await expect(progress(page)).toHaveText('2 of 6');
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
  await expect(progress(page)).toHaveText('4 of 6'); // what else there is to find comes after (issue 210)

  await action(page, 'Back').click();
  await expect(progress(page)).toHaveText('3 of 6');
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
  await expect(progress(page)).toHaveText('2 of 6');
  await expect(action(page, 'Next')).toBeFocused();
  await page.keyboard.press('Shift+Tab'); // Back, before the way forward
  await expect(action(page, 'Back')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(progress(page)).toHaveText('1 of 6');
  await expect(action(page, 'Next')).toBeFocused(); // Back went with the second card: the way forward has the focus
  await card(page).getByRole('button', { name: 'Close the Tour' }).focus();
  await page.keyboard.press('Enter');
  await expect(card(page)).toBeHidden();
});

// The first card, closed, and the last, done: the give-back itself is the Shows' unit tests' at any card (issue 250).
for (const at of [1, 6]) {
  test(`closed at card ${at}, the Tour gives back the Patch the person had, value for value (issue 128)`, async ({ page }) => {
    await page.goto('/');
    await patchName(page).click();
    await page.getByRole('dialog', { name: 'Patches' }).getByRole('button', { name: 'Acid', exact: true }).first().click();
    await page.keyboard.press('Escape');
    await slider(page, 'Resonance').focus();
    await page.keyboard.press('ArrowUp');
    await expect(patchName(page)).toHaveAttribute('data-changed');
    const saved = () => page.evaluate(() => localStorage.getItem('limpide.current'));
    await expect.poll(saved).toContain('"resonance":0.81'); // the turn itself saved, not only Acid
    const mine = await saved();
    expect(mine).not.toBeNull();
    await expect.poll(saved).toBe(mine); // the autosave has settled

    await startFromAbout(page);
    await expect(patchName(page)).toHaveAttribute('aria-label', 'Patch: Init');
    for (let i = 1; i < at; i++) await action(page, 'Next').click();
    await page.waitForTimeout(500); // the synth turning its controls
    await card(page).getByRole('button', { name: at === 6 ? 'Done' : 'Close the Tour' }).click();
    await expect(card(page)).toBeHidden();
    await expect(patchName(page)).toHaveAttribute('aria-label', 'Patch: Acid');
    await expect(patchName(page)).toHaveAttribute('data-changed');
    expect(await saved()).toBe(mine);
    await page.waitForTimeout(500); // nothing turns it after
    expect(await saved()).toBe(mine);
  });
}

test('the last card’s button starts the first Tutorial, Sub Ladder (issues 128, 233)', async ({ page }) => {
  await page.goto('/');
  await startFromAbout(page);
  for (let i = 1; i < 6; i++) await action(page, 'Next').click();
  await action(page, 'Build a Sub Ladder').click();
  await expect(card(page)).toBeHidden();
  await expect(page.getByRole('region', { name: 'Tutorial: Sub Ladder' })).toBeVisible();
  await expect(patchName(page)).toHaveAttribute('aria-label', 'Patch: Init');
});

test('the last card’s button puts the focus on the Tutorial’s Start (issues 104, 139)', async ({ page }) => {
  await page.goto('/');
  await startFromAbout(page);
  for (let i = 1; i < 6; i++) await action(page, 'Next').click();
  await action(page, 'Build a Sub Ladder').click();
  const tutorial = page.getByRole('region', { name: 'Tutorial: Sub Ladder' });
  await expect(tutorial.getByRole('button', { name: 'Start', exact: true })).toBeFocused();
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
    // The Amp card's Timeline with its Viewers (issue 130); on a phone, far below them, the Timeline alone.
    const amp = width < 600 ? ['Envelope Timeline'] : ['Envelope Timeline', 'Amp Scope', 'Amp Spectrum'];
    const viewers = [['Oscillator Scope', 'Oscillator Spectrum'], ['Filter Scope', 'Filter Spectrum'], amp, ['Envelope Timeline']];
    for (const [i, names] of viewers.entries()) {
      for (const viewer of names) await expect.poll(() => standing(page, viewer), viewer).toBe('clear');
      if (i < viewers.length - 1) await action(page, 'Next').click();
    }
  });
}

// Issue 130: the Amp card turns the four stages of the Amp Envelope, one per Note, and freezes the Viewers once each
// Note has faded, naming the stage on the frozen picture. The person's own Freeze makes Freeze theirs for that card.

/** Every Viewer frozen: the Display state the Space bar and Display's Freeze set. */
const frozen = (page: Page) => page.locator('main[data-frozen]');
/** What the card shows on its line under the words: on the frozen picture, the stage. */
const naming = (page: Page) => card(page).locator('.tour-frozen [data-shown]');

async function toAmpCard(page: Page) {
  await page.goto('/');
  await startFromAbout(page);
  await action(page, 'Next').click();
  await action(page, 'Next').click();
  await expect(card(page)).toContainText('The Amp takes the Filter’s sound');
}

/** Space for Freeze, as the person presses it: with the focus off the card's buttons, which Space would press. */
async function pressSpace(page: Page) {
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press('Space');
}

/** Whether every Viewer was ever frozen, read again and again over `ms`. */
async function everFrozen(page: Page, ms: number) {
  return [...(await valuesOver(async () => String(await frozen(page).count()), ms))].includes('1');
}

test('the Amp card changes the Attack before its Note, freezes the Viewers once it has faded and names it, then runs again (issue 130)', async ({ page }) => {
  test.setTimeout(60000);
  await toAmpCard(page);
  const attack = slider(page, 'Amp Attack');
  await expect(attack).toHaveAttribute('aria-valuetext', '600 ms', { timeout: 3000 }); // set before the Note
  await playing(page);
  await expect(frozen(page)).toHaveCount(0);
  await expect(frozen(page)).toHaveCount(1, { timeout: 5000 });
  await expect(naming(page)).toHaveText('Frozen Attack, the rise'); // the name first (issue 190)
  await expect(card(page).locator('[aria-live]').last()).toHaveText('Frozen: Attack, the rise'); // what a screen reader hears
  await expect(attack).toHaveAttribute('aria-valuetext', '600 ms'); // still the Note's, through the freeze
  await expect(frozen(page)).toHaveCount(0, { timeout: 4000 }); // about three seconds
  await expect(naming(page)).not.toContainText('Frozen');
  await expect(slider(page, 'Amp Decay')).toHaveAttribute('aria-valuetext', '1.00 s', { timeout: 3000 }); // the next stage
  await expect(attack).toHaveAttribute('aria-valuetext', '10.0 ms'); // the last given back
  await playing(page); // the sound plays on
  await expect(frozen(page)).toHaveCount(1, { timeout: 6000 });
  await expect(naming(page)).toHaveText('Frozen Decay, the fall to a steady level');
});

test('folded, the Amp card still says what the frozen picture shows to a screen reader (issue 130)', async ({ page }) => {
  test.setTimeout(30000);
  await toAmpCard(page);
  await card(page).getByRole('button', { name: 'Fold the card' }).click();
  await expect(frozen(page)).toHaveCount(1, { timeout: 8000 });
  const heard = card(page).locator('.tour-frozen [aria-live]');
  await expect(heard).toHaveText('Frozen: Attack, the rise');
  await expect(heard).toBeVisible(); // in the accessibility tree: a live region under display: none is never heard
});

// Issue 129: on a phone a card shows two lines until opened, and they say what to watch, whole, not where the Section sits.
test('on a phone, each card’s two lines say what to watch (issue 129)', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await startFromAbout(page);
  for (const look of ['Watch the wave change shape', 'Watch the lines on the Filter Spectrum sink', 'Watch the Envelope Timeline', 'Watch the dotted line on the Envelope Timeline']) {
    const shown = await card(page)
      .locator('.card-words')
      .evaluate((words) => {
        const first = words.querySelector('p')!;
        // The first line's whole height fits in what the folded words show: nothing of it is cut off.
        return { text: first.textContent, whole: first.getBoundingClientRect().height <= words.getBoundingClientRect().height + 1 };
      });
    expect(shown.text).toContain(look);
    expect(shown.whole, look).toBe(true);
    if (!look.includes('dotted')) await action(page, 'Next').click();
  }
});

test('the person’s own Freeze on the Amp card is theirs: the Tour freezes no more on that card (issue 130)', async ({ page }) => {
  test.setTimeout(60000);
  await toAmpCard(page);
  await expect(frozen(page)).toHaveCount(1, { timeout: 8000 }); // the Tour's
  await pressSpace(page);
  await expect(frozen(page)).toHaveCount(0); // Space unfreezes as always
  await expect(naming(page)).toHaveCount(0); // and the card no longer says the picture will freeze
  expect(await everFrozen(page, 9000)).toBe(false); // past the next Note's fade
  await pressSpace(page);
  await expect(frozen(page)).toHaveCount(1);
  await page.waitForTimeout(4000); // past where the Tour would let go of its own
  await expect(frozen(page)).toHaveCount(1);
});

// Next and Back letting go of the Tour's Freeze alone are the Shows' unit tests' (issue 250).
test('closing the Tour on the Amp card lets go of its Freeze (issue 130)', async ({ page }) => {
  test.setTimeout(60000);
  await toAmpCard(page);
  await expect(frozen(page)).toHaveCount(1, { timeout: 8000 });
  await card(page).getByRole('button', { name: 'Close the Tour' }).click();
  await expect(card(page)).toBeHidden();
  await expect(frozen(page)).toHaveCount(0);
});

// Issue 206: where a card's control and its Viewer do not fit on screen together, the page shows each in turn: the
// control as it starts to move, then the Viewer for what it shows. The person's own scroll stops it for that card.

/** A fader of the Amp, by its name. */
const fader = (page: Page, name: string) => slider(page, `Amp ${name}`);
const scrollTop = (page: Page) => page.evaluate(() => Math.round(scrollY));

test('on a phone, the Amp card shows each fader while it moves and the Timeline while it freezes (issue 206)', async ({ page }) => {
  test.setTimeout(60000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 375, height: 812 });
  await toAmpCard(page);
  await expect.poll(() => standingOf(fader(page, 'Attack')), { timeout: 2000 }).toBe('clear'); // as it turns
  await expect(frozen(page)).toHaveCount(1, { timeout: 6000 });
  expect(await standing(page, 'Envelope Timeline')).toBe('clear'); // through the freeze
  expect(await standingOf(fader(page, 'Attack'))).not.toBe('clear'); // they do not fit together here
  await expect(frozen(page)).toHaveCount(0, { timeout: 4000 });
  await expect.poll(() => standingOf(fader(page, 'Decay')), { timeout: 2000 }).toBe('clear'); // the next stage
  await expect(frozen(page)).toHaveCount(1, { timeout: 6000 });
  expect(await standing(page, 'Envelope Timeline')).toBe('clear');
});

test('the person’s own scroll stops the Tour’s scrolling for that card (issue 206)', async ({ page }) => {
  test.setTimeout(60000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 375, height: 812 });
  await toAmpCard(page);
  await expect.poll(() => standingOf(fader(page, 'Attack')), { timeout: 2000 }).toBe('clear');
  await page.mouse.move(187, 300);
  await page.mouse.wheel(0, 120);
  await expect.poll(() => scrollTop(page)).not.toBe(0);
  await page.waitForTimeout(300);
  const mine = await scrollTop(page);
  await expect(frozen(page)).toHaveCount(1, { timeout: 6000 }); // where the Tour would have gone to the Timeline
  expect(await scrollTop(page)).toBe(mine);
});

test('a wheel that turns a fader is no scroll: the Tour still shows the Timeline (issue 206)', async ({ page }) => {
  test.setTimeout(60000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 375, height: 812 });
  await toAmpCard(page);
  await expect.poll(() => standingOf(fader(page, 'Release')), { timeout: 2000 }).toBe('clear');
  await fader(page, 'Release').hover();
  await page.mouse.wheel(0, -120);
  await expect(frozen(page)).toHaveCount(1, { timeout: 6000 });
  await expect.poll(() => standing(page, 'Envelope Timeline')).toBe('clear');
});

// Issue 227: what takes a finger for itself (the piano, as Bead and a card's handle) is no scroll of the person's own.
test('a finger slid across the piano is no scroll: the Tour still shows the Timeline (issue 227)', async ({ page }) => {
  test.setTimeout(60000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 375, height: 812 });
  await toAmpCard(page);
  await expect.poll(() => standingOf(fader(page, 'Attack')), { timeout: 2000 }).toBe('clear');
  // The events a finger sends, where it lands and as it slides.
  await page.getByRole('group', { name: 'Piano' }).evaluate((element) => {
    element.dispatchEvent(new Event('touchstart', { bubbles: true }));
    for (let i = 0; i < 5; i++) element.dispatchEvent(new Event('touchmove', { bubbles: true }));
    element.dispatchEvent(new Event('touchend', { bubbles: true }));
  });
  await expect(frozen(page)).toHaveCount(1, { timeout: 6000 });
  await expect.poll(() => standing(page, 'Envelope Timeline')).toBe('clear');
});

test('the Tour’s page glides to what it shows, and jumps with reduced motion (issue 206)', async ({ page }) => {
  test.setTimeout(60000);
  await page.addInitScript(() => {
    const scrolls: unknown[] = [];
    (window as unknown as { scrolls: unknown[] }).scrolls = scrolls;
    const scrollTo = window.scrollTo.bind(window);
    window.scrollTo = ((...args: [ScrollToOptions]) => {
      scrolls.push(args[0]?.behavior);
      scrollTo(...args);
    }) as typeof window.scrollTo;
  });
  await page.setViewportSize({ width: 375, height: 812 });
  for (const reduced of [false, true]) {
    await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' });
    await toAmpCard(page);
    await page.evaluate(() => ((window as unknown as { scrolls: unknown[] }).scrolls.length = 0));
    await expect(frozen(page)).toHaveCount(1, { timeout: 8000 }); // past a fader, to the Timeline
    const made = await page.evaluate(() => (window as unknown as { scrolls: unknown[] }).scrolls);
    expect(made.length, `reduced: ${reduced}`).toBeGreaterThan(0);
    expect(new Set(made), `reduced: ${reduced}`).toEqual(new Set([reduced ? 'auto' : 'smooth']));
  }
});

test('from 2 × 2 up, where a card’s controls and Viewers all fit, the page holds still through the card (issue 206)', async ({ page }) => {
  test.setTimeout(60000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 860, height: 1100 });
  await toAmpCard(page);
  await expect.poll(() => standing(page, 'Envelope Timeline')).toBe('clear');
  const held = await scrollTop(page);
  expect([...(await valuesOver(() => scrollTop(page).then(String), 8000))]).toEqual([String(held)]); // a pass and more
  expect(await standingOf(fader(page, 'Attack'))).toBe('clear');
});

// Issue 210: after the Sections, the Tour tells of the Synth Geek Layer and its History, then the Tutorials, each card
// ringing the control where it is found; it switches nothing on, and plays nothing over its words.

/** Whether the element `locator` finds is on screen, above the card and uncovered: the header's rows back for it. */
const shownAbove = (locator: Locator) =>
  locator.evaluate((element) => {
    const box = element.getBoundingClientRect();
    const card = document.querySelector('.docked')!.getBoundingClientRect();
    const hit = document.elementFromPoint((box.left + box.right) / 2, (box.top + box.bottom) / 2);
    const clear = box.top >= -1 && box.bottom <= card.top + 1 && !!hit && element.contains(hit);
    return clear ? 'shown' : `hidden: ${Math.round(box.top)} to ${Math.round(box.bottom)} above ${Math.round(card.top)}, under ${hit?.tagName}`;
  });

const geekOn = (page: Page) => page.locator('main[data-geek]');

test('after the Sections, a card for the Synth Geek Layer and its History, then the Tutorials, each ringing where it is (issue 210)', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('/');
  await startFromAbout(page);
  for (let i = 1; i < 5; i++) await action(page, 'Next').click();
  await expect(progress(page)).toHaveText('5 of 6');
  await expect(card(page)).toContainText('Geek toggle');
  await expect(card(page)).toContainText('History');
  const display = page.getByRole('button', { name: 'Display', exact: true });
  await expect(display).toHaveAttribute('data-tutorial', '');
  // The person opens Display: the ring goes to the Geek toggle, still off.
  await display.click();
  const geek = page.getByRole('button', { name: 'Geek', exact: true });
  await expect(geek).toHaveAttribute('data-tutorial', '');
  await expect(geek).toHaveAttribute('aria-pressed', 'false');
  await display.click();
  await expect(display).toHaveAttribute('data-tutorial', '');
  // Nothing plays over its words.
  await expect(page.getByRole('group', { name: 'Piano' }).locator('[aria-pressed="true"]')).toHaveCount(0, { timeout: 8000 });

  await action(page, 'Next').click();
  await expect(progress(page)).toHaveText('6 of 6');
  await expect(card(page)).toContainText('rebuild one of the Presets yourself');
  await expect(page.getByRole('button', { name: 'Tutorial', exact: true })).toHaveAttribute('data-tutorial', '');
  await expect(page.locator('[data-tutorial]')).toHaveCount(1); // Display's ring gone with its card
  await expect(action(page, 'Next')).toBeHidden();
  await expect(action(page, 'Build a Sub Ladder')).toBeVisible();

  await action(page, 'Back').click();
  await expect(progress(page)).toHaveText('5 of 6');
  await action(page, 'Back').click();
  await expect(progress(page)).toHaveText('4 of 6');
  await playing(page); // the LFO card plays again
  await action(page, 'Next').click();
  await action(page, 'Next').click();
  await action(page, 'Done').click();
  await expect(card(page)).toBeHidden();
  await expect(geekOn(page)).toHaveCount(0); // off after the Tour, as before it
  await expect(page.locator('[data-tutorial]')).toHaveCount(0);
});

for (const [layout, width, height] of [['small phone', 320, 568], ['phone', 375, 812], ['laptop', 1280, 800]] as const) {
  test(`on a ${layout}, the last cards show the control each names, the header back for it (issue 210)`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await startFromAbout(page);
    for (let i = 1; i < 4; i++) await action(page, 'Next').click();
    await expect.poll(() => standing(page, 'Envelope Timeline')).toBe('clear'); // the page down at the LFO card's Viewer
    await action(page, 'Next').click();
    await expect.poll(() => shownAbove(page.getByRole('button', { name: 'Display', exact: true }))).toBe('shown');
    await action(page, 'Next').click();
    await expect.poll(() => shownAbove(page.getByRole('button', { name: 'Tutorial', exact: true }))).toBe('shown');
  });
}

// Issue 254: on every card, at every size, the control the Tour turns stays in view, clear of the card, the whole time
// it moves; on wide windows its Viewers with it, the card moving aside where it would cover them.

/**
 * What went out of view over `ms`, read in the page every tenth of a second: the ringed control (the one the synth
 * turns) and, on a wide window, the card's Viewers, each "clear" in the window, below the header and the phone's strip,
 * and not under the card, as `standing` says. A control out of view is missed only if it moved meanwhile: on a phone
 * the Amp's faders hold still while the Timeline has the page (issue 206). What is out of view is read again a moment
 * later, since the card's clock may have turned before the page followed.
 */
const missedOver = (page: Page, { viewers, ms, wide }: { viewers: string[]; ms: number; wide: boolean }) =>
  page.evaluate(
    async ({ viewers, ms, wide }) => {
      const where = (element: Element | null) => {
        if (!element) return 'missing';
        const card = document.querySelector('.docked')!.getBoundingClientRect();
        const header = document.querySelector('header')!.getBoundingClientRect();
        const strip = document.querySelector('.section-strip')?.getBoundingClientRect();
        const top = Math.max(header.bottom, strip?.height ? strip.bottom : 0);
        const box = element.getBoundingClientRect();
        const floor = box.left < card.right && box.right > card.left ? card.top : innerHeight;
        if (box.top >= top - 1 && box.bottom <= floor + 1) return 'clear';
        return `${Math.round(box.left)}–${Math.round(box.right)} × ${Math.round(box.top)}–${Math.round(box.bottom)}, card ${Math.round(card.left)}–${Math.round(card.right)} from ${Math.round(card.top)}`;
      };
      const look = () => {
        const control = document.querySelector('[data-learn][data-tutorial]');
        // What the control shows: a knob's or fader's value, the Waveform picked.
        const shows = control && [control, ...control.querySelectorAll('[aria-valuetext], [aria-checked="true"]')].map((e) => e.getAttribute('aria-valuetext') ?? e.getAttribute('aria-label'));
        const out = viewers.map((name) => [name, where(document.querySelector(`[aria-label="${name}"]`))]).filter(([, w]) => w !== 'clear');
        return { control: where(control), shows: JSON.stringify(shows), viewers: wide ? out : [] };
      };
      const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
      const missed: string[] = [];
      for (const start = performance.now(); performance.now() - start < ms; await wait(100)) {
        const now = look();
        if (now.control === 'clear' && now.viewers.length === 0) continue;
        await wait(150);
        const then = look();
        const at = Math.round(performance.now() - start);
        if (then.control !== 'clear' && (wide || then.shows !== now.shows)) missed.push(`at ${at} ms, the control: ${then.control}`);
        for (const [name, w] of then.viewers) missed.push(`at ${at} ms, ${name}: ${w}`);
      }
      return missed;
    },
    { viewers, ms, wide },
  );

for (const [layout, width, height] of [['three across', 1440, 900], ['four across', 1920, 1080], ['phone', 390, 844]] as const) {
  test(`in ${layout}, every card keeps the control it turns in view and clear of the card (issue 254)`, async ({ page }) => {
    test.setTimeout(150000);
    // A wide window shows the control and the card's Viewers at once, through every card.
    const wide = width > 600;
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await startFromAbout(page);
    for (const [i, section] of TOUR.entries()) {
      await expect(page.locator('[data-learn][data-tutorial]')).toHaveCount(1);
      // Each card's moves once through: the Amp's four stages, the Filter's Cutoff and Resonance.
      expect(await missedOver(page, { viewers: section.viewers, ms: cycleLength(section) * 1000, wide }), `card ${i + 1}, ${section.title}`).toEqual([]);
      await action(page, 'Next').click();
    }
    // The last two cards ring a button of the header, which they bring into view.
    await expect.poll(() => shownAbove(page.getByRole('button', { name: 'Display', exact: true }))).toBe('shown');
    await action(page, 'Next').click();
    await expect.poll(() => shownAbove(page.getByRole('button', { name: 'Tutorial', exact: true }))).toBe('shown');
  });
}
