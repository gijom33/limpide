import { describe, expect, it } from 'vitest';
import { INITIAL_VIEWER_STATE, viewerReducer } from './viewerState';

describe('Viewer state', () => {
  it('starts live, with every Voice at the Amp Tap, on log frequency and dB level axes, with no Snapshot', () => {
    expect(INITIAL_VIEWER_STATE).toEqual({ frozen: false, tapSource: 'all', frequencyScale: 'log', levelScale: 'db', snapshot: null });
  });

  it('can follow the newest Note alone instead of every Voice, and back', () => {
    const newest = viewerReducer(INITIAL_VIEWER_STATE, { type: 'setTapSource', source: 'newest' });
    expect(newest.tapSource).toBe('newest');
    expect(viewerReducer(newest, { type: 'setTapSource', source: 'all' }).tapSource).toBe('all');
  });

  it('Freeze toggles on and off', () => {
    const frozen = viewerReducer(INITIAL_VIEWER_STATE, { type: 'toggleFreeze' });
    expect(frozen.frozen).toBe(true);
    expect(viewerReducer(frozen, { type: 'toggleFreeze' }).frozen).toBe(false);
  });

  it('switches each axis independently', () => {
    const linear = viewerReducer(INITIAL_VIEWER_STATE, { type: 'setFrequencyScale', scale: 'linear' });
    expect(linear.frequencyScale).toBe('linear');
    expect(linear.levelScale).toBe('db');
    expect(viewerReducer(linear, { type: 'setLevelScale', scale: 'linear' }).levelScale).toBe('linear');
  });

  it('takes a Snapshot, and a new one replaces the old', () => {
    const first = viewerReducer(INITIAL_VIEWER_STATE, { type: 'takeSnapshot' });
    const second = viewerReducer(first, { type: 'takeSnapshot' });
    expect(first.snapshot).not.toBeNull();
    expect(second.snapshot).not.toBeNull();
    expect(second.snapshot).not.toBe(first.snapshot);
  });

  it('clears the Snapshot', () => {
    const taken = viewerReducer(INITIAL_VIEWER_STATE, { type: 'takeSnapshot' });
    expect(viewerReducer(taken, { type: 'clearSnapshot' }).snapshot).toBeNull();
  });

  it('keeps the Snapshot while freezing and unfreezing, so you can compare against a frozen frame', () => {
    const taken = viewerReducer(INITIAL_VIEWER_STATE, { type: 'takeSnapshot' });
    const frozen = viewerReducer(taken, { type: 'toggleFreeze' });
    expect(frozen.snapshot).toBe(taken.snapshot);
  });
});
