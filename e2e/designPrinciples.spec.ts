import { appendFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { auditPage, type Rule } from './audit';

/**
 * The design principles' measurable rules (docs/design-principles.md, issue 17), on every screen state a visitor
 * can reach without playing: the page with each Oscillator tab, and each panel open.
 *
 * Where look B departs from a rule on purpose, a waiver below says where and why, and sets a floor just under what
 * is measured today: anything new that breaks a rule fails the test, and so does a waived element that gets worse.
 * A waiver nothing needs any more fails the test too, so the list stays true.
 */
interface Waiver {
  rule: Rule;
  /** The elements it covers. */
  selector: string;
  /** The lowest accepted: a contrast ratio, or a target's shorter side in px. */
  floor: number;
  /** Only in this theme or at this size; both when left out. */
  theme?: 'dark' | 'light';
  size?: keyof typeof SIZES;
}
// Decided by the owner on 2026-10-25 (issue 27, issue 28): look B's quiet edges and compact controls stay; only the
// selectors' chosen option became brighter. Each waiver's comment gives what it measured that day.
const WAIVERS: Waiver[] = [
  // Edges: buttons, Patch items and fields are drawn by a faint border (--border), 1.1 to 1.3:1; a selector's chosen
  // option by its fill (--segment-on), 1.5:1 (light) to 2.1:1 (dark); a knob's groove and a fader's track
  // (--groove), 1.3:1. The text and the value arcs carry the control.
  { rule: 'boundary', selector: '.tool, .patch-item, .patch-save input', floor: 1.1 },
  { rule: 'boundary', selector: '.segmented button', floor: 1.45 },
  { rule: 'boundary', selector: '.knob-groove, .fader', floor: 1.2 },
  // Light theme: muted text on buttons and selectors (--muted), 4.1 to 4.4:1.
  { rule: 'text', selector: '.tool, .tool *, .segmented button, .section-strip button', floor: 4, theme: 'light' },
  // Light theme: the Oscillators green as text (its heading, its strip tab), 3.3 to 3.5:1.
  { rule: 'text', selector: ".block[data-stage='osc'] h2, .section-strip [data-section='Oscillators']", floor: 3.25, theme: 'light' },
  // The Space hint on Freeze, at 60 % opacity: 2.3 to 2.9:1.
  { rule: 'text', selector: '.tool kbd', floor: 2.25 },
  // Laptop targets: selector options 20 to 22 px on their short side. (The piano's keys were 20 and 12 px wide until
  // issue 44 gave them a finger's width: 44 and 26 px.)
  { rule: 'target', selector: '.segmented button', floor: 20, size: 'laptop' },
  // Foldable and wide targets (issues 38 and 43): the laptop's controls in the sections 2 × 2 or four across, so the
  // laptop's waiver.
  { rule: 'target', selector: '.segmented button', floor: 20, size: 'foldable' },
  { rule: 'target', selector: '.segmented button', floor: 20, size: 'wide' },
  // Phone targets: controls at the toolbar height (28 px), selector options (20 to 22 px), the logo (24 px tall),
  // the Preset arrows (18 px wide), the piano's black keys (24 px wide, beside the octave buttons).
  { rule: 'target', selector: '.tool, .tab-list [role=tab], .patch-item, .patch-save input', floor: 28, size: 'phone' },
  { rule: 'target', selector: '.segmented button', floor: 20, size: 'phone' },
  { rule: 'target', selector: '.wordmark-button', floor: 24, size: 'phone' },
  { rule: 'target', selector: '.patch-bar > .tool', floor: 18, size: 'phone' },
  { rule: 'target', selector: '.piano button', floor: 23.5, size: 'phone' },
];

const SIZES = {
  laptop: { width: 1440, height: 900, minTarget: 24 }, // WCAG 2.5.8
  phone: { width: 375, height: 812, minTarget: 44 }, // Apple's 44 pt, WCAG 2.5.5
  // A foldable opened flat (issue 38): the sections 2 × 2, with the laptop's controls, so the laptop's minimum.
  foldable: { width: 690, height: 830, minTarget: 24 },
  // A wide screen (issue 43): the four sections side by side, with the laptop's controls.
  wide: { width: 1920, height: 1080, minTarget: 24 },
} as const;

/** The states to audit, each opened from the page as loaded and closed again. */
const STATES: { name: string; open?(page: Page): Promise<void>; close?(page: Page): Promise<void> }[] = [
  { name: 'Osc 1 tab' },
  { name: 'Osc 2 tab', open: (page) => page.getByRole('tab', { name: 'Osc 2' }).click(), close: (page) => page.getByRole('tab', { name: 'Osc 1' }).click() },
  { name: 'Mixer tab', open: (page) => page.getByRole('tab', { name: 'Mixer' }).click(), close: (page) => page.getByRole('tab', { name: 'Osc 1' }).click() },
  { name: 'Patches panel', open: (page) => page.getByRole('button', { name: /^Patch:/ }).click(), close: (page) => page.getByRole('button', { name: /^Patch:/ }).click() },
  { name: 'Display panel', open: (page) => page.getByRole('button', { name: 'Display', exact: true }).click(), close: (page) => page.getByRole('button', { name: 'Display', exact: true }).click() },
  { name: 'MIDI panel', open: (page) => page.getByRole('button', { name: 'MIDI', exact: true }).click(), close: (page) => page.getByRole('button', { name: 'MIDI', exact: true }).click() },
  { name: 'About', open: (page) => page.getByRole('button', { name: 'About', exact: true }).click(), close: (page) => page.keyboard.press('Escape') },
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
  const waivers = WAIVERS.filter((w) => rules.includes(w.rule) && (w.theme ?? theme) === theme && (w.size ?? size) === size);
  const unexpected: string[] = [];
  const matched = new Set<string>();
  for (const state of STATES) {
    await state.open?.(page);
    const result = await page.evaluate(auditPage, { rules, minTarget, waivers: waivers.map(({ rule, selector, floor }) => ({ rule, selector, floor })) });
    for (const f of result.unexpected) unexpected.push(`${state.name}: ${f.rule} ${f.what} ${f.measured}`);
    // AUDIT_REPORT=<file> writes every finding no waiver covers, one JSON line each: handy while fixing.
    if (process.env.AUDIT_REPORT) appendFileSync(process.env.AUDIT_REPORT, result.unexpected.map((f) => JSON.stringify({ theme, size, state: state.name, ...f }) + '\n').join(''));
    for (const m of result.matched) matched.add(m);
    await state.close?.(page);
  }
  const unused = waivers.map((w) => `${w.rule} ${w.selector}`).filter((w) => !matched.has(w));
  return { unexpected: [...new Set(unexpected)], unused };
}

for (const theme of ['dark', 'light'] as const) {
  for (const size of ['laptop', 'phone', 'foldable', 'wide'] as const) {
    test(`contrast, ${theme} theme, ${size}: text 4.5:1, what draws a control 3:1`, async ({ page }) => {
      const { unexpected, unused } = await audit(page, size, theme, ['text', 'boundary']);
      expect(unexpected, 'failures no waiver covers (or below its floor)').toEqual([]);
      expect(unused, 'waivers nothing needs any more: take them off the list').toEqual([]);
    });
  }
}

for (const size of ['laptop', 'phone', 'foldable', 'wide'] as const) {
  test(`targets, ${size}: at least ${SIZES[size].minTarget} × ${SIZES[size].minTarget} px`, async ({ page }) => {
    const { unexpected, unused } = await audit(page, size, 'dark', ['target']);
    expect(unexpected, 'failures no waiver covers (or below its floor)').toEqual([]);
    expect(unused, 'waivers nothing needs any more: take them off the list').toEqual([]);
  });
}

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
        if (!el || el.getAttribute('role') !== 'slider') return el === document.body ? 'body' : null;
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
    const slider = page.getByRole('slider', { name, exact: true }).first();
    await slider.click();
    await expect(slider).toBeFocused();
    expect(await slider.evaluate((el) => getComputedStyle(el).outlineStyle), name).toBe('none');
  }
});
