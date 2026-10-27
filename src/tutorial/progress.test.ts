import { describe, expect, it } from 'vitest';
import { memoryStorage } from '../test/memoryStorage';
import { loadFinished, saveFinished } from './progress';

describe('finished Tutorials', () => {
  it('are kept between visits', () => {
    const storage = memoryStorage();
    expect(loadFinished(storage)).toEqual(new Set());
    saveFinished(storage, new Set(['Bass', 'Acid']));
    expect(loadFinished(storage)).toEqual(new Set(['Bass', 'Acid']));
  });

  it('start empty when what was kept is unreadable', () => {
    const storage = memoryStorage();
    storage.setItem('limpide.tutorialsFinished', '{not json');
    expect(loadFinished(storage)).toEqual(new Set());
    storage.setItem('limpide.tutorialsFinished', '{"a":1}');
    expect(loadFinished(storage)).toEqual(new Set());
  });
});
