import { expect, type Page, test } from '@playwright/test';
import { type AuditOptions, auditPage } from './audit';
import { withFakeController } from './fakeMidi';

// Issue 136: the page's tempo follows a MIDI keyboard's or DAW's clock when one sends it, as a plugin follows its host.

const bpm = (page: Page) => page.getByRole('spinbutton', { name: 'Tempo' });

type ClockWindow = { playMidi(bytes: number[], at?: number): void; clockBpm: number; clockTimer?: number };

/**
 * The stand-in Controller sends a clock at `bpm`, 24 ticks a beat, until stopped: each tick stamped exactly when it is
 * due, sent in small batches, as a DAW's arrive with their time stamps whatever the page is busy with.
 */
const startClock = (page: Page, tempo: number) =>
  page.evaluate((tempo) => {
    const w = window as unknown as ClockWindow;
    w.clockBpm = tempo;
    if (w.clockTimer) return;
    let next = performance.now();
    w.clockTimer = window.setInterval(() => {
      while (next <= performance.now()) {
        w.playMidi([0xf8], next);
        next += 60000 / w.clockBpm / 24;
      }
    }, 20);
  }, tempo);
const stopClock = (page: Page) =>
  page.evaluate(() => {
    const w = window as unknown as ClockWindow;
    clearInterval(w.clockTimer);
    w.clockTimer = undefined;
  });

test('a MIDI clock sets the BPM, marked MIDI, which cannot be set by hand meanwhile; when it stops, its BPM stays and can be (issue 136)', async ({ page }) => {
  await withFakeController(page);
  await startClock(page, 126);
  await expect(bpm(page)).toHaveAttribute('aria-valuenow', '126');
  await expect(bpm(page)).toHaveText(/126\s*MIDI/);
  await expect(bpm(page)).toHaveAttribute('aria-valuetext', '126 BPM, from a MIDI clock');
  await expect(bpm(page)).toHaveAttribute('aria-disabled', 'true');
  await bpm(page).hover();
  await expect(page.getByRole('tooltip')).toContainText('Following a MIDI clock');
  await bpm(page).focus();
  await page.keyboard.press('ArrowUp');
  // Pressed though they say they cannot be (Playwright waits for a control to be usable otherwise).
  await bpm(page).dblclick({ force: true });
  await expect(page.getByRole('textbox', { name: 'Tempo in BPM' })).toHaveCount(0);
  const tap = page.getByRole('button', { name: 'Tap', exact: true });
  await expect(tap).toHaveAttribute('aria-disabled', 'true');
  for (let i = 0; i < 3; i++) await tap.click({ force: true });
  await expect(bpm(page)).toHaveAttribute('aria-valuenow', '126');
  // The clock changes tempo: followed within a few beats.
  await startClock(page, 90);
  await expect(bpm(page)).toHaveAttribute('aria-valuenow', '90');
  // It stops: a second later the BPM is the person's again, as the clock left it.
  await stopClock(page);
  await expect(bpm(page)).not.toHaveAttribute('aria-disabled', 'true');
  await expect(bpm(page)).toHaveText(/90\s*BPM/);
  await bpm(page).focus();
  await page.keyboard.press('ArrowUp');
  await expect(bpm(page)).toHaveAttribute('aria-valuenow', '91');
  await page.reload();
  await expect(bpm(page)).toHaveAttribute('aria-valuenow', '91');
});

test('while the Demo plays, a running clock does not change its tempo; after, the clock’s is back (issue 136)', async ({ page }) => {
  await withFakeController(page);
  await startClock(page, 100);
  await expect(bpm(page)).toHaveAttribute('aria-valuenow', '100');
  const demo = page.getByRole('button', { name: 'Demo', exact: true });
  await demo.click();
  await expect(bpm(page)).toHaveAttribute('aria-valuenow', '128');
  await startClock(page, 110);
  // Four beats of 110 BPM and more: the clock would have been followed by now.
  await page.waitForTimeout(2500);
  await expect(bpm(page)).toHaveAttribute('aria-valuenow', '128');
  await expect(bpm(page)).toHaveText(/128\s*BPM/);
  await demo.click();
  await expect(bpm(page)).toHaveAttribute('aria-valuenow', '110');
  await expect(bpm(page)).toHaveText(/110\s*MIDI/);
  await stopClock(page);
});

// The mark takes the unit's place, about as wide, and the box's edge turns green: nothing in the header overlaps or
// wraps while it shows, at the header's layouts (the BPM its number alone from 861 to 1279 px, a button opening a
// field on a phone), and the edge is seen at each.
for (const [width, height] of [[390, 844], [861, 900], [1100, 900], [1366, 900], [1920, 1080]]) {
  test(`the MIDI mark fits the header at ${width} px: nothing overlaps or wraps, the box’s edge marked (issue 136)`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await withFakeController(page);
    const box = width < 861 ? page.locator('header').getByRole('button', { name: 'Tempo' }) : bpm(page);
    const edge = () => box.evaluate((el) => getComputedStyle(el).borderTopColor);
    const unmarked = await edge();
    await startClock(page, 120);
    if (width < 861) await expect(box).toContainText('MIDI');
    else await expect(bpm(page)).toHaveAttribute('aria-valuetext', '120 BPM, from a MIDI clock');
    expect(await edge()).not.toBe(unmarked);
    // Not by the edge's colour alone (issue 189, WCAG 1.4.1): the word, or where it is hidden a MIDI socket.
    const marks = await box.locator('.tempo-unit[data-clock], .tool-word[data-clock], .tempo-clock').evaluateAll((all) =>
      all.filter((e) => e.checkVisibility()).map((e) => e.textContent || e.className),
    );
    expect(marks).toEqual([width >= 861 && width < 1280 ? 'tempo-clock' : 'MIDI']);
    const options: AuditOptions = { rules: ['overlap', 'wrap'], minTarget: 0, waivers: [] };
    const { unexpected } = await page.evaluate(auditPage, options);
    expect(unexpected.filter((f) => /header|tempo/.test(f.what))).toEqual([]);
    await stopClock(page);
  });
}

// The design audit's contrast rules on the mark: its word as text (4.5:1), its edge as what draws a control (3:1).
for (const theme of ['dark', 'light'] as const) {
  test(`the MIDI mark meets the design audit’s contrast in the ${theme} theme (issue 136)`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await withFakeController(page);
    await page.evaluate((t) => localStorage.setItem('limpide.theme', t), theme);
    await page.reload();
    await startClock(page, 120);
    await expect(bpm(page)).toHaveText(/120\s*MIDI/);
    const options: AuditOptions = { rules: ['text', 'boundary'], minTarget: 0, waivers: [] };
    const { unexpected } = await page.evaluate(auditPage, options);
    expect(unexpected.filter((f) => /tempo-bpm|tempo-unit/.test(f.what))).toEqual([]);
    await stopClock(page);
  });
}
