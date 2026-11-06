# 188: The UI maniac's five on 1.21.1

**What to build:** Review 3's findings on 1.21.1 ([report](../reviews/2026-11-02/3-ui-maniac.md), with screenshots): MIDI Learn's widened tile pushes Hold over Song on a phone; the MIDI panel and the Tutorial menu open over the header's bottom row while Display's opens under it; the Synth Geek formulas run across the spectra's bars; the header's buttons do not line up with the piano from 900 px; a long description squashes the Tutorial menu's icon.

**Blocked by:** none

**Status:** done (2026-11-03). Built (2026-11-02) on night/2026-11-02, merged into main, not yet released; tried by the owner: "All good."

## Decisions

Claude's call, open to the owner (2026-11-02): in v1 as polish ([131](./131-v1.md)), from the six reviews of 1.21.1.

1. **One rule for where a header panel opens:** under the header, as Display's does.
2. **Formulas never over data:** a formula sits where no bar or trace is drawn, or its Viewer leaves it room.

## Agent Brief

**Category:** bug
**Summary:** Five layout slips: an overlap during MIDI Learn on phones, two anchoring rules for header panels, formulas over the spectra's bars, header buttons off the piano's line, and squashed icons in the Tutorial menu.

**Current behavior:** At 320–375 px the "MIDI Learning" tile widens to 65 px and pushes Hold over Song (15 px overlap at 375); from 861 px it reflows the header and drops a key. From 861 px the MIDI panel and the Tutorial menu open from the header's top row, over its bottom row and last keys; Display's opens under the header. With the Geek Layer on, "bₙ = 2 / (π n) …" and "|H| = 1 / √…" run across the A4, 2 and 3 bars (375 px WebKit; at 1440 px the Osc line ends on the A4 bar). From 900 to 1099 px the header buttons' top drifts 16 → 22 px against the keys' 16; from 1100 px they sit 2 px inside the keys; the keyboard–Hold gap is 12 px at 926–1277 and 8 px elsewhere. A long Tutorial description shrinks the mortarboard to 9.7 px.

**Desired behavior:** MIDI Learn's tile keeps its width (the word shortened as 156 does), nothing moves or overlaps at any width. Every header panel opens under the header. The Geek formulas sit clear of the bars and traces at every width. The header buttons' top and bottom match the keys', with one gap to the keyboard. The Tutorial menu's icons keep their size and the names one start.

**Key interfaces:**
- The header's layouts and the MIDI Learning tile
- The header panels' placing
- The Viewers' Synth Geek formulas
- The Tutorial menu

**Acceptance criteria:**
- [x] The header spec checks no overlap with MIDI Learn on at 320–1920 px
- [x] The design audit checks each header panel opens under the header, and the formulas clear of the bars
- [ ] Every test passes in Linux's fonts too

**Out of scope:**
- The header's order (issue 154)

## Added in triage (2026-11-02)

- From the 1.20.0 code review: issue 175 hides only the opener's own tip, so tips inside an open Display, MIDI or Patches panel still show over its rows (likelier with 162's four settings on one row); 153's × tip relies on the Patches panel's tips, so the two issues' words disagree. No tip of a control under an open panel; a panel's own controls keep theirs.

## How it was built

Built on 2026-11-02, on night/2026-11-02. The layouts were measured first at 320 to 1920 px: every finding reproduced as review 3 measured it, and each had room to be fixed.

- **MIDI Learn's word:** "Learning" lies over the MIDI word and the Controller count, which keep their places unseen, so the button never widens. It takes the longest of Learning, Learn and Lrn that fits on one line in that room (issue 156's measuring; a row in CONTEXT.md's Short forms). From 1280 px the room also takes what the button has spare in its column. At 375 px it reads "Lrn", at 1440 "Learn". The header's buttons and keys stay exactly where they were at every width from 320 to 1920 px.
- **Header panels:** the MIDI panel, the Tutorial menu and a narrow screen's Tempo field open 6 px under the header, as Display's and the Patches panel do. Each keeps its side along its button, and its top is measured from the header's foot. Since 2026-11-03 (the 1.23.0 code review): measured again when the window's size changes, and for a panel drawn again while open (a narrow Tempo after an iPad's turn to landscape and back, which dropped under its button, over the keys, and no longer closed on Tab out); the panels' closing rules read the wrapper on the page at each event.
- **The header's buttons:** they stand as tall as the piano, their tops and bottoms the keys', at every width from 861 px. Their two rows share its height, 2 px apart up to 1099 px and 4 px from 1100. The keyboard meets Hold 8 px away at every width.
- **The Tutorial menu:** each mortarboard keeps its 14 px, and the names start on one line.
- **Geek formulas:** each sits in a row of its own under its stage's Viewers, clear of every bar and curve. With the layer on, every stage has that row, a formula in it or not, so the Viewers keep one size across the stages (85 px each at 1440 × 900, 89 before).
- **Tips under an open panel** (added in triage): while a header panel is open (Patches, Display, MIDI, Tutorial, Tempo), only its own controls show their tips.
- **Tests:** in the header spec, MIDI Learn on at 10 widths from 320 to 1920 px: nothing in the header moves, nothing overlaps, and the word is on one line where it shows. A sweep from 861 to 1920 px checks the buttons against the keys and the 8 px gap. The design audit gains each header panel under the header and the formulas clear of the Viewers, the Viewers one size, at its six sizes. The Tutorial spec checks the icons and the names' start. The tooltip spec checks the panel rule. The unit test covers Learning's short forms. Each was red before its fix.
- **Run:** `npx tsc`, `npm run lint`, the UI unit tests (325 passed). In Chromium (382 passed) and WebKit (367 passed, 15 skipped): the header, design audit, Tutorial, tooltip, touch tips, Geek, MIDI Learn, Quick Setup, Display panel, Tempo, fits-screen, one-line, Patches, keyboard access, piano, in-between, four-across, layout polish and toolbar layout specs. After the review, tooltip and Geek again in both. Not run in Linux's fonts here: GitHub's run is the first in them. Its likeliest catch is the MIDI word's one-line check.

**Calls made (Claude's call, open to the owner):**

1. **Where the MIDI button shows its icon alone (861 to 1279 px), Learn shows no word.** The icon pulses in the accent there and the Learn bar says it. The shortest form, "Lrn", is wider than the room there (the count's, or none).
2. **"Lrn" as the shortest form**, at phone widths, where "Learn" does not fit under the icon.
3. **The formulas leave the plot** rather than look for a clear corner in it, since the bars move with every Note (decision 2's "or its Viewer leaves it room"). The Viewers lose the formula's height while the layer is on. On a phone the Amp, which has no formula, keeps a 12 px gap where the row would be.
4. **The tip rule is wider than "under":** while a header panel is open, a tip shows only for that panel's own controls. Tips of the header's other buttons and of the page's controls stay off until it closes, since one shown beside the panel can lie over its rows. The Preset description's × (issue 153) is outside the Patches panel, so its tip waits too while the panel is open; it comes back as the panel closes.

**To try:**

- **MIDI Learn on a phone (375 px):** with a Controller, press MIDI Learn. The MIDI button reads "Lrn" in the accent; Hold, Song and every other button stay put. At 1440 px it reads "Learn", and the piano keeps its keys.
- **The panels (861 to 1920 px):** open MIDI, then Tutorial. Each drops just under the header, its buttons and keys free beside it, as Display's does. On a phone, Tutorial and Tempo do the same.
- **The header (900 to 1300 px):** widen the window slowly. The buttons' tops and bottoms stay on the keys', and the gap to Hold stays 8 px.
- **The Tutorial menu:** the mortarboards are one size.
- **The Geek Layer:** turn it on in Display. The formulas sit under the Spectrums, at 375 and at 1440 px.

**Since then (2026-11-05, [235](./235-the-viewers-geek-maths-into-the-tips.md)):** no Viewer draws a formula; with the Synth Geek Layer on, each sits in its control's tip (the Waveforms, Osc 1's Pitch heading for FM, Ring, the Filter Mode and Slope).
- **The tips:** with a panel open, hover a button outside it (no tip), then a control inside it (its tip).
