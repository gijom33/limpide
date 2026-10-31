import { describe, expect, it } from 'vitest';
import { createCache } from './cache';

describe('the cache (the 1.16.1 review)', () => {
  it('makes a value once, then gives the one kept', () => {
    const cache = createCache<string, number[]>(2);
    let made = 0;
    const make = () => [++made];
    const first = cache.get('a', make);
    expect(cache.get('a', make)).toBe(first);
    expect(made).toBe(1);
  });

  it('keeps the most recently asked for, letting go of the one asked for longest ago', () => {
    const cache = createCache<string, string>(2);
    const made: string[] = [];
    const get = (key: string) =>
      cache.get(key, () => {
        made.push(key);
        return key;
      });
    get('a');
    get('b');
    get('a'); // asked again: now the most recent
    get('c'); // lets go of b
    get('a');
    get('b');
    expect(made).toEqual(['a', 'b', 'c', 'b']);
  });
});
