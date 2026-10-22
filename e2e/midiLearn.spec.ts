import { expect, test, type Page } from '@playwright/test';

type MidiWindow = { playMidi(bytes: number[]): void };
const play = (page: Page, ...messages: number[][]) =>
  page.evaluate((all) => all.forEach((bytes) => (window as unknown as MidiWindow).playMidi(bytes)), messages);
const cc = (controller: number, value: number, channel = 1) => [0xb0 + channel - 1, controller, value];
const times = (n: number, message: number[]) => Array.from({ length: n }, () => message);

const cutoff = (page: Page) => page.getByRole('region', { name: 'Filter' }).getByRole('slider', { name: 'Cutoff' });
const midiButton = (page: Page) => page.getByRole('button', { name: 'MIDI', exact: true });
const midiPanel = (page: Page) => page.getByRole('dialog', { name: 'MIDI' });
const learnBar = (page: Page) => page.getByRole('status', { name: 'MIDI Learn' });

async function openMidi(page: Page) {
  if ((await midiButton(page).getAttribute('aria-expanded')) !== 'true') await midiButton(page).click();
  await expect(midiPanel(page)).toBeVisible();
}

async function startLearn(page: Page) {
  await openMidi(page);
  await midiPanel(page).getByRole('button', { name: 'MIDI Learn' }).click();
  await expect(learnBar(page)).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  // A stand-in Controller: Web MIDI with one input the test can play. Storage starts empty, once.
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('cleared')) {
      localStorage.clear();
      sessionStorage.setItem('cleared', 'true');
    }
    const input = Object.assign(new EventTarget(), { id: 'fake', name: 'Synido TempoPAD C16', state: 'connected' });
    const access = Object.assign(new EventTarget(), { inputs: new Map([['fake', input]]) });
    Object.defineProperty(navigator, 'requestMIDIAccess', { value: () => Promise.resolve(access), configurable: true });
    (window as unknown as MidiWindow).playMidi = (bytes) =>
      input.dispatchEvent(Object.assign(new Event('midimessage'), { data: Uint8Array.from(bytes) }));
  });
  await page.goto('/');
  await expect(midiButton(page)).toContainText('1');
});

test('MIDI Learn: pick a knob on screen, turn one on the Controller, and it drives that Parameter', async ({ page }) => {
  await startLearn(page);
  await expect(learnBar(page)).toContainText(/click a knob or button/i);
  const before = Number(await cutoff(page).getAttribute('aria-valuenow'));
  await cutoff(page).click(); // selects it for Learn, without moving it
  await expect(learnBar(page)).toContainText(/Cutoff/);
  await expect(cutoff(page)).toHaveAttribute('aria-valuenow', String(before));
  await play(page, ...times(4, cc(74, 1))); // an endless encoder, two's-complement steps
  await expect(learnBar(page)).toContainText(/Cutoff.*CC 74/);
  await expect(cutoff(page)).toHaveAttribute('aria-valuenow', String(before)); // learning does not move it
  await learnBar(page).getByRole('button', { name: 'Done' }).click();
  await expect(learnBar(page)).toBeHidden();

  await play(page, ...times(10, cc(74, 1)));
  await expect(cutoff(page)).toHaveAttribute('aria-valuenow', String(before + 10));
  await expect(cutoff(page).locator('..')).toHaveAttribute('data-mapped', 'true');

  await openMidi(page);
  await expect(midiPanel(page).getByRole('list', { name: 'Mappings' })).toContainText(/Cutoff.*CC 74.*Relative/);
  await page.reload();
  await openMidi(page);
  await expect(midiPanel(page).getByRole('list', { name: 'Mappings' })).toContainText(/Cutoff.*CC 74/); // kept
});

test('a removed Mapping stops driving its Parameter', async ({ page }) => {
  await startLearn(page);
  await cutoff(page).click();
  await play(page, ...times(4, cc(74, 1)));
  await page.keyboard.press('Escape'); // Escape also ends Learn
  await expect(learnBar(page)).toBeHidden();
  await openMidi(page);
  await midiPanel(page).getByRole('button', { name: 'Remove Cutoff Mapping' }).click();
  await expect(midiPanel(page).getByRole('list', { name: 'Mappings' })).toHaveCount(0);
  const before = await cutoff(page).getAttribute('aria-valuenow');
  await play(page, ...times(5, cc(74, 1)));
  await page.waitForTimeout(200);
  await expect(cutoff(page)).toHaveAttribute('aria-valuenow', before!);
});

test('an Action learns from a pad: the pad then toggles Hold and no longer plays a Note', async ({ page }) => {
  const hold = page.getByRole('button', { name: 'Hold' });
  await startLearn(page);
  await hold.click(); // selects Hold for Learn, without toggling it
  await expect(hold).toHaveAttribute('aria-pressed', 'false');
  await play(page, [0x99, 36, 100], [0x89, 36, 0]); // pad on channel 10
  await expect(learnBar(page)).toContainText(/Hold.*Note C2/);
  await page.keyboard.press('Escape');

  await play(page, [0x99, 36, 100], [0x89, 36, 0]);
  await expect(hold).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('group', { name: 'Piano' }).locator('[aria-pressed="true"]')).toHaveCount(0);
  await play(page, [0x99, 36, 100], [0x89, 36, 0]);
  await expect(hold).toHaveAttribute('aria-pressed', 'false');
});

test('the Activity Monitor shows the last message received', async ({ page }) => {
  await openMidi(page);
  const monitor = midiPanel(page).getByRole('status', { name: 'MIDI activity' });
  await expect(monitor).toContainText(/nothing received/i);
  await play(page, cc(7, 100, 2));
  await expect(monitor).toContainText('CC 7 · 100 · ch 2');
  await play(page, [0x90, 64, 120]);
  await expect(monitor).toContainText('Note E4 · 120 · ch 1');
});

test('a knob shows when hardware moves it, and when Pickup is still waiting for the knob to reach it', async ({ page }) => {
  await startLearn(page);
  await cutoff(page).click();
  await play(page, cc(20, 10), cc(20, 11), cc(20, 12), cc(20, 13)); // an Absolute knob, far below Cutoff
  await page.keyboard.press('Escape');
  const knob = cutoff(page).locator('..');
  await play(page, cc(20, 14));
  await expect(knob).toHaveAttribute('data-midi', 'waiting');
  await play(page, cc(20, 127)); // swept past the value: picked up
  await expect(knob).toHaveAttribute('data-midi', 'moved');
  await expect(cutoff(page)).toHaveAttribute('aria-valuenow', '100');
  await expect(knob).not.toHaveAttribute('data-midi', /./, { timeout: 2000 }); // the flash fades
});
