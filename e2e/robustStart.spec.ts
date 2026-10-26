import { expect, test } from '@playwright/test';
import { midiPermission } from './fakeMidi';

// Issue 46: what stopped a visitor before they played. The MIDI prompt came at load, and a browser that refuses site
// storage got a blank page.

test('MIDI is asked for when the MIDI panel opens, not at load', async ({ page }) => {
  await midiPermission(page, 'prompt');
  await page.addInitScript(() => {
    const access = Object.assign(new EventTarget(), { inputs: new Map() });
    const asked = window as unknown as { midiAsked: number };
    asked.midiAsked = 0;
    Object.defineProperty(navigator, 'requestMIDIAccess', {
      value: () => {
        asked.midiAsked++;
        return Promise.resolve(access);
      },
      configurable: true,
    });
  });
  await page.goto('/');
  await page.waitForTimeout(1500); // well past when it was asked before
  expect(await page.evaluate(() => (window as unknown as { midiAsked: number }).midiAsked)).toBe(0);
  await page.getByRole('button', { name: 'MIDI', exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { midiAsked: number }).midiAsked)).toBe(1);
  await expect(page.getByRole('dialog', { name: 'MIDI' })).toContainText(/no midi controller/i);
});

test('a browser that already allowed MIDI connects at load, asking nothing', async ({ page }) => {
  await midiPermission(page, 'granted');
  await page.addInitScript(() => {
    const input = Object.assign(new EventTarget(), { id: 'k', name: 'Keys', state: 'connected' });
    const access = Object.assign(new EventTarget(), { inputs: new Map([['k', input]]) });
    Object.defineProperty(navigator, 'requestMIDIAccess', { value: () => Promise.resolve(access), configurable: true });
  });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'MIDI', exact: true })).toContainText('1');
});

test('with site storage refused, the instrument still opens and plays', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('The operation is insecure.', 'SecurityError');
      },
      configurable: true,
    });
  });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Oscillators' })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Piano' })).toBeVisible();
  expect(errors).toEqual([]);
});
