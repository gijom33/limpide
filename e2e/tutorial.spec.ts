import { expect, type Page, test } from '@playwright/test';

// Issue 57: a Tutorial rebuilds a Preset from Init, the person turning each control.

const card = (page: Page) => page.getByRole('region', { name: /^Tutorial: / });
const action = (page: Page, name: string) => card(page).getByRole('button', { name, exact: true });
const progress = (page: Page) => card(page).locator('.card-progress');
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
  await doIt(page);
  await card(page).getByRole('button', { name: /^(Next|Finish)$/ }).click();
}

/** The Step on the card made with "Do it for me", as `makeStep` does, staying on it. */
async function doIt(page: Page) {
  const next = card(page).getByRole('button', { name: /^(Next|Finish)$/ });
  const doIt = action(page, 'Do it for me');
  await expect(async () => {
    if (await doIt.isVisible()) await doIt.click({ timeout: 2000 });
    await expect(next).toBeEnabled({ timeout: 2000 });
  }).toPass({ timeout: 30000 });
}

/** Every Step made with "Do it for me", to the last card. */
async function doEverything(page: Page) {
  while (await card(page).getByRole('button', { name: /^(Next|Finish)$/ }).isVisible()) await makeStep(page);
}

test('a Tutorial from the Patches panel: Init loaded, the control ringed with its target, turned by hand, then its note', async ({ page }) => {
  await open(page, 'Bass');
  await expect(patchName(page)).toHaveAttribute('aria-label', 'Patch: Init');
  // Its own first words, not the Preset's description (issue 129, decision 6).
  await expect(card(page)).toContainText('A bass line, built one stage at a time.');
  await expect(card(page)).not.toContainText('A saw with a square an octave below');
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
    return top(e.querySelector('.card-progress')!) - top(e.querySelector('.card-name')!);
  });
  const before = await wordsTop();
  await fader.focus();
  const note = card(page).getByText('Louder, not different');
  // Up to 47 %, within reach: once it rests there a moment, the Step counts and the fader snaps to the target.
  // Five Pages 50 %, three presses down 47 % (outside the Synth Geek Layer a Mixer fader steps by the %, issue 201).
  for (let i = 0; i < 5; i++) await page.keyboard.press('PageUp');
  for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowDown');
  await expect(fader).toHaveAttribute('aria-valuetext', '47 %');
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
  await expect(card(page)).toContainText('Next comes Acid: a talking bass'); // the end card points on (issue 129)
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

// Issue 158 (profile 16's review of 1.19.0): with Ideal on, as it is at first, Bass Step 4 was ticked before the
// person did anything, so Display and the Ideal stayed a mystery.
test('a Display Step whose option is on already turns it off, and counts only once the person turns it on (issue 158)', async ({ page }) => {
  await open(page, 'Bass');
  await action(page, 'Start').click();
  for (let i = 0; i < 3; i++) await makeStep(page);
  await expect(progress(page)).toHaveText('Step 4 of 15');
  await page.waitForTimeout(800); // longer than a Step takes to count
  await expect(action(page, 'Next')).toBeDisabled();
  await expect(action(page, 'Do it for me')).toBeVisible();
  await expect(card(page)).not.toContainText('Circles mark');
  await page.getByRole('button', { name: 'Display' }).click();
  const ideal = page.getByRole('button', { name: 'Ideal' });
  await expect(ideal).toHaveAttribute('aria-pressed', 'false');
  await ideal.click();
  await expect(card(page)).toContainText('Circles mark where Osc 1’s saw puts its Harmonics');
  await expect(action(page, 'Next')).toBeEnabled();
});

test('left at a Display Step it turned off, by Quit or a reload, the Tutorial gives the option back (issue 158)', async ({ page }) => {
  const ideal = page.getByRole('button', { name: 'Ideal' });
  const toStep4 = async () => {
    await action(page, 'Start').click();
    for (let i = 0; i < 3; i++) await makeStep(page);
    await expect(progress(page)).toHaveText('Step 4 of 15');
    await page.getByRole('button', { name: 'Display' }).click();
    await expect(ideal).toHaveAttribute('aria-pressed', 'false');
    await page.keyboard.press('Escape');
  };
  await open(page, 'Bass');
  await toStep4();
  await card(page).getByRole('button', { name: 'Quit the tutorial' }).click();
  await page.getByRole('button', { name: 'Display' }).click();
  await expect(ideal).toHaveAttribute('aria-pressed', 'true');

  await page.reload();
  await patchName(page).click();
  await page.getByRole('dialog', { name: 'Patches' }).getByRole('group', { name: 'Tutorials' }).getByRole('button', { name: /^Tutorial: Bass/ }).click();
  await toStep4();
  await page.reload();
  await page.getByRole('button', { name: 'Display' }).click();
  await expect(ideal).toHaveAttribute('aria-pressed', 'true');
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

test('Wobble’s Sync Step passes when Sync is switched on by hand, then the Rate turns its note value onto 1/4 T (issue 137)', async ({ page }) => {
  await open(page, 'Wobble');
  await expect(progress(page)).toHaveText('14 steps');
  await action(page, 'Start').click();
  for (let i = 0; i < 8; i++) await makeStep(page); // to LFO 1's Rate at 3 Hz
  await expect(progress(page)).toHaveText('Step 9 of 14');
  await expect(ringed(page)).toHaveAttribute('data-learn', 'choice:lfoSync');
  await expect(ringed(page)).toHaveAttribute('data-tutorial-target', '→ On');
  await expect(action(page, 'Next')).toBeDisabled();
  const lfo = page.getByRole('group', { name: 'LFO 1', exact: true });
  await lfo.getByRole('button', { name: 'LFO 1 Sync' }).click();
  await expect(card(page)).toContainText('one wobble on every beat');
  await action(page, 'Next').click();

  await expect(ringed(page)).toHaveAttribute('data-learn', 'param:lfoRate'); // the Rate's knob, which turns the note value
  await expect(ringed(page)).toHaveAttribute('data-tutorial-target', '→ 1/4 T');
  const rate = lfo.getByRole('slider', { name: 'LFO 1 Rate' });
  await expect(rate).toHaveAttribute('aria-valuetext', '1/4, 2.00 Hz');
  await rate.focus();
  await page.keyboard.press('ArrowUp'); // 1/8 D, the next note value: within 5 % of the travel, but not the one asked
  await expect(rate).toHaveAttribute('aria-valuetext', /^1\/8 D/);
  await page.waitForTimeout(600); // a time: longer than a Step takes to count
  await expect(action(page, 'Next')).toBeDisabled();
  await page.keyboard.press('ArrowUp');
  await expect(rate).toHaveAttribute('aria-valuetext', '1/4 T, 3.00 Hz');
  await expect(card(page)).toContainText('three a second again');
  await expect(action(page, 'Next')).toBeEnabled();

  // Listen plays at the Tutorial's 120 BPM, which the synced wobble follows, whatever the page's tempo was.
  const bpm = page.getByRole('spinbutton', { name: 'Tempo' });
  await bpm.focus();
  for (let i = 0; i < 2; i++) await page.keyboard.press('PageDown');
  await expect(bpm).toHaveAttribute('aria-valuenow', '100');
  const listen = action(page, 'Listen');
  await listen.click();
  await expect(bpm).toHaveAttribute('aria-valuenow', '120');
  await listen.click();
  await expect(bpm).toHaveAttribute('aria-valuenow', '100');
  await doEverything(page);
  await expect(card(page)).toContainText('This is the Wobble Preset, built by you.');
});

test('Wobble’s 3 Hz Step, with Sync switched on early, switches it off so the Rate knob turns the Hz (issue 193)', async ({ page }) => {
  await open(page, 'Wobble');
  await action(page, 'Start').click();
  for (let i = 0; i < 6; i++) await makeStep(page); // to LFO 1's Depth
  const lfo = page.getByRole('group', { name: 'LFO 1', exact: true });
  const sync = lfo.getByRole('button', { name: 'LFO 1 Sync' });
  await sync.click();
  await expect(sync).toHaveAttribute('aria-pressed', 'true');
  await makeStep(page);
  await expect(ringed(page)).toHaveAttribute('data-tutorial-target', '→ 3.00 Hz');
  await expect(sync).toHaveAttribute('aria-pressed', 'false');
  const rate = lfo.getByRole('slider', { name: 'LFO 1 Rate' });
  await expect(rate).toHaveAttribute('aria-valuetext', '2.00 Hz');
  await rate.focus();
  await page.keyboard.press('ArrowUp');
  await expect(rate).toHaveAttribute('aria-valuetext', /^[\d.]+ Hz$/); // the Hz, not a note value
});

// Issue 190 (review 16, finding 1): the end card named the next Tutorial with no way there, and on a phone that line was
// folded away.
for (const [layout, width, height] of [['laptop', 1440, 900], ['phone', 393, 659]] as const) {
  test(`on a ${layout}, an end card's "Next: …" starts the next Tutorial; the last has only Done (issue 190)`, async ({ page }) => {
    // Two Tutorials, 14 Steps, each made by "Do it for me" and left by Next: about 2.3 s a Step on a page as slow as
    // GitHub's Linux WebKit, past the usual 30 s (issue 224).
    test.slow();
    await page.setViewportSize({ width, height });
    await open(page, 'FM Ladder'); // six Steps
    await action(page, 'Start').click();
    await doEverything(page);
    await expect(progress(page)).toHaveText('Done');
    const next = action(page, 'Next: Ring Bell');
    await expect(next).toBeInViewport({ ratio: 1 });
    await expect(next).toHaveClass(/tool-primary/);
    await expect(next).toBeFocused(); // the way forward, as Start and Next are
    await expect(action(page, 'Done')).toBeVisible();
    await next.click();
    await expect(card(page)).toHaveAccessibleName('Tutorial: Ring Bell');
    await expect(progress(page)).toHaveText('11 steps');
    await expect(patchName(page)).toHaveAttribute('aria-label', 'Patch: Init');
    await expect(action(page, 'Start')).toBeFocused();

    await open(page, 'Deep Breath');
    await action(page, 'Start').click();
    await doEverything(page);
    await expect(card(page)).toContainText('That was the last Tutorial.');
    await expect(card(page).getByRole('button', { name: /^Next/ })).toHaveCount(0);
    await expect(action(page, 'Done')).toBeFocused();
  });
}

// Issue 190 (review 16, finding 4): Next before the Step was made only dimmed, with no word why.
test('Next before a Step is made says what to do, the first time only (issue 190)', async ({ page }) => {
  await open(page, 'Bass');
  await action(page, 'Start').click();
  const hint = card(page).getByText('Turn the ringed control first, or press Do it for me.');
  await expect(hint).toHaveCount(0);
  // Said unavailable, it still takes a press (Playwright waits on aria-disabled: forced).
  await action(page, 'Next').click({ force: true });
  await expect(hint).toBeVisible();
  await expect(progress(page)).toHaveText('Step 1 of 15');
  await doIt(page);
  await expect(hint).toHaveCount(0);
  await action(page, 'Next').click();
  await expect(progress(page)).toHaveText('Step 2 of 15');
  await action(page, 'Next').click({ force: true });
  await page.waitForTimeout(300); // a time: a second hint would show by now
  await expect(hint).toHaveCount(0); // once is enough
  await expect(progress(page)).toHaveText('Step 2 of 15');
});

// Issue 190, decision 3: from Acid on, the Filter Envelope's four faders in one Step.
test('Acid’s Envelope Step rings its four faders, each with its target, and counts once all four are there (issue 190)', async ({ page }) => {
  await open(page, 'Acid');
  await action(page, 'Start').click();
  for (let i = 0; i < 5; i++) await makeStep(page);
  await expect(progress(page)).toHaveText('Step 6 of 12');
  await expect(ringed(page)).toHaveCount(4);
  const fader = (id: string) => page.locator(`[data-learn="param:${id}"]`);
  // Four side by side, without the arrow, each clear of the next (measured at 375, 393, 690 and 1440 px).
  for (const [id, target] of [['filterAttack', '1.00 ms'], ['filterDecay', '150 ms'], ['filterSustain', '5 %'], ['filterRelease', '100 ms']]) {
    await expect(fader(id)).toHaveAttribute('data-tutorial-target', target);
  }
  await action(page, 'Do it for me').click();
  await expect(card(page)).toContainText('a single, snappy “yow”');
  await expect(ringed(page)).toHaveCount(4);
  await expect(fader('filterSustain').getByRole('slider')).toHaveAttribute('aria-valuetext', '5 %');
});

test('the Demo ends a Tutorial (it loads its own Presets)', async ({ page }) => {
  await open(page, 'Wobble');
  await page.getByRole('button', { name: 'Demo' }).click();
  await expect(card(page)).toBeHidden();
});

/**
 * Where an element stands: "clear" between the header (and the phone's strip) and the card, or for one in the header,
 * on screen; "hidden" otherwise; "none" without one.
 */
const standing = (page: Page, selector: string) =>
  page.evaluate((selector) => {
    const element = document.querySelector(selector);
    if (!element) return 'none';
    const box = element.getBoundingClientRect();
    if (element.closest('header')) return box.top >= 0 && box.bottom <= innerHeight ? 'clear' : 'hidden';
    const card = document.querySelector('.tutorial')!.getBoundingClientRect();
    const header = document.querySelector('header')!.getBoundingClientRect();
    const strip = document.querySelector('.section-strip')?.getBoundingClientRect();
    const top = Math.max(header.bottom, strip?.height ? strip.bottom : 0);
    return box.bottom <= card.top && box.top >= top ? 'clear' : `hidden: ${Math.round(box.top)} to ${Math.round(box.bottom)} between ${Math.round(top)} and ${Math.round(card.top)}`;
  }, selector);

// Issue 105 (the 1.16.0 review): on a 393 × 659 phone the Bass Tutorial's Ideal Step spoke of circles and squares on the
// Oscillator Spectrum, under the card, its note cut short with "…".
for (const [layout, width, height] of [['phone', 375, 812], ['short phone', 393, 659], ['2 × 2', 690, 830]] as const) {
  for (const preset of ['Sub Ladder', 'Bass', 'Acid', 'Pluck', 'Wobble', 'PWM Bass', 'FM Ladder', 'Ring Bell', 'Deep Breath']) {
    test(`on a ${layout}, each Step of ${preset} brings its control, then the Viewer its note names, clear of the header and the card`, async ({ page }) => {
      test.setTimeout(90000); // up to nineteen Steps (PWM Bass), each made and checked twice
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.setViewportSize({ width, height });
      await open(page, preset);
      await action(page, 'Start').click();
      const next = card(page).getByRole('button', { name: /^(Next|Finish)$/ });
      for (;;) {
        const step = await progress(page).textContent();
        await expect.poll(() => standing(page, '[data-tutorial]:not(.section-strip button)'), `${step}: its control`).toMatch(/^(clear|none)$/);
        await doIt(page);
        await expect.poll(() => standing(page, '[data-tutorial-viewer]'), `${step}: its Viewer`).toMatch(/^(clear|none)$/);
        // Its note, which says what to hear and see, whole.
        const words = card(page).locator('.card-words');
        expect(await words.evaluate((w) => w.scrollHeight <= w.clientHeight + 1), `${step}: its note whole`).toBe(true);
        if ((await next.textContent()) === 'Finish') break;
        await next.click();
      }
      // "Do it for me" to the end gives the Preset (issue 109).
      await next.click();
      await expect(card(page)).toContainText(`This is the ${preset} Preset, built by you.`);
      await expect(patchName(page)).toHaveAttribute('aria-label', `Patch: ${preset}`);
    });
  }
}

test('on a phone the card shows two lines; a tap on the text, or on +, shows it whole, and another folds it', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await open(page, 'Bass');
  const words = card(page).locator('.card-words');
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

// Issue 260 (review 16, finding 2): on a phone the row of buttons wrapped Next alone to the left of a second row while
// the Step was not made, then took it to the first row's end once "Do it for me" went: a thumb that learnt where it was
// met empty space. It keeps one place, the row's right end, before and after.
for (const [width, height] of [[390, 844], [375, 812], [320, 568]] as const) {
  test(`at ${width} × ${height} Next keeps one place before and after each Step is made (issue 260)`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await open(page, 'Bass');
    await action(page, 'Start').click();
    const next = action(page, 'Next');
    const place = async () => {
      const box = (await next.boundingBox())!;
      return { x: Math.round(box.x), y: Math.round(box.y) };
    };
    for (let i = 1; i <= 3; i++) {
      await expect(progress(page)).toHaveText(`Step ${i} of 15`);
      await expect(action(page, 'Do it for me')).toBeVisible();
      const before = await place();
      await doIt(page);
      await expect(action(page, 'Do it for me')).toBeHidden();
      expect(await place(), `Step ${i}`).toEqual(before);
      await next.click();
    }
  });
}

test('the header’s Tutorial button lists the Tutorials, ticks the finished, and starts the one picked (issue 59)', async ({ page }) => {
  await page.goto('/');
  const button = page.getByRole('button', { name: 'Tutorial', exact: true });
  await button.click();
  const list = page.getByRole('group', { name: 'Tutorials' }).filter({ has: page.getByRole('button', { name: /^Tutorial: Bass/ }) }).last();
  await expect(list.locator('.tutorial-menu-name')).toHaveText(['Sub Ladder', 'Bass', 'Acid', 'Pluck', 'Wobble', 'PWM Bass', 'FM Ladder', 'Ring Bell', 'Deep Breath']);
  // Each with a short line of what it teaches (issue 129, decision 8).
  await expect(list.getByRole('button', { name: 'Tutorial: Wobble' })).toContainText('an LFO, a slow hand that turns a knob for you');
  await page.keyboard.press('Escape');
  await expect(list).toBeHidden();
  await expect(button).toBeFocused();
  await button.click();
  await page.getByRole('button', { name: 'Tutorial: Acid', exact: true }).last().click();
  await expect(card(page)).toHaveAccessibleName('Tutorial: Acid');
  await expect(button).toHaveAttribute('aria-expanded', 'false');
});

// Issue 188 (review 3, finding 5): a long line of what a Tutorial teaches squashed its mortarboard (9.7 px for Acid, 14
// for Bass), so the names started 4.3 px apart. Each icon keeps its size, and the names one start.
for (const width of [375, 1440]) {
  test(`at ${width} px the Tutorial list's icons are one size and its names start on one line (issue 188)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Tutorial', exact: true }).click();
    const panel = page.getByRole('group', { name: 'Tutorials' }).last();
    const icons = await panel.locator('button > svg').evaluateAll((all) => all.map((i) => Math.round(i.getBoundingClientRect().width * 10) / 10));
    const starts = await panel.locator('.tutorial-menu-name').evaluateAll((all) => all.map((n) => Math.round(n.getBoundingClientRect().left * 10) / 10));
    expect(icons).toHaveLength(9);
    expect(new Set(icons).size, icons.join(', ')).toBe(1);
    expect(new Set(starts).size, starts.join(', ')).toBe(1);
  });
}

// Issue 129: with a line of what each teaches the list is wider; it opens along whichever edge of its button keeps it
// on the page (at 861 px the button sits near the right edge).
for (const width of [375, 860, 861, 1440]) {
  test(`the Tutorial list stays on the page at ${width} px (issue 129)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Tutorial', exact: true }).click();
    const panel = page.getByRole('group', { name: 'Tutorials' }).last();
    await expect(panel).toBeVisible();
    const box = (await panel.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  });
}

test('picking a Tutorial puts the focus on its card, and its Next keeps it there, Step after Step (issue 104)', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Tutorial', exact: true }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Tutorial: Bass', exact: true }).last().focus();
  await page.keyboard.press('Enter');
  await expect(action(page, 'Start')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(progress(page)).toHaveText('Step 1 of 15');
  const next = action(page, 'Next');
  await expect(next).toBeFocused();
  await expect(next).toBeDisabled(); // until the Step is made
  await page.keyboard.press('Enter');
  await expect(progress(page)).toHaveText('Step 1 of 15');
  await page.keyboard.press('Shift+Tab'); // Do it for me, before the way forward
  await expect(action(page, 'Do it for me')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(next).toBeEnabled();
  await expect(next).toBeFocused(); // the button pressed has gone: the way forward has the focus
  await page.keyboard.press('Enter');
  await expect(progress(page)).toHaveText('Step 2 of 15');
  await expect(next).toBeFocused();
  // Back to the first card, whose Back goes: the focus moves to Start.
  await action(page, 'Back').focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await expect(progress(page)).toHaveText('15 steps');
  await expect(action(page, 'Start')).toBeFocused();

  // From the Patches panel too.
  await page.getByRole('button', { name: /^Patch: / }).click();
  await page.getByRole('dialog', { name: 'Patches' }).getByRole('group', { name: 'Tutorials' }).getByRole('button', { name: /^Tutorial: Acid/ }).click();
  await expect(card(page)).toHaveAccessibleName('Tutorial: Acid');
  await expect(action(page, 'Start')).toBeFocused();
});

test('at 1440 × 900 with the Tutorial card docked, every Tab stop comes clear of the card (issue 104)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, 'Bass');
  await page.locator('header button').first().focus(); // from the top of the page
  let stops = 0;
  for (;; await page.keyboard.press('Tab')) {
    const stop = await page.evaluate(async () => {
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const el = document.activeElement as HTMLElement;
      if (el.closest('.docked')) return null;
      const box = el.getBoundingClientRect();
      const on = document.elementFromPoint(box.left + box.width / 2, Math.min(box.bottom - 1, box.top + box.height / 2));
      return { name: el.getAttribute('aria-label') ?? el.textContent, hidden: !!on?.closest('.docked') };
    });
    if (!stop) break;
    stops++;
    expect(stop.hidden, `${stop.name}, under the card`).toBe(false);
  }
  expect(stops).toBeGreaterThan(50);
});

// A Step counted only once its control rests within reach: the Shows' unit tests' (issue 250); the first test here checks
// that the page counts a Step turned by hand.

test('a knob already within reach when its Step comes waits for a touch, then counts and snaps (issue 59)', async ({ page }) => {
  await open(page, 'Bass');
  await action(page, 'Start').click();
  for (let i = 0; i < 9; i++) await makeStep(page);
  // The Filter Decay: Init's 250 ms is within reach of 180 ms, and stays as it is until the learner moves it.
  await expect(progress(page)).toHaveText('Step 10 of 15');
  const decay = ringed(page).getByRole('slider');
  await expect(decay).toHaveAttribute('aria-valuetext', '250 ms');
  await page.waitForTimeout(800); // a time: longer than a Step takes to count
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
  await expect(progress(page)).toHaveText('Step 2 of 12');
  await expect(ringed(page)).toHaveAttribute('aria-label', 'Display');
  await page.getByRole('button', { name: 'Display' }).click();
  const snapshot = page.getByRole('button', { name: 'Snapshot', exact: true });
  await expect(ringed(page)).toHaveAttribute('data-learn', 'action:snapshot');
  await expect(ringed(page)).not.toHaveAttribute('data-tutorial-target');
  await snapshot.click();
  await expect(snapshot).toHaveAttribute('aria-pressed', 'true');
  await expect(card(page)).toContainText('a faint trace of this bright saw');
});

// Issue 260 (review 16, finding 3): on a phone the Display panel covers the page, so a Display Step made by hand left
// it over the circles or the trace its note speaks of, until Next. Made, the Step closes it, and its Viewer is in view.
for (const [preset, before, option, note] of [
  ['Sub Ladder', 3, 'Ideal', 'A circle sits on each Harmonic'],
  ['Bass', 3, 'Ideal', 'Circles mark where'],
  ['Acid', 1, 'Snapshot', 'a faint trace'],
] as const) {
  test(`on a phone, ${option} turned on by hand in ${preset} closes Display, the Step's Viewer in view (issue 260)`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page, preset);
    await action(page, 'Start').click();
    for (let i = 0; i < before; i++) await makeStep(page);
    const display = page.getByRole('button', { name: 'Display', exact: true });
    await display.click();
    await expect(display).toHaveAttribute('aria-expanded', 'true');
    await page.getByRole('button', { name: option, exact: true }).click();
    await expect(card(page)).toContainText(note);
    await expect(display).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByRole('region', { name: 'Viewer controls' })).toHaveCount(0);
    // Its Viewer between the header and the card, and nothing over it.
    await expect.poll(() => standing(page, '[data-tutorial-viewer]')).toBe('clear');
    const viewer = page.locator('[data-tutorial-viewer]');
    expect(await viewer.evaluate((v) => {
      const box = v.getBoundingClientRect();
      return v.contains(document.elementFromPoint((box.left + box.right) / 2, (box.top + box.bottom) / 2));
    })).toBe(true);
    await expect(action(page, 'Next')).toBeEnabled();
  });
}

test('on a laptop, a Display Step made by hand leaves the panel open beside the Viewers (issue 260)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, 'Acid');
  await action(page, 'Start').click();
  await makeStep(page);
  const display = page.getByRole('button', { name: 'Display', exact: true });
  await display.click();
  await page.getByRole('button', { name: 'Snapshot', exact: true }).click();
  await expect(card(page)).toContainText('a faint trace');
  await expect(display).toHaveAttribute('aria-expanded', 'true');
});

// Issue 158 (profile 16's review of 1.19.0): Acid's Snapshot stayed on the Viewers through Pluck, Wobble and FM Ladder.
test.describe('a Snapshot a Tutorial took (issue 158)', () => {
  const snapshotShown = async (page: Page) => {
    await page.getByRole('button', { name: 'Display' }).click();
    const pressed = await page.getByRole('button', { name: 'Snapshot', exact: true }).getAttribute('aria-pressed');
    await page.keyboard.press('Escape');
    return pressed;
  };
  const toAcidSnapshot = async (page: Page) => {
    await action(page, 'Start').click();
    await makeStep(page);
    await doIt(page);
    await expect(card(page)).toContainText('a faint trace of this bright saw');
  };
  const pick = async (page: Page, preset: string) => {
    await page.getByRole('button', { name: 'Tutorial', exact: true }).click();
    await page.getByRole('button', { name: `Tutorial: ${preset}`, exact: true }).last().click();
    await expect(card(page)).toHaveAccessibleName(`Tutorial: ${preset}`);
  };

  test('goes when the Tutorial is left, or another is picked', async ({ page }) => {
    await open(page, 'Acid');
    await toAcidSnapshot(page);
    await card(page).getByRole('button', { name: 'Quit the tutorial' }).click();
    expect(await snapshotShown(page)).toBe('false');

    await pick(page, 'Acid');
    await toAcidSnapshot(page);
    await pick(page, 'Pluck');
    expect(await snapshotShown(page)).toBe('false');
  });

  test('one the person took themselves stays, even after clearing the Tutorial’s', async ({ page }) => {
    await open(page, 'Acid');
    await toAcidSnapshot(page);
    // Cleared, then one of their own: numbered as the Tutorial's was, it is still theirs.
    await page.getByRole('button', { name: 'Display' }).click();
    await page.getByRole('button', { name: 'Clear Snapshot' }).click();
    await page.getByRole('button', { name: 'Snapshot', exact: true }).click();
    await page.keyboard.press('Escape');
    await card(page).getByRole('button', { name: 'Quit the tutorial' }).click();
    expect(await snapshotShown(page)).toBe('true');

    await page.goto('/');
    await page.getByRole('button', { name: 'Display' }).click();
    await page.getByRole('button', { name: 'Snapshot', exact: true }).click();
    await page.keyboard.press('Escape');
    await pick(page, 'Bass');
    await card(page).getByRole('button', { name: 'Quit the tutorial' }).click();
    expect(await snapshotShown(page)).toBe('true');
  });
});

for (const [width, text, small, cardWidth] of [[1920, '15px', '14px', 720], [1024, '13px', '12px', 640]] as const) {
  test(`at ${width} px the Tutorial card's text is ${text} and the card ${cardWidth} px wide (issue 59)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await open(page, 'Bass');
    await expect(card(page).locator('.card-words')).toHaveCSS('font-size', text);
    await expect(progress(page)).toHaveCSS('font-size', small);
    expect((await card(page).boundingBox())!.width).toBe(cardWidth);
  });
}
