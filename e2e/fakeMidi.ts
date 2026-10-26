import { expect, type Page } from '@playwright/test';

type MidiWindow = { playMidi(bytes: number[]): void };

/** Plays raw MIDI messages from the stand-in Controller, in order. */
export const play = (page: Page, ...messages: number[][]) =>
  page.evaluate((all) => all.forEach((bytes) => (window as unknown as MidiWindow).playMidi(bytes)), messages);
export const cc = (controller: number, value: number, channel = 1) => [0xb0 + channel - 1, controller, value];
export const times = (n: number, message: number[]) => Array.from({ length: n }, () => message);

export const midiButton = (page: Page) => page.getByRole('button', { name: 'MIDI', exact: true });
export const midiPanel = (page: Page) => page.getByRole('dialog', { name: 'MIDI' });

export async function openMidi(page: Page) {
  if ((await midiButton(page).getAttribute('aria-expanded')) !== 'true') await midiButton(page).click();
  await expect(midiPanel(page)).toBeVisible();
}

/**
 * What the browser answers when asked whether MIDI is allowed. Limpide asks for MIDI only when its panel opens,
 * unless the browser already allowed it (issue 46): a stand-in Controller is one the visitor allowed before.
 */
export const midiPermission = (page: Page, state: PermissionState) =>
  page.addInitScript((state) => {
    const query = navigator.permissions.query.bind(navigator.permissions);
    navigator.permissions.query = (descriptor) =>
      descriptor.name === ('midi' as PermissionName) ? Promise.resolve({ state } as PermissionStatus) : query(descriptor);
  }, state);

/**
 * Opens Limpide with a stand-in Controller: Web MIDI with one input the test can play. Storage starts empty,
 * once, so reloads keep what the test saved. It is not a C16 (which would get its own layout) unless named one.
 */
export async function withFakeController(page: Page, name = 'Stand-in Controller') {
  await midiPermission(page, 'granted');
  await page.addInitScript((name) => {
    if (!sessionStorage.getItem('cleared')) {
      localStorage.clear();
      localStorage.setItem('limpide.welcomed', '1'); // an empty Library, but not a first visit
      sessionStorage.setItem('cleared', 'true');
    }
    const input = Object.assign(new EventTarget(), { id: 'fake', name, state: 'connected' });
    const access = Object.assign(new EventTarget(), { inputs: new Map([['fake', input]]) });
    Object.defineProperty(navigator, 'requestMIDIAccess', { value: () => Promise.resolve(access), configurable: true });
    (window as unknown as MidiWindow).playMidi = (bytes) =>
      input.dispatchEvent(Object.assign(new Event('midimessage'), { data: Uint8Array.from(bytes) }));
  }, name);
  await page.goto('/');
  await expect(midiButton(page)).toContainText('1');
}
