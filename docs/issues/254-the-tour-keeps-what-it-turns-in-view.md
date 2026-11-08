# 254: The Tour keeps what it turns in view

**What to build:** Review 5's finding on 1.26.1 (the inbox, 2026-11-07; [report](../reviews/2026-11-07/5-learner-teacher.md)): the Tour scrolls the control it turns out of view, the Amp card's Attack fader at 1440 × 900 and 1920 × 1080, the Filter card's Cutoff at 1920 × 1080. [206](./206-the-tour-shows-the-control-and-the-viewer.md) meant the Tour to show the control and its Viewer together.

**Blocked by:** none

**Status:** done (2026-11-07). Built (2026-11-07) on night/2026-11-07 and merged into main on 2026-11-07, approved by the owner, untried: "Merge the night"; ships with the next release. In v1 as polish ([131](./131-v1.md)), decided by the owner (2026-11-07, "Yes" to the triage's eight v1 issues).

## Agent Brief

**Category:** bug
**Summary:** On large windows the Tour scrolls away from the control its card is turning.

**Current behavior:** On the Amp card at 1440 × 900 and 1920 × 1080, and on the Filter card at 1920 × 1080, the control the card moves (Attack, Cutoff) ends out of the viewport or under the card.

**Desired behavior:** On every card, at every width the Tour runs at, the control it turns is in view and not under the card the whole time it moves, with its Viewer as 206 wants where both fit.

**Key interfaces:**
- The Tour's scroll for each card
- The card's place against the control

**Acceptance criteria:**
- [x] A test walks every card at 1440 × 900, 1920 × 1080 and a phone, and checks the turned control is in the viewport and clear of the card
- [x] 206's tests keep passing
- [ ] ~~Every test passes in both engines and in Linux's fonts (both engines here; Linux's fonts on GitHub, at the push)~~ (both engines in the shift's suite (2026-11-07); Linux's fonts are checked by the next release's branch run)

**Out of scope:** the cards' words and order (the Tour's ending is [260](./260-small-things-for-newcomers-after-1-26.md)'s).

## How it was built

- **Measured first** (Chromium, reduced motion). The Tour's card is 720 px wide and sits in the middle of the bottom from 1280 px windows up, so on wide windows it covers some columns and not others. By scrolling alone, two cards could never show their control and their Viewer above it. At 1440 × 900 the Amp's faders and the Envelope Timeline need 548 px, and the room above the card is 500 px. At 1920 × 1080 the Filter's Cutoff and its Filter Spectrum need 842 px, and the room is about 750 px. On the other cards at 1920 × 1080 (the Oscillators, the LFOs, and the Amp's faders with the Timeline), what the card shows sits in columns beside the card. Yet the page scrolled it above the card's top anyway, and scrolled the control off the top.
- **What the card does not cover, side to side, may stand beside it.** The Tour's scroll now counts an element the card does not cover (with a 12 px gap) as clear down to the window's foot. Only the Tour does this: a Tutorial's card scrolls as before. At 1920 × 1080 the Oscillators, the LFOs and the Amp's faders with its Timeline now show at once, and the page holds still.
- **The card moves along the bottom where it would cover what it shows.** This applies where the card covers part of what it shows and they do not all fit above it, and where another place along the bottom clears them all. There the card moves the least distance to that place, with a 12 px gap from them and from the window's edges. Everywhere else it stays in the middle. As measured: at 1920 × 1080 the Filter's card moves right (347 px) and the Amp's moves left (347 px); at 1440 × 900 the Amp's moves left (181 px). On the cards after the Sections it goes back to the middle. It jumps as the card changes, it does not glide. A phone's card, pinned to the bottom edge, never moves.
- **The person's place wins.** A card the person has dragged stays where they put it for the rest of the Tour. A double-click on its top row puts it back where the Tour placed it on that card, which is the middle unless the card had moved aside.
- **Tests:** `e2e/tour.spec.ts` walks every card at 1440 × 900, 1920 × 1080 and a 390 px phone. Each card is sampled in the page every tenth of a second over its whole cycle (all four Amp stages, the Filter's Cutoff and Resonance), and the last two cards ring their header buttons. On the wide windows the ringed control and the card's Viewers are clear the whole time. On the phone the control is clear whenever it moves (the Amp's faders hold still while the Timeline has the page, as in 206). Red first at both wide sizes, on every Section's card, and red again with the card's move switched off. `src/ui/cardAside.test.ts` checks where the card moves to: right of the Filter, left of the Amp, between two things, nowhere, not at all.
- **Tests run:** `npx tsc`, `npm run lint`, the Tour's and the card's unit tests (102 passed). The Tour, docked cards, Tutorial, keyboard access, About and welcome specs, plus the Tour's tests in the Bead and Demo specs: 189 passed in Chromium. In WebKit, 188 passed (one of those specs' tests is Chromium's own). Both before and after the review's fixes.

## Claude's calls, open to the owner

1. **The card moves sideways.** Scrolling alone cannot show the Filter's Cutoff with its Spectrum at 1920 × 1080, or the Amp's faders with its Timeline at 1440 × 900, above a card in the middle. The brief named "the card's place against the control", so the Tour's card now moves along the bottom on those cards. That changes [230](./230-the-demos-card-small-in-the-corner.md)'s decision 5 ("the Tour's and a Tutorial's cards … keep their place and room as now") for the Tour's card on wide windows. To set it back, take out the one call that moves the card (`standAside` in the Tour's card). The page then scrolls as before, and those two cards show their control and their Viewer in turn.
2. **A sweep still shows its control for its first second, then the Viewers** (206's call 2), where they do not fit together. That is no longer the case at 1440 × 900, at 1920 × 1080, or on a 390 × 844 phone. It still happens on the Filter's card on a 320 px phone, on a short phone (393 × 659), and on 2 × 2 windows about 800 px tall: there the Cutoff and Resonance leave view while they still move. Keeping the control in view the whole sweep there was built and tried. But it kept the Filter Spectrum out of view all card long on a short phone, and 128's test for the short phone failed. It is a few lines in `tourAt` if the owner wants it, with that test changed.
3. **"Clear of the card" in the Tour's browser tests now means not under it.** The shared helper counts an element beside the card as clear down to the window's foot, as the page now does. Its assertions for 128 and 206 are unchanged. On a phone and in 2 × 2, where the card spans the window, it measures as before. On wide windows it accepts a Viewer beside the card, which before had to sit above it.
4. **The Tour's scroll from 2 × 2 up lets things sit beside the card,** not only at the review's two sizes. Fewer scrolls, and the page holds still more often.

## What to try in the app

- At 1920 × 1080 (or a window that size), take the Tour from About. On the Oscillators card the page holds still, with Osc 1's Waveform and both Viewers in view. On the Filter card the card moves to the right: the Cutoff, Resonance and both Filter Viewers show, uncovered, through the sweep. On the Amp card it moves to the left: the faders, the Amp's Viewers and the Timeline all show, through each freeze. On the LFO card the page holds still and the card is back in the middle. It stays there on the last two cards.
- At 1440 × 900: the Amp card moves left, and its faders stay in view through each freeze. The other cards stay in the middle.
- Drag the card on the Filter card, then press Next: it stays where you put it. Double-click its top row: it goes back.
- On a phone: as before (the Amp's faders, then the Timeline, each in turn).

## Review (`/code-review` since 3278f17, 2026-11-07)

Fixed:
- **Spec:** a card moved aside, then dragged by the person, kept its aside if the window narrowed to a phone. Now a phone's pinned card drops it. An element within 12 px of the card's side counted as clear beside it while the card's placing counted it as covered; both now keep the same gap. The browser test sampled 7 s a card, which left out three Amp stages and the Resonance; it now samples each card's whole cycle.
- **Standards:** the browser test's sampling now runs inside the page, one `evaluate` a card, not a round trip each tenth of a second. The unit tests name their issue. A comment now names both window edges. Two names were made plainer.

Noted, not changed:
- Calls 1 to 3 above (the card's place against 230, the sweep's rhythm on small windows, the test helper).
- After Next, the previous card's place holds for about 50 ms, until the new card has its height and the page is measured again.
- The card's place is worked out in the Tour's card, next to its scroll, rather than in the docked cards' module. Only the Tour moves its card.
