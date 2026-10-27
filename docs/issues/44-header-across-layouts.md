# 44: One header across the layouts

**What to build:** The phone's header (issue 29) is the polished one: the Patch on the first row, the playing row under it, a piano big enough to play by touch, and the rows above the piano sliding away as the page scrolls. From 601 px up the header is the laptop's, cramped into one or two lines: the piano is 200 × 40 px at every width up to 2560, and the buttons sit in a different order on each layout. Give the wider layouts the phone's structure, with the computer keyboard's full range (17 keys, C to the E above), and the same order of buttons everywhere. From the owner, 2026-10-26.

**Blocked by:** none

**Status:** done (2026-10-26): the owner tried the new header and approved it. The four decisions went with the proposal.

## What there is (measured 2026-10-26)

- **Phone (up to 600 px):** three rows, 173 px. The Wordmark and the Patch; Demo, Song, Hold on the left and MIDI, Display, About on the right, each an icon over its word; then the octave buttons stacked beside the piano, eight white keys across the screen (about 42 × 64 px each). Scrolling down leaves only the piano.
- **2 × 2 (601 to 860 px):** the Wordmark, the Patch, and Demo, Song, Display, About as bare icons on one row; on a second, centred, octave −, the 17-key piano at 200 × 40 px, octave +, Hold and MIDI. The page scrolls (at 780 × 900, Amp and LFO & Envelopes are below the fold), and the header scrolls off with it, piano included: playing while looking at the Amp means scrolling back up.
- **Three and four across (861 px up):** one 40 px row: the Wordmark and the Patch, then −, piano, +, Hold, MIDI in the centre, then Demo, Song, Display, About. The piano is 200 × 40 px, even on a 2560 px screen. The whole instrument fits the screen: at 1440 × 900 each Viewer is 425 × 122, over a floor of 248 × 78.

## Proposal

- **One order everywhere**, the phone's, read left to right: the Wordmark and the Patch; playing (Demo, Song, Hold); the octave buttons and the piano; set-up (MIDI, Display, About). Hold moves from beside MIDI to beside Song on the wider layouts.
- **2 × 2:** the phone's header, with the 17-key piano at the phone's key size (white keys about 42 × 64 px, so about 420 px wide plus the octave buttons). With 601 px or more, the Patch and the buttons fit on one row, so two rows rather than three: identity and buttons, then the piano. The header stays at the top as on a phone, and scrolling down slides the first row away, leaving the piano.
- **Three and four across:** no sliding (nothing scrolls). The same piano as 2 × 2, in the centre of a single, taller row: the Wordmark and the Patch, Demo, Song, Hold, then −, piano, +, then MIDI, Display, About. The row grows from 40 to about 64 px; at 1440 × 900 that takes about 12 px from each of a stage's two Viewers (122 to about 110, floor 78).

## Decisions open

Decided by the owner on 2026-10-26, all four as proposed:

- [x] 2 × 2: two rows, the buttons beside the Patch
- [x] Three and four across: the piano inside the one row, which grows taller
- [x] The piano stays at the 2 × 2 size (white keys 44 px) everywhere above 600 px, never larger
- [x] Touch targets in 2 × 2: the header's buttons get the phone's (44 pt tall, icon over word); the sections keep the laptop's controls

## Built

- [x] The header's order the same at every width, in the DOM as on screen (focus order follows): the header holds four groups (`.header-identity`, `.header-play`, `.keyboard`, `.header-right`) and each layout only places them. `e2e/header.spec.ts` checks the order at a phone, a foldable, a laptop and a wide size
- [x] The keyboard the same everywhere: the octave buttons stacked (up over down) left of the piano, as on a phone. The piano's white keys share what the layout gives it, up to 44 px, and grow taller with it (52 to 64 px)
- [x] 2 × 2: the 17 keys at 44 × 64 px; the header sticky, its first row sliding away on scroll as on a phone (reduced motion: no slide); a section the Demo brings into view lands below it
- [x] Three and four across: the piano in the one row. Its column takes what the sides leave, so below 1300 px the header's buttons drop their words (icons and tooltips), in one step where it was three (1045, 1120, 1200 px). White keys: 29 px at 861, 33 at 1000, 43 at 1100, 44 from about 1300
- [x] The whole instrument still on screen where it was: at 1440 × 900 the Viewers go from 122 to 110 px. Short windows that already scrolled (861 × 700: 838 px of page, 1000 × 800: 827) scroll 12 to 24 px more
- [x] The design principles' audit: the piano's keys meet the 24 px target on laptop, foldable and wide screens (44 and 26 px), so their three waivers are gone; the phone's stays
- [x] Tried by the owner (2026-10-26): "New header looks good"
