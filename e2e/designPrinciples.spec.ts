import { appendFileSync } from 'node:fs';
import { expect, type Locator, type Page, test } from '@playwright/test';
import { type AuditOptions, auditPage, type Rule } from './audit';
import { openDisplay, sliderName, wholeDemoCard } from './helpers';

/**
 * The design principles' measurable rules (docs/design-principles.md, issue 17), on every screen state a visitor
 * can reach without playing: the page with each Oscillator tab, and each panel open.
 *
 * Where look B departs from a rule on purpose, a waiver below says where and why, and sets a floor just under what
 * is measured today: anything new that breaks a rule fails the test, and so does a waived element that gets worse.
 * A waiver nothing needs any more fails the test too, so the list stays true.
 */
type Size = keyof typeof SIZES;
/** The phone's waivers hold at every phone width, and narrower. */
const PHONES = ['phone', 'narrowest phone', 'narrower than a phone'] as const;

interface Waiver {
  rule: Rule;
  /** The elements it covers. */
  selector: string;
  /** The lowest accepted: a contrast ratio, or a target's shorter side in px. */
  floor: number;
  /** Only in this theme or at these sizes; both, or every size, when left out. */
  theme?: 'dark' | 'light';
  size?: Size | readonly Size[];
}
// Decided by the owner on 2026-10-25 (issue 27, issue 28): look B's quiet edges and compact controls stay; only the
// selectors' chosen option became brighter. Each waiver's comment gives what it measured that day.
const WAIVERS: Waiver[] = [
  // Edges: buttons, Patch items and fields are drawn by a faint border (--border), 1.1 to 1.3:1; a selector's chosen
  // option by its fill (--segment-on), 1.5:1 (light) to 2.1:1 (dark); a knob's groove and a fader's track
  // (--groove), 1.3:1. The text and the value arcs carry the control.
  { rule: 'boundary', selector: '.tool, .patch-item, .patch-save input, .patch-category, .patch-search input', floor: 1.1 },
  { rule: 'boundary', selector: '.segmented button', floor: 1.45 },
  { rule: 'boundary', selector: '.knob-groove, .fader', floor: 1.2 },
  // Light theme: the Oscillators heading in its green, 3.4:1. Headings are held to 3:1 at their size (issue 189,
  // decision 3: Claude's call, open to the owner); every other text meets 4.5:1 in the light theme too.
  { rule: 'text', selector: ".block[data-stage='osc'] h2", floor: 3.25, theme: 'light' },
  // The Space hint on Freeze, at 60 % opacity: 2.3 to 2.9:1.
  { rule: 'text', selector: '.tool kbd', floor: 2.25 },
  // Laptop targets: selector options 20 to 22 px on their short side. (The piano's keys were 20 and 12 px wide until
  // issue 44 gave them a finger's width: 44 and 26 px.)
  { rule: 'target', selector: '.segmented button', floor: 20, size: 'laptop' },
  // Foldable and wide targets (issues 38 and 43): the laptop's controls in the sections 2 × 2 or four across, so the
  // laptop's waiver.
  { rule: 'target', selector: '.segmented button', floor: 20, size: 'foldable' },
  { rule: 'target', selector: '.segmented button', floor: 20, size: 'wide' },
  // Phone targets, at 375 px and down to 320 (and narrower windows, laid out at 320): controls at the toolbar height
  // (28 px), selector options (20 to 22 px), the logo (24 px tall), the Preset arrows (18 px wide), the piano's black
  // keys (24 px wide at 375 px, beside the octave buttons; 20 px at 320, issue 157).
  { rule: 'target', selector: '.tool, .tab-list [role=tab], .patch-item, .patch-save input, .patch-category, .patch-search input', floor: 28, size: PHONES },
  { rule: 'target', selector: '.segmented button', floor: 20, size: PHONES },
  { rule: 'target', selector: '.wordmark-button', floor: 24, size: PHONES },
  { rule: 'target', selector: '.patch-bar > .tool', floor: 18, size: PHONES },
  { rule: 'target', selector: '.piano button', floor: 23.5, size: 'phone' },
  { rule: 'target', selector: '.piano button', floor: 19.5, size: ['narrowest phone', 'narrower than a phone'] },
  // Phone targets, the Demo card's segments (issue 99, decided by the owner): 44 px tall, but fifteen a finger wide
  // need 660 px, so each is as wide as its part is long, 8 to 18 px. The card's Previous part and Next part buttons,
  // 44 × 44 px beside them, are the full-size way along the parts (WCAG 2.5.5 and 2.5.8 accept a full-size control
  // that does the same).
  { rule: 'target', selector: '.demo-bar-parts > button', floor: 7.5, size: PHONES },
];

const SIZES = {
  laptop: { width: 1440, height: 900, minTarget: 24 }, // WCAG 2.5.8
  phone: { width: 375, height: 812, minTarget: 44 }, // Apple's 44 pt, WCAG 2.5.5
  // The narrowest the page lays out (issue 157): the first iPhone SE, small Androids zoomed. Narrower, it scrolls.
  'narrowest phone': { width: 320, height: 568, minTarget: 44 },
  // A window narrower still: the page keeps the 320 px layout, the cards and dialogs fit the window.
  'narrower than a phone': { width: 280, height: 568, minTarget: 44 },
  // A foldable opened flat (issue 38): the sections 2 × 2, with the laptop's controls, so the laptop's minimum.
  foldable: { width: 690, height: 830, minTarget: 24 },
  // A wide screen (issue 43): the four sections side by side, with the laptop's controls.
  wide: { width: 1920, height: 1080, minTarget: 24 },
} as const;

const SIZE_NAMES = Object.keys(SIZES) as Size[];

/** Presses a button by the keyboard: focused, then Enter. */
async function pressByKeyboard(page: Page, button: Locator) {
  await button.focus();
  await page.keyboard.press('Enter');
}

/** Turns Bead's switch in Display on or off, and closes Display, all by the keyboard. */
async function setBead(page: Page, to: 'on' | 'off') {
  // Display too: in WebKit at load 30, a click on it just after About closed opened nothing (issue 177).
  await pressByKeyboard(page, page.getByRole('button', { name: 'Display', exact: true }));
  await expect(page.getByRole('region', { name: 'Viewer controls' })).toBeVisible();
  // The arrows moving the switch's choice: narrower than a phone the switch is at the panel's foot, below the window,
  // where WebKit lost a click on it now and then.
  await page.getByRole('radio', { name: `Bead ${to === 'on' ? 'off' : 'on'}` }).focus();
  await page.keyboard.press(to === 'on' ? 'ArrowLeft' : 'ArrowRight');
  await expect(page.getByRole('radio', { name: `Bead ${to}` })).toHaveAttribute('aria-checked', 'true');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('region', { name: 'Viewer controls' })).toBeHidden();
}

/**
 * Opens About by the keyboard. Narrower than a phone About's button stands past the window's right edge (280 to 312
 * px in a 280 px window), and in WebKit a click on it now and then opened nothing (issue 177); focus and Enter open
 * it every time, as the arrows move Bead's switch above.
 */
async function openAbout(page: Page) {
  await pressByKeyboard(page, page.getByRole('button', { name: 'About', exact: true }));
  await expect(page.getByRole('dialog', { name: 'Limpide' })).toBeVisible();
}

/** The states to audit, each opened from the page as loaded and closed again. */
const STATES: { name: string; open?(page: Page): Promise<void>; close?(page: Page): Promise<void> }[] = [
  { name: 'Osc 1 tab' },
  { name: 'Osc 2 tab', open: (page) => page.getByRole('tab', { name: 'Osc 2' }).click(), close: (page) => page.getByRole('tab', { name: 'Osc 1' }).click() },
  { name: 'Mixer tab', open: (page) => page.getByRole('tab', { name: 'Mixer' }).click(), close: (page) => page.getByRole('tab', { name: 'Osc 1' }).click() },
  { name: 'Patches panel', open: (page) => page.getByRole('button', { name: /^Patch:/ }).click(), close: (page) => page.getByRole('button', { name: /^Patch:/ }).click() },
  // A Preset picked in the panel shows its description under the name, with its × (issue 153). Picked by the keyboard,
  // so the pointer stays on the Patch name: a click left it where the panel's Init was, over Osc 1's Square in Linux's
  // fonts at 690 px, and the audit measured Square's hover fill (the 1.20.0 release run).
  {
    name: 'Preset’s description',
    open: async (page) => {
      await page.getByRole('button', { name: /^Patch:/ }).click();
      await page.getByRole('dialog', { name: 'Patches' }).getByRole('button', { name: 'Init', exact: true }).press('Enter');
      await expect(page.locator('.patch-about')).toBeVisible();
      await page.evaluate(() => Promise.all(document.querySelector('.patch-about')?.getAnimations().map((a) => a.finished) ?? [])); // faded in
    },
    close: (page) => page.getByRole('button', { name: 'Close the Preset’s description' }).click(),
  },
  // A knob turned: the Patch in plain words, under the header or in the Patch name (issue 123). Init picked again, by
  // the keyboard as above, and its description closed, to leave the page as it was.
  {
    name: 'Patch’s plain words',
    open: async (page) => {
      await page.getByRole('region', { name: 'Filter' }).getByRole('slider', { name: 'Cutoff' }).press('ArrowDown');
      await expect(page.locator('.patch-words, .patch-name-words').locator('visible=true')).toBeVisible();
    },
    close: async (page) => {
      await page.getByRole('button', { name: /^Patch:/ }).click();
      await page.getByRole('dialog', { name: 'Patches' }).getByRole('button', { name: 'Init', exact: true }).press('Enter');
      await page.getByRole('button', { name: 'Close the Preset’s description' }).click();
      await expect(page.locator('.patch-words, .patch-name-words')).toHaveCount(0);
    },
  },
  { name: 'Display panel', open: (page) => page.getByRole('button', { name: 'Display', exact: true }).click(), close: (page) => page.getByRole('button', { name: 'Display', exact: true }).click() },
  {
    // Glow on (issues 180, 199), as All (issue 229): the Display panel with it chosen, every Scope and Spectrum drawing
    // its fading traces.
    name: 'Glow on',
    // Chosen by the keyboard and then left, as the panel is seen at rest: no segment hovered or focused.
    open: async (page) => {
      await page.getByRole('button', { name: 'Display', exact: true }).click();
      const glow = page.getByRole('radiogroup', { name: 'Glow' });
      await glow.getByRole('radio', { name: 'Off', exact: true }).focus();
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowRight');
      await expect(glow.getByRole('radio', { name: 'All', exact: true })).toHaveAttribute('aria-checked', 'true');
      await page.evaluate(() => (document.activeElement as HTMLElement).blur());
      await expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-glow', /^([2-9]|1[0-9])$/);
      await expect(page.getByLabel('Amp Spectrum', { exact: true })).toHaveAttribute('data-glow', /^([2-9]|1[0-9])$/);
      await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished)));
    },
    close: async (page) => {
      await page.getByRole('radiogroup', { name: 'Glow' }).getByRole('radio', { name: 'Off', exact: true }).click();
      await page.getByRole('button', { name: 'Display', exact: true }).click();
    },
  },
  { name: 'MIDI panel', open: (page) => page.getByRole('button', { name: 'MIDI', exact: true }).click(), close: (page) => page.getByRole('button', { name: 'MIDI', exact: true }).click() },
  { name: 'About', open: openAbout, close: (page) => page.keyboard.press('Escape') },
  // Bead right of About's name (issue 178), its card in place of the credits (issue 163): with its switch on, then off again.
  {
    name: 'Bead’s card in About',
    open: async (page) => {
      await setBead(page, 'on');
      await openAbout(page);
      await page.getByRole('button', { name: 'Bead, Limpide’s water drop: its tricks' }).click();
      await expect(page.getByRole('region', { name: 'Bead' })).toBeVisible();
    },
    close: async (page) => {
      // Each Escape once the last one's work shows, so the second finds no card left to put away and closes About.
      await page.keyboard.press('Escape');
      await expect(page.getByRole('region', { name: 'Bead' })).toBeHidden();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog', { name: 'Limpide' })).toBeHidden();
      await setBead(page, 'off');
    },
  },
  // Last, since the Demo loads its Presets (issue 99): small in the corner in three and four across (issue 230).
  {
    name: 'Demo card',
    open: async (page) => {
      await page.getByRole('button', { name: 'Demo', exact: true }).click();
      await expect(page.getByRole('region', { name: 'Demo', exact: true }).locator('.demo-bar-caption')).toBeVisible();
    },
    close: (page) => page.getByRole('region', { name: 'Demo', exact: true }).getByRole('button', { name: 'Stop', exact: true }).click(),
  },
  // In three and four across the card above opens small in the corner (issue 230); unfolded, the whole card there.
  {
    name: 'Demo card, unfolded',
    open: async (page) => {
      // By the keyboard: in WebKit at 320 px a click on Demo just after Stop now and then started nothing.
      await pressByKeyboard(page, page.getByRole('button', { name: 'Demo', exact: true }));
      await wholeDemoCard(page);
      await expect(page.getByRole('region', { name: 'Demo', exact: true }).locator('.demo-bar-caption')).toBeVisible();
    },
    close: (page) => page.getByRole('region', { name: 'Demo', exact: true }).getByRole('button', { name: 'Stop', exact: true }).click(),
  },
];

async function audit(page: Page, size: keyof typeof SIZES, theme: 'dark' | 'light', rules: Rule[]) {
  const { width, height, minTarget } = SIZES[size];
  await page.setViewportSize({ width, height });
  await page.addInitScript((t) => localStorage.setItem('limpide.theme', t), theme);
  await page.goto('/');
  await expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-db', /.+/);
  // The test browsers hold the sound back until the page is used, so the piano invites a first Note (issue 35): it
  // fades in 0.4 s after the page opens, and caught halfway (a busy machine) it fails. The audit is of the page at rest.
  await page.evaluate(() => Promise.all(document.querySelector('.play-invite')?.getAnimations().map((a) => a.finished) ?? []));
  const waivers = WAIVERS.filter((w) => rules.includes(w.rule) && (w.theme ?? theme) === theme && [w.size ?? size].flat().includes(size));
  const unexpected: string[] = [];
  const matched = new Set<string>();
  for (const state of STATES) {
    await state.open?.(page);
    const result = await page.evaluate(auditPage, { rules, minTarget, waivers: waivers.map(({ rule, selector, floor }) => ({ rule, selector, floor })) });
    for (const f of result.unexpected) unexpected.push(`${state.name}: ${f.rule} ${f.what} ${f.measured}`);
    // AUDIT_REPORT=<file> writes every finding no waiver covers, one JSON line each: handy while fixing.
    if (process.env.AUDIT_REPORT) appendFileSync(process.env.AUDIT_REPORT, result.unexpected.map((f) => `${JSON.stringify({ theme, size, state: state.name, ...f })}\n`).join(''));
    for (const m of result.matched) matched.add(m);
    await state.close?.(page);
  }
  const unused = waivers.map((w) => `${w.rule} ${w.selector}`).filter((w) => !matched.has(w));
  return { unexpected: [...new Set(unexpected)], unused };
}

for (const theme of ['dark', 'light'] as const) {
  for (const size of SIZE_NAMES) {
    test(`contrast, ${theme} theme, ${size}: text 4.5:1, what draws a control 3:1`, async ({ page }) => {
      const { unexpected, unused } = await audit(page, size, theme, ['text', 'boundary']);
      expect(unexpected, 'failures no waiver covers (or below its floor)').toEqual([]);
      expect(unused, 'waivers nothing needs any more: take them off the list').toEqual([]);
    });
  }
}

for (const size of SIZE_NAMES) {
  test(`targets, ${size}: at least ${SIZES[size].minTarget} × ${SIZES[size].minTarget} px, no two controls over each other, no label on two lines`, async ({ page }) => {
    const { unexpected, unused } = await audit(page, size, 'dark', ['target', 'overlap', 'wrap']);
    expect(unexpected, 'failures no waiver covers (or below its floor)').toEqual([]);
    expect(unused, 'waivers nothing needs any more: take them off the list').toEqual([]);
  });
}

// Issue 188 (decision 1): one rule for where a header panel opens, under the header, as Display's does. The MIDI panel
// and the Tutorial menu opened from the header's top row, over its bottom row and the last keys, from 861 px; a narrow
// screen's Tempo over the keyboard.
const HEADER_PANELS: { name: string; button: (page: Page) => Locator; panel: (page: Page) => Locator }[] = [
  { name: 'Patches', button: (page) => page.getByRole('button', { name: /^Patch:/ }), panel: (page) => page.getByRole('dialog', { name: 'Patches' }) },
  { name: 'Display', button: (page) => page.getByRole('button', { name: 'Display', exact: true }), panel: (page) => page.locator('.display-panel') },
  { name: 'MIDI', button: (page) => page.getByRole('button', { name: 'MIDI', exact: true }), panel: (page) => page.getByRole('dialog', { name: 'MIDI' }) },
  { name: 'Tutorial', button: (page) => page.getByRole('button', { name: 'Tutorial', exact: true }), panel: (page) => page.getByRole('group', { name: 'Tutorials' }) },
  { name: 'Tempo', button: (page) => page.locator('header').getByRole('button', { name: /^Tempo: / }), panel: (page) => page.getByRole('group', { name: 'Tempo' }) },
];
for (const size of SIZE_NAMES) {
  test(`header panels, ${size}: each opens under the header (issue 188)`, async ({ page }) => {
    const { width, height } = SIZES[size];
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await page.locator('.piano button').first().waitFor();
    const opened: string[] = [];
    for (const { name, button, panel } of HEADER_PANELS) {
      if (!(await button(page).isVisible())) continue; // the Tempo opens a panel up to 860 px only
      await button(page).click();
      await expect(panel(page)).toBeVisible();
      const [top, headerBottom] = await Promise.all([
        panel(page).evaluate((el) => el.getBoundingClientRect().top),
        page.locator('header').evaluate((el) => el.getBoundingClientRect().bottom),
      ]);
      expect(top, name).toBeGreaterThanOrEqual(headerBottom);
      expect(top - headerBottom, name).toBeLessThanOrEqual(8);
      opened.push(name);
      await page.keyboard.press('Escape');
      await expect(panel(page)).toBeHidden();
    }
    expect(opened.length).toBeGreaterThanOrEqual(4);
  });
}

// Issue 188 (decision 1), from the 1.23.0 code review: on an iPad, the Tempo opened in portrait, turned to landscape
// (the BPM and Tap Tempo in the header, no panel) and back, was feared to open under its button, over the keys, and Tab out
// of it no longer to close it. The turn closes it (the header draws the Tempo anew); opened again, it is under the
// header and Tab out closes it.
test('a narrow Tempo through a tablet’s turn and back: closed, then opened again under the header, and Tab out closes it (issue 188)', async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.goto('/');
  await page.locator('.piano button').first().waitFor();
  const panel = page.getByRole('group', { name: 'Tempo' });
  const open = page.locator('header').getByRole('button', { name: /^Tempo: / });
  await open.click();
  await expect(panel).toBeVisible();
  await page.setViewportSize({ width: 1180, height: 820 });
  await expect(page.locator('.tempo-panel')).toHaveCount(0);
  await page.setViewportSize({ width: 820, height: 1180 });
  await expect(open).toHaveAttribute('aria-expanded', 'false');
  await open.click();
  await expect(panel).toBeVisible();
  const [top, headerBottom] = await Promise.all([
    panel.evaluate((el) => el.getBoundingClientRect().top),
    page.locator('header').evaluate((el) => el.getBoundingClientRect().bottom),
  ]);
  expect(top).toBeGreaterThanOrEqual(headerBottom);
  expect(top - headerBottom).toBeLessThanOrEqual(8);
  await panel.getByRole('button', { name: 'Tap Tempo', exact: true }).focus();
  await page.keyboard.press('Tab');
  await expect(panel).toBeHidden();
});

// Issue 188 (decision 2): formulas never over data. The Synth Geek Layer's formulas lay over the Spectrums' corner,
// across the Harmonic bars and the Response Curve (at 375 px over A4's, the 2nd's and the 3rd's); each now has its own
// room under its Viewer, clear of every bar and trace drawn.
for (const size of SIZE_NAMES) {
  test(`Synth Geek formulas, ${size}: each clear of its Viewers' plots (issue 188)`, async ({ page }) => {
    const { width, height } = SIZES[size];
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await openDisplay(page);
    await page.getByRole('button', { name: 'Geek' }).click();
    await page.keyboard.press('Escape');
    for (const name of ['Oscillator', 'Filter']) {
      const formula = page.getByLabel(`${name} formula`);
      await expect(formula).toBeVisible();
      const crossed = await formula.evaluate((f) => {
        const a = f.getBoundingClientRect();
        return [...f.closest('.block')!.querySelectorAll('canvas')]
          .map((c) => c.getBoundingClientRect())
          .filter((b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom).length;
      });
      expect(crossed, name).toBe(0);
    }
    // The Viewers keep one size across the stages, a formula under them or not.
    const heights = await page.locator('.block .tap canvas').evaluateAll((all) => all.map((c) => Math.round(c.getBoundingClientRect().height)));
    expect(new Set(heights).size, heights.join(', ')).toBe(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(Math.max(width, 320));
  });
}

test('the overlap check fails on two controls over each other on the same layer, not on a panel over the page', async ({ page }) => {
  await page.setContent(`
    <main>
      <div class="row"><button class="one">One</button><button class="two" style="margin-left: -20px">Two</button></div>
      <div class="panel" style="position: absolute; top: 0; left: 0"><button class="over">Over</button></div>
    </main>`);
  const options: AuditOptions = { rules: ['overlap'], minTarget: 0, waivers: [] };
  const { unexpected } = await page.evaluate(auditPage, options);
  expect(unexpected.map((f) => f.what)).toEqual(['div.row > button.one "One"']);
});

test('the one-line check fails on a label or a key that runs to a second line, not on a sentence (issue 156)', async ({ page }) => {
  await page.setContent(`
    <main style="font: 14px sans-serif">
      <button class="fits">Cutoff</button>
      <button class="wraps" style="width: 40px">Filter Envelope</button>
      <span class="label" style="display: inline-block; width: 40px">Pulse Width</span>
      <span class="key" data-one-line style="display: flex; flex-wrap: wrap; width: 120px"><span>Pulse Width</span><span>Osc 2 Pitch</span></span>
      <span class="short-key" data-one-line style="display: flex; width: 300px"><span>PW</span><span>O2P</span></span>
      <p style="width: 60px">A sentence wraps as text does.</p>
      <div role="tooltip" style="width: 60px">A tip wraps too.</div>
    </main>`);
  const options: AuditOptions = { rules: ['wrap'], minTarget: 0, waivers: [] };
  const { unexpected } = await page.evaluate(auditPage, options);
  expect(unexpected.map((f) => f.what)).toEqual(['button.wraps "Filter Envelope"', 'span.label "Pulse Width"', 'span.key "Pulse WidthOsc 2 Pitch"']);
});

test('every knob and fader works from the keyboard, with a focus ring for the keyboard only', async ({ page }) => {
  test.setTimeout(120_000); // it tabs through the whole page three times, one key press at a time
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-db', /.+/);
  const sliders = page.getByRole('slider');
  for (const tab of ['Osc 1', 'Osc 2', 'Mixer']) {
    await page.getByRole('tab', { name: tab }).click();
    const visible = await sliders.evaluateAll((all) => all.filter((s) => s.checkVisibility({ visibilityProperty: true })).length);
    expect(visible, tab).toBeGreaterThan(10);
    // Tab through the whole page once: each slider reached shows a ring and moves with the arrow keys.
    await page.locator('body').evaluate((b) => (document.activeElement as HTMLElement | null)?.blur?.() ?? b);
    const reached = new Set<string>();
    const problems: string[] = [];
    for (let i = 0; i < 300; i++) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        if (el?.getAttribute('role') !== 'slider') return el === document.body ? 'body' : null;
        const all = [...document.querySelectorAll('[role="slider"]')];
        const s = getComputedStyle(el);
        return { id: `${all.indexOf(el)} ${el.getAttribute('aria-label')}`, ring: s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2 };
      });
      if (focused === 'body') break;
      if (!focused || reached.has(focused.id)) continue;
      reached.add(focused.id);
      if (!focused.ring) problems.push(`${focused.id}: no focus ring`);
      const now = () => page.evaluate(() => document.activeElement!.getAttribute('aria-valuenow'));
      const before = await now();
      await page.keyboard.press('ArrowUp');
      let after = await now();
      if (after === before) {
        await page.keyboard.press('ArrowDown'); // already at the top
        after = await now();
        await page.keyboard.press('ArrowUp');
      } else await page.keyboard.press('ArrowDown');
      if (after === before) problems.push(`${focused.id}: the arrow keys do not move it`);
    }
    expect(problems, tab).toEqual([]);
    expect(reached.size, `${tab}: every slider on screen is reached with Tab`).toBe(visible);
  }

  // A click on a knob or a fader focuses it for the keys, without the ring.
  for (const name of ['Cutoff', 'Attack']) {
    const slider = page.getByRole('slider', { name: sliderName(name) }).first();
    await slider.click();
    await expect(slider).toBeFocused();
    expect(await slider.evaluate((el) => getComputedStyle(el).outlineStyle), name).toBe('none');
  }
});
