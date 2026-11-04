# 154: The header's buttons in order

**What to build:** The owner's idea (inbox, 2026-10-31), on the header right of the keyboard as issue [112](./112-tempo-midi-clock-and-an-arpeggiator.md) left it (night/2026-10-31, about 1900 px wide: Hold, the BPM, Tap, MIDI, Display and About on top; Demo, Tutorial and Song under the last three): "Let's have a UI/UX expert help with how those buttons are stacked up. I personally hate the fact that they are not aligned and that there seems to be no logic to it. By the way, it's okay if the keyboard is not centered." Polish of v1's layouts ([131](./131-v1.md)).

**Blocked by:** [112](./112-tempo-midi-clock-and-an-arpeggiator.md), whose tempo and Tap are among the buttons; the owner's choice among the expert's proposals (below)

**Status:** done (2026-11-02). Built (2026-11-01) on night/2026-11-01 and released; tried by the owner: "Great." Its prototype branch, prototype/154-header, was deleted the same day, at the owner's word

## Questions for the owner

1. **Answered (2026-10-31): C.** **Which arrangement?** Each is drawn at 861, 1100, 1440 and 1920 px on the branch `prototype/154-header` (`prototypes/154-header/index.html`), beside today's header, the piano's keys measured under each:
   - **A, one line by use:** playing (Hold, the BPM, Tap) · learning (Demo, Tutorial, Song) · setting up (MIDI, Display, About), a hairline between, on one line from 1440 px and wrapped into two rows below; 32 keys at 1920 px, 20 at 1440 with only the newcomer's four words.
   - **B, two rows, what sounds over what opens:** Hold, the tempo, Demo, Song on top (they light when on); MIDI, Display, Tutorial, About below (they open a panel); a 4 × 2 grid at every width; 25 keys at 1440 px and 44 at 1920, every word kept.
   - **C, columns of two outward from the keys:** Hold one tall button against the piano, then the tempo (BPM over Tap), the players (Demo over Song), the guides (Tutorial over About), set-up (MIDI over Display), 4 px within a use and 14 px between uses; one shape at every width; 25 keys at 1440 px and 42 at 1920, every word kept.

   Claude's recommendation: C, the only one in which every column means something, one shape at every width, the newcomer's four keeping their words from 1100 px; its cost is Hold's tall shape, with B as the fallback.

## Decisions

Decided by the owner, 2026-10-31:

1. **A UI/UX expert** proposes how the buttons are arranged; the owner chooses.
2. **Aligned, with a logic** a person can see: the buttons line up in rows and columns, and what sits together belongs together.
3. **The keyboard need not be centred:** issue [82](./82-top-row-centres-the-piano.md)'s rule (the piano at the page's centre from 1200 px) no longer binds; the buttons' order comes first.
3b. **The keyboard extended where there is room,** in three and four across (the owner's idea, inbox, 2026-10-31: "In the 3-across and 4-across scenario, it may be a good idea to extend the keyboard if there is enough room.").

Claude's call, open to the owner:

4. **Two steps.** First the expert (an agent in the role of [42](./42-reviews.md)'s profile 3, the UI maniac, with the craft of a product designer) proposes two or three arrangements, each drawn with the `prototype` skill as a page of mock headers at 861, 1100, 1440 and 1920 px, with the logic of each in a line (for instance by use: playing — Hold, the tempo, Tap; learning — Demo, Tutorial, Song; setting up — MIDI, Display, About). The owner chooses in the morning. Then the chosen one is built at every width from 861 px, the design audit having the last word.
5. **From 861 px only:** the phone and 2 × 2 keep their own rows ([152](./152-the-phones-header-rows-in-2x2.md)).
6. **How the keyboard grows:** by whole keys, to the right, into the room the buttons leave, its white keys still at most 44 px; the computer keyboard's 17 keys keep their place and letters, and the keys beyond them play by pointer, touch or MIDI, and light for a Note from MIDI. Each of the expert's arrangements shows where it leaves the keyboard and how many keys that makes.
7. **Arrangement C**, columns of two outward from the keys: Hold one tall button against the piano, then BPM over Tap, Demo over Song, Tutorial over About, MIDI over Display; 4 px within a use and 14 px between uses; one shape at every width. Decided by the owner, 2026-10-31 ("I like recommendation C for the headers buttons"), on question 1.

## Agent Brief

**Category:** enhancement
**Summary:** Propose, then build, an arrangement of the header's buttons right of the keyboard in which they align and are grouped by a visible logic, at every width from 861 px, the keyboard extended into the room left.

**Current behavior:** From 861 to 1919 px the header's buttons right of the keyboard stand in two rows: Hold, the BPM, Tap, MIDI, Display and About on top, Demo, Tutorial and Song under the last three, right-aligned. The rows' buttons differ in width and do not share columns, and the grouping follows no rule a person can see. The layout keeps the piano at the page's centre from 1200 px.

**Desired behavior, step 1 (the proposals):** a throwaway prototype page showing two or three arrangements of the same buttons at 861, 1100, 1440 and 1920 px, each with its logic in a line and its trade-offs (width taken, words kept or icons alone, where the piano lands). The issue gets a "Questions for the owner" entry asking which, with Claude's recommendation, and its Status becomes `needs-info`. Nothing in the app changes in this step.

**Desired behavior, step 2 (the owner chose C, decision 7):** arrangement C, as the prototype draws it, is built at every width from 861 px: buttons aligned on a grid, grouped as chosen, the same height and spacing in a group; the piano wherever that leaves it, extended by whole keys into the room left (white keys at most 44 px; the letter keys' 17 in place, the others played by pointer, touch or MIDI). Tab order follows the visual order.

**Key interfaces:**
- The header's groups (playing, set-up, the tempo) and their layout rules from 861 px
- The design audit's widths and its header checks
- The prototype skill's throwaway pages

**Acceptance criteria:**
- [ ] Step 1: a prototype page with two or three arrangements at four widths, and a question for the owner with Claude's recommendation
- [ ] Step 2: the chosen arrangement at every width from 861 px, buttons on a shared grid, Tab order matching what is seen
- [ ] At 1440 and 1920 px the keyboard has more keys than today where the room allows; a key beyond the letter keys plays by pointer and lights for a MIDI Note
- [ ] The phone and 2 × 2 unchanged; the design audit passes; every test passes in Linux's fonts too

**Out of scope:**
- The header below 861 px ([152](./152-the-phones-header-rows-in-2x2.md))
- New buttons or new icons

## How it was built (2026-11-01, on night/2026-11-01)

**Measured first** (Chromium, the header as it stood after issues 136, 152 and 123, the buttons' real widths, padded 6 px): arrangement C takes 182 px with icons alone, 267 px with the newcomer's four words and 377 px with every word. That left the piano 331 px at 861 (10 white keys at 33 px, 26 to 30 px before), 425 px at 1100 with the newcomer's four (10 at 42.5 px), 629 px at 1440 and 1109 px at 1920 with every word. C fits as the owner chose at every width from 861 px; 136's "MIDI" mark and 123's words under the Patch change nothing in it.

**What was built:**
- **Arrangement C from 861 px** (`src/ui/App.tsx`, `src/styles.css`): Hold one button as tall as both rows, against the piano, its icon over its word; then the tempo (BPM over Tap), the players (Demo over Song), the guides (Tutorial over About), set-up (MIDI over Display). 4 px between the columns of one use, 14 px between uses; in a column both buttons as wide as the wider, icon and word from the left (the BPM and Tap centred). Rows of 25 px, 2 px apart, up to 1099 px; of 28 px, 4 px apart, from 1100 px. One shape at every width: the one row from 1920 px is gone. The DOM follows the columns, top before bottom, so Tab meets Hold, the BPM, Tap, Demo, Song, Tutorial, About, MIDI, Display in that order.
- **Words while there is room:** from 861 to 1099 px icons alone and the BPM its number (as before); from 1100 px Demo, Song, Tutorial and About keep their words; from 1280 px every button keeps its word and the BPM its unit.
- **The piano grows by whole keys** (`src/ui/pianoKeys.ts`, `src/ui/hooks/usePianoFit.ts`, `src/ui/Piano.tsx`): from 861 px the keyboard takes the room the Patch and the buttons leave, measured as the window changes. The letter keys' 10 white keys share it up to 44 px each; one more white key is added whenever the room holds more than half of one, so once there are more than 10 they are 42 to 44 px. The keys go on upward from E5, the black keys between, ending on a white key and never past the highest MIDI Note (G9); near the top, where fewer keys are drawn, the piano is as wide as the keys it draws, its keys as wide as before. What is left, under one key, opens between the Patch and the keyboard, so the keyboard always meets Hold at the header's gap. The letter keys keep their place and letters; the keys beyond play by pointer, touch or MIDI and light for a Note from MIDI. Measured in Chromium: 17 keys at 861 to 1000 px, 18 at 1280, 25 at 1440, 44 at 1920.
- **The old rules gone:** the piano centred (issue 82's empty column from 1200 px and its 42 px keys from 1200 to 1365 px), the two rows set-up over Demo, Tutorial and Song, and the Patch name taking its column's spare room (issue 105): the name keeps its fixed width and the room goes to the keys.
- **Tests:** `src/ui/pianoKeys.test.ts` (red before the module): how many white keys a room holds and how wide, never wider than 44 px nor under 42 once more than 10; the Notes beyond the letter keys, following the octave and stopping at G9. `e2e/header.spec.ts`: at 861, 1100, 1440 and 1920 px the columns, each pair one over the other and as wide, their tops on one line, Hold as tall as both rows, the 4 and 14 px gaps, the header no taller than 64 px, which words show, no sideways scroll; at 1440 and 1920 px more keys than 17, each 42 to 44 px, the keyboard against Hold; at 861 and 1100 px 10 white keys of at least 30 and 40 px; the Tab test passes column by column. Run in Chromium and WebKit: the header, piano, About, toolbar, Display panel, design audit, tempo and MIDI clock specs pass, and the rest of the header's (holdRhythm, tutorial, tooltips, patches and others) in both. `e2e/song.spec.ts`'s first test fails at the tip too, before this change (the Patch reads as changed after the Song, its words showing under the name). at the top octave the piano ends on G9, its keys as wide, still against Hold (found by the review: it left a gap against Hold before). `e2e/piano.spec.ts`: at 1440 px C6, past the letter keys, plays by pointer and lights for a MIDI Note. Tests that asked for the old layout (the piano at the centre, 17 keys at 1440 and 1920, About's word from 1366 px, the name's spare room) now ask for this one.
- **Room for Bead under the header** (found 2026-11-01, after 179): from 861 px the columns and the keys reach down to the header's foot all along the top right section, where before 1920 px's buttons stood 46 px over its edge; the sections start 28 px under the header, and Bead standing and playing reaches 35 px over its edge (its 26 px stretched 10 % by the sound, then its 6 px hop at a Note, or its step's 1 px bob as it strolls), so in three and four across its head went over Hold, Tap, Song, About and the keys' feet (`e2e/mascot.spec.ts`'s four across test failed 6 runs in 8 in Chromium, from this issue's first commit; it passed 8 in 8 at the commit before). In windows from 861 px wide and 700 px tall the sections now start 36 px under the header (`src/styles.css`), the Viewers 8 px shorter. Its funny turns and gestures (a hop of 12 px, a tickle) still brush past the header, as its leaps always have; the four across test passes 12 runs in 12 (three across 5 in 5, in WebKit too), and the mascot, header, fits-the-screen and layout specs in Chromium and WebKit.
- **Docs:** "Since then" lines on [44](./44-header-across-layouts.md), [82](./82-top-row-centres-the-piano.md), [105](./105-header-and-panels-on-every-screen.md), [112](./112-tempo-midi-clock-and-an-arpeggiator.md) and [136](./136-following-midi-clock.md); for the room under the header, on [123](./123-a-patch-in-plain-words.md) and [179](./179-beads-tail-trails-behind.md).

**Claude's calls, open to the owner:**
1. **Where the words go:** at fixed widths (1100 and 1280 px), not measured live as the prototype did, so the header does not change while it is used. From 1100 to 1279 px the newcomer's four keep their words and the Patch name keeps its 134 px; there the piano's keys are 42 px at 1100 in Chromium, a little under in Linux's wider fonts.
2. **No cap on the keys:** from 1920 px the page grows to 2560 px, and the piano with it: 68 keys at 2560 px, up to G9. An octave up there shortens it, as the keys stop at G9.
3. **Crossing 860 px** rebuilds the buttons' groups, so an open MIDI, Display or Tutorial menu closes there (only when a window is resized across that width).
4. **The column widens while the BPM is typed in, or while the MIDI button shows a device count or Learning,** as the row did before; the piano may then gain or lose a key until it narrows again.
5. **The room for Bead is made in the page, not in Bead:** the sections 8 px lower, rather than Bead not hopping or stretching under the header (its liveliness kept) or living elsewhere than the top right section. Below 700 px tall, where the page scrolls, the sections stay 16 px under the header, less than Bead's own 26 px: there it reaches over the header's foot as it did before this issue, and over this issue's buttons too.

**To try in the app:** the header at 861, 1000, 1100, 1280, 1440 and 1920 px (and wider): the columns line up, Hold tall against the piano, the words as above, the keyboard reaching the buttons. Play a key past E5 with the pointer and from a Controller; move the octave up and down. Tab through the header. Turn on Hold and a player, so the tall Hold and the BPM's player state show.

## Since then

- **The calls beyond the Brief accepted** (the owner, 2026-11-03, answering [191](./191-the-owners-calls-after-1-21.md)): the Sections lowered and the Viewers 8 px shorter from 861 px wide and 700 px tall, for Bead.
