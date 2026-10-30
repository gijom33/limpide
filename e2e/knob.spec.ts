import { expect, test } from '@playwright/test';
import { sliderName } from './helpers';

test('dragging a knob changes its value without selecting any text', async ({ page }) => {
  await page.goto('/');
  const cutoff = page.getByRole('slider', { name: 'Cutoff' });
  const before = await cutoff.getAttribute('aria-valuetext');

  const box = (await cutoff.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  // Drag down and sideways across the labels and neighbouring knobs, as a real hand does.
  await page.mouse.move(box.x + 200, box.y + 120, { steps: 12 });
  await page.mouse.up();

  expect(await cutoff.getAttribute('aria-valuetext')).not.toBe(before);
  expect(await page.evaluate(() => window.getSelection()?.toString() ?? '')).toBe('');
});

test('a click on a knob’s arc, without a drag, sets the value there; a click on its cap only selects it', async ({ page }) => {
  await page.goto('/');
  const cutoff = page.getByRole('slider', { name: 'Cutoff' });
  const box = (await cutoff.boundingBox())!;
  const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const before = await cutoff.getAttribute('aria-valuenow');
  await page.mouse.click(centre.x, centre.y);
  expect(await cutoff.getAttribute('aria-valuenow')).toBe(before);

  // The arc's 3 o'clock point: 225° into the 270° sweep that starts at 7:30.
  await page.mouse.click(centre.x + box.width * 0.38, centre.y);
  expect(Number(await cutoff.getAttribute('aria-valuenow'))).toBeCloseTo(83, -1);
});

test('a click or a drag shows no focus ring; the keyboard does', async ({ page }) => {
  await page.goto('/');
  const resonance = page.getByRole('slider', { name: 'Resonance' });
  await resonance.click();
  await expect(resonance).toBeFocused();
  expect(await resonance.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('none');
  await page.keyboard.press('Tab');
  const next = page.locator(':focus');
  expect(await next.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('solid');
});

// Where every visible knob sits, rounded to the pixel.
const knobLayout = (page: import('@playwright/test').Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('.knob')]
      .filter((k) => k.checkVisibility())
      .map((k) => {
        const r = k.getBoundingClientRect();
        return `${k.querySelector('[role=slider]')?.getAttribute('aria-label')} ${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}`;
      }),
  );

test('turning knobs never moves or resizes any knob, whatever width their values take', async ({ page }) => {
  await page.goto('/');
  const before = await knobLayout(page);
  // Parameters whose readouts change width the most across their range (Hz → kHz, ms → s, Off → seconds, signs).
  for (const [region, name] of [
    ['Filter', 'Cutoff'],
    ['Filter', 'Amount'],
    ['Amp', 'Attack'],
    ['LFO 1', 'Rate'],
    ['Amp', 'Glide'],
  ]) {
    // A stage is a region; an LFO is a group within its section.
    const knob = page.getByRole(region.startsWith('LFO ') ? 'group' : 'region', { name: region, exact: true }).getByRole('slider', { name: sliderName(name) });
    // Twenty steps of five key presses, down then up, each followed by a tick for React to render and a look at
    // every knob, all in the page: as a hundred round trips the test outran its time on a busy machine.
    const { seen, moved } = await knob.evaluate(async (el, before) => {
      const layout = () =>
        [...document.querySelectorAll<HTMLElement>('.knob')]
          .filter((k) => k.checkVisibility())
          .map((k) => {
            const r = k.getBoundingClientRect();
            return `${k.querySelector('[role=slider]')?.getAttribute('aria-label')} ${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}`;
          });
      const seen = new Set<string | null>();
      const moved: string[] = [];
      for (const key of ['ArrowDown', 'ArrowUp'])
        for (let i = 0; i < 10; i++) {
          for (let n = 0; n < 5; n++) el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
          // Not requestAnimationFrame: background tabs (parallel runs) pause it.
          await new Promise((resolve) => setTimeout(resolve, 0));
          const value = el.getAttribute('aria-valuetext');
          seen.add(value);
          const now = layout();
          if (now.join() !== before.join()) moved.push(`at ${value}: ${now.filter((k, j) => k !== before[j]).join('; ')}`);
        }
      return { seen: seen.size, moved };
    }, before);
    expect(moved, `${name}: knobs moved or resized`).toEqual([]);
    expect(seen, `${name} really turned`).toBeGreaterThan(5);
  }
});

test('a mapped knob’s marker takes no room', async ({ page }) => {
  await page.goto('/');
  const before = await knobLayout(page);
  await page.evaluate(() =>
    localStorage.setItem(
      'limpide.mappings',
      JSON.stringify(
        ['cutoff', 'resonance', 'velocityCutoff'].map((id, i) => ({
          control: { kind: 'cc', channel: 1, number: 70 + i },
          target: { kind: 'param', id },
          mode: 'absolute',
        })),
      ),
    ),
  );
  await page.reload();
  await expect(page.getByRole('region', { name: 'Filter' }).locator('.knob[data-mapped]')).toHaveCount(3);
  expect(await knobLayout(page)).toEqual(before);
  await page.evaluate(() => localStorage.removeItem('limpide.mappings'));
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 393, height: 852 }, hasTouch: true });

  // A real finger: touch input through Chromium's DevTools protocol, so the page gets genuine touch pointer events.
  const finger = async (page: import('@playwright/test').Page, path: { x: number; y: number }[], during?: () => Promise<void>) => {
    const cdp = await page.context().newCDPSession(page);
    const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', p?: { x: number; y: number }) =>
      cdp.send('Input.dispatchTouchEvent', { type, touchPoints: p ? [{ x: p.x, y: p.y }] : [] });
    await touch('touchStart', path[0]);
    for (const p of path.slice(1)) await touch('touchMove', p);
    await during?.();
    await touch('touchEnd');
  };

  test('a finger dragging a knob sees its value above the finger, gone once it lifts', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'touch input through the DevTools protocol');
    await page.goto('/');
    const dial = page.getByRole('region', { name: 'Filter' }).getByRole('slider', { name: 'Cutoff' });
    await dial.scrollIntoViewIfNeeded();
    const box = (await dial.boundingBox())!;
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    const bubble = page.locator('.value-bubble');
    await finger(page, [{ x, y }, { x, y: y - 10 }, { x, y: y - 30 }], async () => {
      await expect(bubble).toBeVisible();
      await expect(bubble).toHaveText((await dial.getAttribute('aria-valuetext'))!);
      expect((await bubble.boundingBox())!.y + (await bubble.boundingBox())!.height).toBeLessThan(box.y);
    });
    await expect(bubble).toHaveCount(0);
  });

  test('a finger dragging a knob keeps its name under it, the bubble alone showing the value (issue 83)', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'touch input through the DevTools protocol');
    await page.goto('/');
    const dial = page.getByRole('region', { name: 'Filter' }).getByRole('slider', { name: 'Cutoff' });
    const knob = dial.locator('xpath=ancestor::div[contains(@class, "knob")][1]');
    await dial.scrollIntoViewIfNeeded();
    const box = (await dial.boundingBox())!;
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await finger(page, [{ x, y }, { x, y: y - 10 }, { x, y: y - 30 }], async () => {
      await expect(page.locator('.value-bubble')).toBeVisible();
      await expect(knob.locator('.knob-label')).toBeVisible();
      await expect(knob.locator('.knob-value > span').first()).toBeHidden();
    });
  });

  test('a finger dragging across a fader’s track scrolls the page and leaves the fader alone', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'touch input through the DevTools protocol');
    await page.goto('/');
    const cap = page.getByRole('region', { name: 'Amp' }).getByRole('slider', { name: 'Sustain' });
    await cap.scrollIntoViewIfNeeded();
    const before = await cap.getAttribute('aria-valuenow');
    const track = (await cap.locator('xpath=ancestor::*[contains(@class, "fader")][1]').boundingBox())!;
    const capBox = (await cap.boundingBox())!;
    // Start on the track, well away from the cap, and drag up as a thumb scrolling the page does.
    const x = track.x + track.width / 2;
    const y = capBox.y > track.y + track.height / 2 ? track.y + 6 : track.y + track.height - 6;
    const scrolled = await page.evaluate(() => scrollY);
    await finger(page, Array.from({ length: 8 }, (_, i) => ({ x, y: y - i * 12 })));
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(scrolled);
    expect(await cap.getAttribute('aria-valuenow')).toBe(before);
  });

  test('a knob shows its name, and its value only while it changes, in the same line', async ({ page }) => {
    await page.goto('/');
    const dial = page.getByRole('region', { name: 'Filter' }).getByRole('slider', { name: 'Cutoff' });
    const knob = dial.locator('xpath=ancestor::div[contains(@class, "knob")][1]');
    const name = knob.locator('.knob-label');
    const value = knob.locator('.knob-value > span').first();
    await dial.scrollIntoViewIfNeeded(); // measured where it will be when the key turns it
    await expect(name).toBeVisible();
    await expect(value).toBeHidden();
    const at = async () => [(await dial.boundingBox())!.y, (await name.boundingBox())!.y];
    const before = await at();

    await dial.press('ArrowUp');
    await expect(value).toBeVisible();
    await expect(value).toHaveText((await dial.getAttribute('aria-valuetext'))!);
    await expect(name).toBeHidden();
    expect((await value.boundingBox())!.y).toBeCloseTo(before[1], 0); // the value takes the name's place
    expect(await at()).toEqual(before); // nothing moved

    await expect(value).toBeHidden({ timeout: 3000 }); // and the name comes back
    await expect(name).toBeVisible();
  });

  test('knob rows have no line for values', async ({ page }) => {
    await page.goto('/');
    const dial = page.getByRole('slider', { name: 'Cutoff' });
    const knob = dial.locator('xpath=ancestor::div[contains(@class, "knob")][1]');
    const [k, d, n] = await Promise.all([knob, dial, knob.locator('.knob-label')].map(async (l) => (await l.boundingBox())!));
    expect(k.y + k.height).toBeCloseTo(n.y + n.height, 0); // the name is the knob's last line
    expect(n.y).toBeGreaterThan(d.y + d.height - 1);
  });
});

test.describe('in a narrow window with a mouse', () => {
  test.use({ viewport: { width: 560, height: 900 } });

  test('hovering a knob or fader shows its value in its name’s place, as turning it does (the owner, 2026-10-28)', async ({ page }) => {
    await page.goto('/');
    for (const name of ['Cutoff', 'Filter Attack']) {
      const dial = page.getByRole('slider', { name });
      const control = dial.locator('xpath=ancestor::div[contains(@class, "knob")][1]');
      const label = control.locator('.knob-label');
      const value = control.locator('.knob-value > span').first();
      await dial.scrollIntoViewIfNeeded();
      await expect(value).toBeHidden();
      await control.hover();
      await expect(value, name).toBeVisible();
      await expect(value).toHaveText((await dial.getAttribute('aria-valuetext'))!);
      await expect(label).toBeHidden();
      await page.mouse.move(0, 0);
      await expect(value).toBeHidden();
      await expect(label).toBeVisible();
    }
  });
});

test.describe('on the 2 × 2 layout', () => {
  test.use({ viewport: { width: 760, height: 1000 } });

  test('a knob shows its name, and its value in the name’s place only while it changes or is hovered, as on a phone (issue 83)', async ({ page }) => {
    await page.goto('/');
    const dial = page.getByRole('region', { name: 'Filter' }).getByRole('slider', { name: 'Cutoff' });
    const knob = dial.locator('xpath=ancestor::div[contains(@class, "knob")][1]');
    const name = knob.locator('.knob-label');
    const value = knob.locator('.knob-value > span').first();
    await dial.scrollIntoViewIfNeeded();
    await expect(name).toBeVisible();
    await expect(value).toBeHidden();
    const [k, n] = await Promise.all([knob.boundingBox(), name.boundingBox()]);
    expect(k!.y + k!.height).toBeCloseTo(n!.y + n!.height, 0); // no line for values under the name
    await dial.press('ArrowUp');
    await expect(value).toBeVisible();
    await expect(name).toBeHidden();
    await expect(value).toBeHidden({ timeout: 3000 });
    await knob.hover();
    await expect(value).toBeVisible();
  });
});


// The owner's bug: a knob kept turning after the mouse button was let go. The release never reached the page (let go
// outside the window, or taken by the context menu of a right- or Ctrl-click), so the knob kept following the mouse.
for (const name of ['Cutoff', 'Osc 1'] as const) {
  test(`${name} stops following the mouse once no button is held, even when the release never arrived`, async ({ page }) => {
    await page.goto('/');
    if (name === 'Osc 1') await page.getByRole('tab', { name: 'Mixer' }).click();
    const control = page.getByRole('slider', { name, exact: true });
    const before = await control.getAttribute('aria-valuenow');
    const box = (await control.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    // The button is up again, but no release came: the next moves say so, with no button held.
    await control.evaluate((el, y) => {
      const target = el.closest('.fader') ?? el;
      const r = el.getBoundingClientRect();
      for (const dy of [10, 40, 80]) {
        target.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerId: 1, pointerType: 'mouse', buttons: 0, clientX: r.x + r.width / 2, clientY: y + dy }));
      }
    }, box.y + box.height / 2);
    expect(await control.getAttribute('aria-valuenow')).toBe(before);
    await page.mouse.up();
  });
}

test('a right-click on a knob turns nothing, so its context menu cannot leave a drag behind', async ({ page }) => {
  await page.goto('/');
  const cutoff = page.getByRole('slider', { name: 'Cutoff' });
  const before = await cutoff.getAttribute('aria-valuenow');
  const box = (await cutoff.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down({ button: 'right' });
  await page.mouse.move(box.x + box.width / 2, box.y - 60, { steps: 6 });
  await page.mouse.up({ button: 'right' });
  expect(await cutoff.getAttribute('aria-valuenow')).toBe(before);
});

// Issue 105 (the 1.16.0 review): a notch is 4 % of a knob's travel, and a stepped knob rounded it back to where it was.
test('one wheel notch turns a stepped knob one step, and small trackpad scrolls add up to one', async ({ page }) => {
  await page.goto('/');
  const wheelOver = async (name: string, deltas: number[]) => {
    const box = (await page.getByRole('slider', { name, exact: true }).boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    for (const deltaY of deltas) await page.mouse.wheel(0, deltaY);
  };
  const octave = page.getByRole('slider', { name: 'Osc 1 Octave', exact: true });
  await wheelOver('Osc 1 Octave', [-100]);
  await expect(octave).toHaveAttribute('aria-valuetext', '+1 oct');
  await wheelOver('Osc 1 Octave', [100]);
  await expect(octave).toHaveAttribute('aria-valuetext', '0 oct');

  await page.getByRole('tab', { name: /Osc 2/ }).click();
  const semitone = page.getByRole('slider', { name: 'Osc 2 Semitone', exact: true });
  await wheelOver('Osc 2 Semitone', Array(8).fill(-10));
  await expect(semitone).toHaveAttribute('aria-valuetext', '0 st'); // not yet a notch's worth
  await wheelOver('Osc 2 Semitone', [-10, -10]);
  await expect(semitone).toHaveAttribute('aria-valuetext', '+1 st');

  // A knob without steps still turns 4 % a notch.
  const resonance = page.getByRole('slider', { name: 'Resonance', exact: true });
  const before = Number(await resonance.getAttribute('aria-valuenow'));
  await wheelOver('Resonance', [-100]);
  await expect.poll(async () => Number(await resonance.getAttribute('aria-valuenow'))).toBe(before + 4);
});
