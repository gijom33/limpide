import { describe, expect, it } from 'vitest';
import { memoryStorage } from '../test/memoryStorage';
import { migrateStorage } from './legacy';

describe('migrateStorage', () => {
  it('brings what the app saved under its former name across, once', () => {
    const storage = memoryStorage({ 'synthview.patches': '{"Old":{}}', 'synthview.theme': 'light' });
    migrateStorage(storage);
    expect(storage.getItem('limpide.patches')).toBe('{"Old":{}}');
    expect(storage.getItem('limpide.theme')).toBe('light');
    expect(storage.getItem('limpide.mappings')).toBeNull();
  });

  it('never overwrites what has since been saved under the current name', () => {
    const storage = memoryStorage({ 'synthview.theme': 'light', 'limpide.theme': 'dark' });
    migrateStorage(storage);
    expect(storage.getItem('limpide.theme')).toBe('dark');
  });

  it('copes with storage that throws', () => {
    expect(() => migrateStorage({ getItem: () => { throw new Error('blocked'); }, setItem: () => {} })).not.toThrow();
  });
});
