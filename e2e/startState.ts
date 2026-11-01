import type { Page } from '@playwright/test';

/**
 * What every spec's browser holds when it starts. Bead comes out by itself a few seconds in (issue 150) and its
 * pixels take the pointer, so every spec starts with it switched off: the mascot spec calls it with B, E, A, D, or
 * starts from nothing stored to see it come by itself. All but a first visit's specs start welcomed already, so
 * About's welcome never stands over the page.
 */
export const BEAD_OFF = { 'limpide.bead': 'off' };
export const WELCOMED = { 'limpide.welcomed': '1' };

/** A browser holding `items` in the page's storage, as a Playwright `storageState`. */
export const holding = (items: Record<string, string>) => ({
  cookies: [],
  origins: [{ origin: 'http://localhost:5199', localStorage: Object.entries(items).map(([name, value]) => ({ name, value })) }],
});

/** What every spec starts with but a first visit's: welcomed, Bead switched off. */
export const USUAL = { ...WELCOMED, ...BEAD_OFF };

/** A brand-new browser: no welcome closed, no Patch kept, Bead switched off. */
export const FIRST_VISIT = holding(BEAD_OFF);

/**
 * Empties the page's storage once, before the app first runs, leaving `items`: so no autosave writes back in between,
 * and a reload keeps what the test saved since.
 */
export const startEmptied = (page: Page, items: Record<string, string>) =>
  page.addInitScript((kept) => {
    if (sessionStorage.getItem('emptied')) return;
    localStorage.clear();
    for (const [key, value] of Object.entries(kept)) localStorage.setItem(key, value);
    sessionStorage.setItem('emptied', 'true');
  }, items);
