import { describe, expect, it } from 'vitest';
import { cardAside } from './cardAside';

// Issue 254: where the Tour's card would cover what it points at, it moves along the bottom to stand beside it.

/** The window and the card as at 1920 × 1080: the card 720 px wide, in the middle. */
const wide = { window: 1920, card: { left: 600, width: 720 } };

describe('where the Tour’s card moves to, beside what it shows (issue 254)', () => {
  it('moves the card the least to stand clear of what it shows, a gap from it: right of the Filter’s column', () => {
    expect(cardAside(wide.card, [{ left: 509, right: 935 }], wide.window)).toBe(935 + 12 - 600);
  });

  it('or left of the Amp’s column and the Timeline, whichever side is nearer and has room', () => {
    const amp = [{ left: 985, right: 1411 }, { left: 1461, right: 1887 }, { left: 1065, right: 1325 }];
    expect(cardAside(wide.card, amp, wide.window)).toBe(985 - 12 - 720 - 600);
  });

  it('between two things it shows, where the room between them takes it', () => {
    // 1440 × 900's LFO card: the Depth knob far left, the Timeline right of the middle.
    expect(cardAside({ left: 360, width: 720 }, [{ left: 77, right: 145 }, { left: 911, right: 1407 }], 1440)).toBe(911 - 12 - 720 - 360); // as near the middle as that room allows
  });

  it('nowhere, where no room along the bottom is clear of it all, the window’s edges kept', () => {
    expect(cardAside({ left: 360, width: 720 }, [{ left: 508, right: 932 }], 1440)).toBeNull();
    expect(cardAside({ left: 0, width: 390 }, [{ left: 21, right: 77 }], 390)).toBeNull(); // a phone's, the window wide
  });

  it('not at all, where it covers none of it', () => {
    expect(cardAside(wide.card, [{ left: 33, right: 459 }], wide.window)).toBe(0);
  });
});
