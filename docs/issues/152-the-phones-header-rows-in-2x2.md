# 152: The phone's header rows in 2 × 2

**What to build:** The owner's idea (inbox, 2026-10-31): "Even in 2x2 use the three rows approachs as for the phone with the same automatic collapsing of two top rows". Polish of v1's layouts ([131](./131-v1.md)).

What is there today: up to 860 px the header is sticky, and scrolling down slides away what sits above the keyboard (issues 29 and 44). On a phone (up to 600 px) it has three rows: the logo with the Patch picker; the playing buttons with the set-up buttons; the keyboard. Scrolling down hides the top two, so only the keyboard stays. In 2 × 2 (601 to 860 px) it has two rows: the logo, the Patch picker and every button squeezed into one row (short Preset names barely fit, issue 105), then the keyboard; scrolling down hides that one row. Issue [112](./112-tempo-midi-clock-and-an-arpeggiator.md) (built on night/2026-10-31) adds the tempo to the set-up buttons and has to pad the header's buttons tighter from 601 to 680 px to make room.

**Blocked by:** [112](./112-tempo-midi-clock-and-an-arpeggiator.md), which changes the header at these widths

**Status:** ready-for-human · enhancement. Built (2026-11-01) on night/2026-11-01, for the owner to try. Polish for v1.

## Decisions

The idea is the owner's (decided by the owner, 2026-10-31); how it is done is Claude's call, open to the owner:

1. **Three rows from 601 to 860 px,** as on a phone: the logo and the Patch picker (its name as wide as the row allows); the playing buttons on the left and the set-up buttons, the tempo among them, on the right; the keyboard.
2. **The same collapsing:** scrolling down slides the top two rows away so only the keyboard stays; any scroll up brings them back, as on a phone.
3. **What stays 2 × 2's own:** the keyboard keeps its 2 × 2 width and keys (more than a phone's one octave where the width allows), and the buttons keep their words beside or under their icons where they fit; no section strip (every section is on screen at once in 2 × 2, as now).
4. **112's squeeze undone at these widths:** with a row of their own, the buttons no longer need the tighter padding from 601 to 680 px, and the tempo shows as the phone's or as a field beside its Tap, whichever fits (the design audit has the last word).

## Agent Brief

**Category:** enhancement
**Summary:** From 601 to 860 px (the sections 2 × 2), the header takes the phone's three rows, and scrolling down hides the top two as on a phone.

**Current behavior:** From 601 to 860 px the header has two rows: logo, Patch picker, playing and set-up buttons in one row, the keyboard under it. Scrolling down hides the top row. The buttons and the Patch name are squeezed (tighter padding from 601 to 680 px; short Preset names only just fit).

**Desired behavior:** From 601 to 860 px the header has three rows, as on a phone: the logo with the Patch picker; the playing buttons and the set-up buttons (the tempo with them); the keyboard. Scrolling down slides the top two rows away until only the keyboard shows, and any scroll up brings them back, measured as on a phone. The keyboard keeps its 2 × 2 size; the buttons keep their words where they fit; the squeeze from 601 to 680 px goes. Everything that places itself under the header (a Tutorial's card, the jump to a section the Demo follows, the Tour's "bring into view") still lands under it, collapsed or not.

**Key interfaces:**
- The header's layout rules for phones and for the sections 2 × 2 (grid areas, rows)
- The header's collapse on scroll and its measured hide height
- What measures the header's bottom (the docked cards, bringing a control into view)
- The design audit's widths

**Acceptance criteria:**
- [ ] At 601, 700 and 860 px: three header rows, the Patch name wider than today's
- [ ] Scrolling down hides the top two rows; scrolling up brings them back; nothing below moves
- [ ] A Tutorial Step, the Tour and the Demo bring their control into view under the collapsed or the full header
- [ ] The phone (up to 600 px) and three across (from 861 px) unchanged
- [ ] The design audit passes at every width; every test passes in Linux's fonts too

**Out of scope:**
- A section strip in 2 × 2
- The header from 861 px up

## How it was built (2026-11-01, on night/2026-11-01)

**Measured first** (Chromium, the header as it stood after issues 136 and 123): from 601 to 860 px the header was 137 px tall in two rows, the Patch name 110 px wide at 601, 165 at 700 and 240 at 860, its rows above the piano 60 px; on a phone 173 px in three, 96 px of it above the piano.

**What was built** (`src/styles.css`, and one line of `src/ui/SectionStrip.tsx`):
- **One layout up to 860 px:** the phone's three rows are now the rule for every width up to 860 px, the logo and the Patch; the playing buttons on the left and set-up on the right; the keyboard. 2 × 2 keeps only its own margins, its 17 keys and no section strip. The header is 173 px tall there, as on a phone, and collapsed it leaves the same 77 px of keyboard as before.
- **The Patch name takes the row beside the logo:** 384 px at 601, 483 at 700, 643 at 860; every Preset's name shows whole from 601 px, and more of the Patch's plain words (issue 123) show under it.
- **The squeeze undone:** the buttons pad 6 px as on a phone (4 px in 2 × 2 before, 2 px from 601 to 680 px since issue 112), the logo and the Patch sit 12 px apart (8 before). The 2 px rule now holds only under 375 px (issue 157).
- **The collapse** was already measured from the piano's top, so scrolling down now hides 96 px, the top two rows. The Tutorial's card and the Tour already place a control by the header as measured (`headerBottomAt`), collapsed or not.
- **The Demo's follow in 2 × 2** (and a MIDI bank's, which shares it): a section counted as in view when its top was anywhere on screen, under the header too, so a section the Demo turned a knob in could stay under the header, now three rows tall. It now counts as out of view while its top is under the header, and is brought into view below it (the sections' scroll margin, the header's full height).
- **Tests** (`e2e/header.spec.ts`): at 601, 700 and 860 px three rows, the Patch name reaching the row's end and wider than before, every button on one row, a finger tall, Demo at the left and About at the right, the 17 keys, nothing over anything, no sideways scroll (red before the change at all three); the same widths, scrolling down hides the logo and the buttons, the header keeps its height and the Sections their place, scrolling up brings them back; at 601 and 860 px every Preset's name whole (it was Init, Kick, Bass and Acid at 601). `e2e/demo.spec.ts`: at 700 px, the Filter 60 px under the full header, the Demo's first scroll lands the Filter's top below it (red before: the page did not scroll for the Filter, only for a later part).
- **Docs:** "Since then" lines on [112](./112-tempo-midi-clock-and-an-arpeggiator.md) (the 601 to 680 px padding), [105](./105-header-and-panels-on-every-screen.md) (the 2 × 2 Patch name and padding) and [157](./157-no-narrower-than-a-phone.md) (the shared narrow rule).

**Claude's calls, open to the owner:**
1. **The Patch name as wide as the whole row**, as decision 1 says: at 860 px a 643 px button with the name in its middle. A cap (the phone's 240 px, which it already was at 860) would leave the row's right half empty and miss "wider than today's" at 860.
2. **The tempo as the phone's:** the BPM button, icon over word, opening the small field with Tap. A field beside its Tap would be 32 px tall beside 44 px buttons, and the phone's already fits with room to spare (about 230 px at 601).
3. **The design audit's widths stay as they were** (690 px for 2 × 2): the new header tests run its overlap rule at 601, 700 and 860 px, and the whole audit (contrast in both themes, targets) passed once at 601 and 860 px too, not kept as tests.

**Tests run:**
- `npx tsc`, `npm run lint`, `npx vitest run src/ui/sections.test.ts` (the stylesheet's breakpoint): pass.
- Chromium: the header, in-between, layout polish, Tutorial, Tour, docked cards, Demo, design audit, tempo, MIDI clock, Patches, Patch search, section strip, fits the screen, toolbar, Bead, About, touch tips, tooltips and keyboard specs: 384 passed. WebKit, the same: 366 passed, 16 skipped, 3 failed under a load of 15 to 18 (the audit's light contrast at 280 px, two of Bead's), all three green rerun alone: load flakes, untouched.
- After the review's fixes, both browsers: the Demo, header, MIDI Learn, C16 card, Display panel, in-between and section strip specs, 220 passed, 6 skipped.
- Verdana standing in for Linux's fonts (Chromium): the header spec (every Preset's name whole at 601 and 860 px among it) and the audit's targets and overlap at 601, 690 and 860 px pass. Real Linux fonts only on GitHub's run.
- The code review (standards and spec, since `bf1bfbe`). Fixed: the Demo's follow in 2 × 2 (above); a "Since then" line on issue 44; the spec's comments say what is, its new locators by role, a clearer name. Not changed: the audit's widths (call 3).

**To try in the app:**
- Narrow the window to between 601 and 860 px (or a tablet in the browser's device mode): the logo and the Patch on the first row, Demo, Tutorial and Song on the left of the second, Hold, the BPM, MIDI, Display and About on its right, the 17-key keyboard under them.
- Scroll down: the two top rows slide away, only the keyboard stays; any scroll up brings them back.
- Start a Tutorial, the Tour and the Demo there, scrolled down and at the top: each control they point at shows under the header. For the Demo, scroll so the Filter's top sits just under the header, then press Demo: the page brings the Filter out from under it.
- Load a long Preset (Split Octave Bass), then turn a knob: the name whole, its plain words under it.
