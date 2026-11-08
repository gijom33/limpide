import { expect, type Page } from '@playwright/test';
import { startEmptied, USUAL } from './startState';

/**
 * Plays a message from the stand-in Controller; `at` (ms, on the page's clock) stamps it as having come then. `playMidiOn`
 * plays it on one input alone, by its name.
 */
type MidiWindow = { playMidi(bytes: number[], at?: number): void; playMidiOn(name: string, bytes: number[]): void };

/** Plays raw MIDI messages from the stand-in Controller, in order. */
export const play = (page: Page, ...messages: number[][]) =>
  page.evaluate((all) => all.forEach((bytes) => (window as unknown as MidiWindow).playMidi(bytes)), messages);
/** Plays raw MIDI messages on one input alone, by its name: a C16 beside a keyboard (issue 255). */
export const playOn = (page: Page, name: string, ...messages: number[][]) =>
  page.evaluate(([name, all]) => all.forEach((bytes) => (window as unknown as MidiWindow).playMidiOn(name, bytes)), [name, messages] as const);
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
 * Several names are one Controller on several ports at once (a C16 on USB and Bluetooth): each message `play` plays
 * comes on all; or several Controllers, each played alone with `playOn`.
 */
export async function withFakeController(page: Page, name: string | readonly string[] = 'Stand-in Controller') {
  const names = typeof name === 'string' ? [name] : [...name];
  await midiPermission(page, 'granted');
  await startEmptied(page, USUAL); // an empty Library, but not a first visit
  await page.addInitScript((names) => {
    const inputs = names.map((name, i) => Object.assign(new EventTarget(), { id: `fake${i || ''}`, name, state: 'connected' }));
    const access = Object.assign(new EventTarget(), { inputs: new Map(inputs.map((input) => [input.id, input])) });
    Object.defineProperty(navigator, 'requestMIDIAccess', { value: () => Promise.resolve(access), configurable: true });
    const message = (bytes: number[], at?: number) => {
      const event = Object.assign(new Event('midimessage'), { data: Uint8Array.from(bytes) });
      if (at !== undefined) Object.defineProperty(event, 'timeStamp', { value: at });
      return event;
    };
    (window as unknown as MidiWindow).playMidi = (bytes, at) => {
      for (const input of inputs) input.dispatchEvent(message(bytes, at));
    };
    (window as unknown as MidiWindow).playMidiOn = (name, bytes) => {
      for (const input of inputs) if (input.name === name) input.dispatchEvent(message(bytes));
    };
  }, names);
  await page.goto('/');
  await expect(midiButton(page)).toContainText(String(names.length));
}
