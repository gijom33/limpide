import { describe, expect, it } from 'vitest';
import { brokenStorage, memoryStorage } from '../test/memoryStorage';
import { createLibrary } from './library';
import { defaultPatch, setParam } from './patch';

const warm = setParam(defaultPatch(), 'cutoff', 600);
const bright = setParam(defaultPatch(), 'cutoff', 9000);

describe('Patch library', () => {
  it('saves, lists (by name) and loads named Patches', () => {
    const library = createLibrary(memoryStorage());
    library.save('Warm pad', warm);
    library.save('bright lead', bright);
    expect(library.list().map((p) => p.name)).toEqual(['bright lead', 'Warm pad']);
    expect(library.get('Warm pad')).toEqual(warm);
  });

  it('overwrites a Patch saved again under the same name', () => {
    const library = createLibrary(memoryStorage());
    library.save('Mine', warm);
    library.save('Mine', bright);
    expect(library.list()).toHaveLength(1);
    expect(library.get('Mine')).toEqual(bright);
  });

  it('deletes a Patch', () => {
    const library = createLibrary(memoryStorage());
    library.save('Mine', warm);
    library.remove('Mine');
    expect(library.list()).toEqual([]);
    expect(library.get('Mine')).toBeUndefined();
  });

  it('trims names and refuses empty ones', () => {
    const library = createLibrary(memoryStorage());
    library.save('  Spaced  ', warm);
    expect(library.list()[0].name).toBe('Spaced');
    expect(() => library.save('   ', warm)).toThrow(/name/i);
  });

  it('keeps Patches across visits (same storage, new library)', () => {
    const storage = memoryStorage();
    createLibrary(storage).save('Mine', warm);
    expect(createLibrary(storage).get('Mine')).toEqual(warm);
  });

  it('autosaves the current Patch and brings it back', () => {
    const storage = memoryStorage();
    createLibrary(storage).saveCurrent(bright);
    expect(createLibrary(storage).loadCurrent()).toEqual(bright);
  });

  it('sanitises stored Patches, so ones saved by older versions still load', () => {
    const storage = memoryStorage({ 'synthview.patches': JSON.stringify({ Old: { cutoff: 800 } }) });
    expect(createLibrary(storage).get('Old')).toEqual({ ...defaultPatch(), cutoff: 800 });
  });

  it('treats garbled or unavailable storage as empty, without failing', () => {
    expect(createLibrary(memoryStorage({ 'synthview.patches': '{nope' })).list()).toEqual([]);
    const library = createLibrary(brokenStorage);
    expect(library.list()).toEqual([]);
    expect(library.loadCurrent()).toBeUndefined();
    expect(() => library.save('Mine', warm)).not.toThrow();
  });
});
