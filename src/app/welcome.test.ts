import { describe, expect, it } from 'vitest';
import { createLibrary } from '../patch/library';
import { defaultPatch } from '../patch/patch';
import { brokenStorage, memoryStorage } from '../test/memoryStorage';
import { rememberWelcome, welcomeFor } from './welcome';

describe('The welcome', () => {
  it('greets a brand-new browser with the Demo, or with the sound shared with it', () => {
    const storage = memoryStorage();
    const library = createLibrary(storage);
    expect(welcomeFor(false, storage, library)).toBe('demo');
    expect(welcomeFor(true, storage, library)).toBe('shared');
  });

  it('is shown once: never again once it has closed', () => {
    const storage = memoryStorage();
    const library = createLibrary(storage);
    rememberWelcome(storage);
    expect(welcomeFor(false, storage, library)).toBeNull();
    expect(welcomeFor(true, storage, library)).toBeNull();
  });

  it('is not shown to a browser that has played before: a Last session or a saved Patch', () => {
    const played = memoryStorage();
    createLibrary(played).saveCurrent(defaultPatch());
    expect(welcomeFor(false, played, createLibrary(played))).toBeNull();

    const saved = memoryStorage();
    createLibrary(saved).save('Mine', defaultPatch());
    expect(welcomeFor(true, saved, createLibrary(saved))).toBeNull();
  });

  it('never throws when storage is refused: every visit is then a first one', () => {
    expect(welcomeFor(false, brokenStorage, createLibrary(brokenStorage))).toBe('demo');
    expect(() => rememberWelcome(brokenStorage)).not.toThrow();
  });
});
