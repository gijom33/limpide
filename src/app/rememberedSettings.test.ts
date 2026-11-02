import { describe, expect, it } from 'vitest';
import { memoryStorage } from '../test/memoryStorage';
import { recall, remember } from './rememberedSettings';

describe('the settings remembered in one place (issues 87, 139)', () => {
  it('brings back what a browser saved before, under the same keys and in the same form', () => {
    const storage = memoryStorage({
      'limpide.viewSettings': JSON.stringify({ cycles: 4, timelineSeconds: 3, frequencyScale: 'linear', levelScale: 'linear', tapSource: 'newest' }),
      'limpide.overlays': JSON.stringify({ harmonics: false, ideal: true, curve: false, guides: true, geek: true }),
      'limpide.letterKeys': 'off',
      'limpide.tooltips': 'off',
      'limpide.theme': 'light',
      'limpide.bead': 'off',
    });
    expect(recall(storage, 'viewer')).toEqual({ cycles: 4, timelineSeconds: 3, frequencyScale: 'linear', levelScale: 'linear', tapSource: 'newest' });
    expect(recall(storage, 'overlays')).toEqual({ harmonics: false, ideal: true, curve: false, guides: true, geek: true });
    expect(recall(storage, 'letterKeys')).toBe('off');
    expect(recall(storage, 'tooltips')).toBe('off');
    expect(recall(storage, 'theme')).toBe('light');
    expect(recall(storage, 'bead')).toBe('off');
  });

  it('starts a missing, garbled or unknown setting at its default, keeping the others', () => {
    const nothing = memoryStorage();
    expect(recall(nothing, 'viewer')).toEqual({ cycles: 2, timelineSeconds: 2, frequencyScale: 'log', levelScale: 'db', tapSource: 'all' });
    expect(recall(nothing, 'overlays')).toEqual({ harmonics: true, ideal: true, curve: true, guides: false, geek: false });
    expect([recall(nothing, 'letterKeys'), recall(nothing, 'tooltips'), recall(nothing, 'theme'), recall(nothing, 'bead')]).toEqual(['on', 'on', 'dark', 'on']);

    const garbled = memoryStorage({
      'limpide.viewSettings': JSON.stringify({ cycles: 3, timelineSeconds: 4, frequencyScale: 'sideways' }),
      // A choice for an overlay not offered ("ghost") is ignored, and a non-boolean one ("yes") too.
      'limpide.overlays': '{"guides":true,"ghost":false,"bogus":1,"curve":"yes"}',
      'limpide.letterKeys': 'maybe',
      'limpide.theme': 'sepia',
      'limpide.bead': 'gone',
    });
    expect(recall(garbled, 'viewer')).toMatchObject({ cycles: 2, timelineSeconds: 4, frequencyScale: 'log' });
    expect(recall(garbled, 'overlays')).toEqual({ harmonics: true, ideal: true, curve: true, guides: true, geek: false });
    expect([recall(garbled, 'letterKeys'), recall(garbled, 'theme'), recall(garbled, 'bead')]).toEqual(['on', 'dark', 'on']);
    expect(recall(memoryStorage({ 'limpide.viewSettings': '{not json', 'limpide.overlays': 'null' }), 'viewer')).toMatchObject({ cycles: 2 });
    expect(recall(memoryStorage({ 'limpide.overlays': 'null' }), 'overlays')).toMatchObject({ harmonics: true });
  });

  it('keeps the Synth Geek Layer under `geek`; a choice saved under its old name, `maths`, is let go (issue 165)', () => {
    expect(recall(memoryStorage({ 'limpide.overlays': JSON.stringify({ maths: true }) }), 'overlays').geek).toBe(false);
    expect(recall(memoryStorage({ 'limpide.overlays': JSON.stringify({ geek: true }) }), 'overlays').geek).toBe(true);
  });

  it('treats a browser that never met Bead, under its old "unmet", as on: Bead is out by default (issue 150)', () => {
    expect(recall(memoryStorage({ 'limpide.bead': 'unmet' }), 'bead')).toBe('on');
    expect(recall(memoryStorage({ 'limpide.bead': 'on' }), 'bead')).toBe('on');
  });

  it('brings back the cards’ folds, the bend range and the aftertouch under their keys and in their forms (issue 139)', () => {
    const storage = memoryStorage({
      'limpide.cardFolded.demo': '1',
      'limpide.cardFolded.tutorial': '0',
      'limpide.cardFolded.tour': '1',
      'limpide.bendRange': '12',
      'limpide.aftertouch': 'volume',
    });
    expect([recall(storage, 'cardFolded.demo'), recall(storage, 'cardFolded.tutorial'), recall(storage, 'cardFolded.tour')]).toEqual(['1', '0', '1']);
    expect(recall(storage, 'bendRange')).toBe(12);
    expect(recall(storage, 'aftertouch')).toBe('volume');

    const nothing = memoryStorage({ 'limpide.bendRange': '5', 'limpide.aftertouch': 'nowhere', 'limpide.cardFolded.demo': 'yes' });
    expect([recall(nothing, 'bendRange'), recall(nothing, 'aftertouch'), recall(nothing, 'cardFolded.demo'), recall(nothing, 'cardFolded.tour')]).toEqual([2, 'cutoff', '0', '0']);

    remember(nothing, 'bendRange', 7);
    remember(nothing, 'aftertouch', 'pitch');
    remember(nothing, 'cardFolded.tour', '1');
    expect([nothing.data['limpide.bendRange'], nothing.data['limpide.aftertouch'], nothing.data['limpide.cardFolded.tour']]).toEqual(['7', 'pitch', '1']);
  });

  it('keeps each setting under the same key and in the same form as before, so a reload brings it back', () => {
    const storage = memoryStorage();
    remember(storage, 'viewer', { cycles: 1, timelineSeconds: 4, frequencyScale: 'linear', levelScale: 'db', tapSource: 'newest' });
    remember(storage, 'overlays', { harmonics: true, ideal: false, curve: true, guides: false, geek: true });
    remember(storage, 'tooltips', 'off');
    remember(storage, 'theme', 'light');
    expect(JSON.parse(storage.data['limpide.viewSettings'])).toEqual({ cycles: 1, timelineSeconds: 4, frequencyScale: 'linear', levelScale: 'db', tapSource: 'newest' });
    expect(JSON.parse(storage.data['limpide.overlays'])).toEqual({ harmonics: true, ideal: false, curve: true, guides: false, geek: true });
    expect(storage.data['limpide.tooltips']).toBe('off');
    expect(storage.data['limpide.theme']).toBe('light');
    expect(recall(storage, 'overlays').geek).toBe(true);
    expect(recall(storage, 'theme')).toBe('light');
  });
});
