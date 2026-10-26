# 44: One header across the layouts

**What to build:** The phone's header (issue 29) is the polished one: the Patch on the first row, the playing row under it, a piano big enough to play by touch, and the rows above the piano sliding away as the page scrolls. From 601 px up the header is the laptop's, cramped into one or two lines: the piano is 200 × 40 px at every width up to 2560, and the buttons sit in a different order on each layout. Give the wider layouts the phone's structure, with the computer keyboard's full range (17 keys, C to the E above), and the same order of buttons everywhere. From the owner, 2026-10-26.

**Blocked by:** none

**Status:** proposed, decisions open (below).

## What there is (measured 2026-10-26)

- **Phone (up to 600 px):** three rows, 173 px. The Wordmark and the Patch; Demo, Song, Hold on the left and MIDI, Display, About on the right, each an icon over its word; then the octave buttons stacked beside the piano, eight white keys across the screen (about 42 × 64 px each). Scrolling down leaves only the piano.
- **2 × 2 (601 to 860 px):** the Wordmark, the Patch, and Demo, Song, Display, About as bare icons on one row; on a second, centred, octave −, the 17-key piano at 200 × 40 px, octave +, Hold and MIDI. The page scrolls (at 780 × 900, Amp and LFO & Envelopes are below the fold), and the header scrolls off with it, piano included: playing while looking at the Amp means scrolling back up.
- **Three and four across (861 px up):** one 40 px row: the Wordmark and the Patch, then −, piano, +, Hold, MIDI in the centre, then Demo, Song, Display, About. The piano is 200 × 40 px, even on a 2560 px screen. The whole instrument fits the screen: at 1440 × 900 each Viewer is 425 × 122, over a floor of 248 × 78.

## Proposal

- **One order everywhere**, the phone's, read left to right: the Wordmark and the Patch; playing (Demo, Song, Hold); the octave buttons and the piano; set-up (MIDI, Display, About). Hold moves from beside MIDI to beside Song on the wider layouts.
- **2 × 2:** the phone's header, with the 17-key piano at the phone's key size (white keys about 42 × 64 px, so about 420 px wide plus the octave buttons). With 601 px or more, the Patch and the buttons fit on one row, so two rows rather than three: identity and buttons, then the piano. The header stays at the top as on a phone, and scrolling down slides the first row away, leaving the piano.
- **Three and four across:** no sliding (nothing scrolls). The same piano as 2 × 2, in the centre of a single, taller row: the Wordmark and the Patch, Demo, Song, Hold, then −, piano, +, then MIDI, Display, About. The row grows from 40 to about 64 px; at 1440 × 900 that takes about 12 px from each of a stage's two Viewers (122 to about 110, floor 78).

## Decisions open

- [ ] 2 × 2: two rows (buttons beside the Patch) or the phone's three (buttons on their own row, icon over word)?
- [ ] Three and four across: the piano inside the one row (taller row), or a second row of its own under it (more height gone from the Viewers)?
- [ ] Does the piano grow past the 2 × 2 size on the widest screens, or stay at it everywhere above 600 px?
- [ ] Touch targets in 2 × 2: issue 38 left open whether a foldable gets the phone's targets; this issue settles it for the header at least

## To build, once decided

- [ ] The header's order the same at every width, in the DOM as on screen (focus order follows)
- [ ] 2 × 2: the phone's piano size with 17 keys, the octave buttons beside it, the rows above sliding away on scroll (reduced motion: no slide)
- [ ] Three and four across: the larger piano, the whole instrument still on screen at 1440 × 900, 861 × 700 and 1920 × 1080 (`e2e/inBetweenLayout.spec.ts`, `e2e/fourAcross.spec.ts`), the Viewers at or above their floor
- [ ] The design principles' audit (contrast, targets) at a phone, a foldable and a laptop size
