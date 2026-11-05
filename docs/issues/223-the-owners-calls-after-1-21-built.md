# 223: The owner's calls after 1.21, built

**What to build:** The answers to [191](./191-the-owners-calls-after-1-21.md) (the owner, 2026-11-03) that change the app or need research: its decisions 6, 7, 9, 11 and 12. Polish for v1 ([131](./131-v1.md)). Decision 13 (aftertouch on the Resonance) went to [219](./219-aftertouch-glides.md).

**Blocked by:** none

**Status:** done (2026-11-04). Built (2026-11-03) on night/2026-11-03, merged into main, not yet released; accepted by the owner, tried in part and the rest trusted: "All issues waiting on my feedback look fine, I tested some, others trust you." The DX7 manual (call 6) stays found but not read, its download waiting on the owner's go-ahead; Key and Vel as built (call 1).

## Decisions

Decided by the owner, 2026-11-03 (191's numbers):

1. **(191.7) Short forms "Key" and "Vel":** Key Track and Velocity take them where the room is measured short, as 156 picks the others; the header keeps 154's fixed widths.
2. **(191.9) A button learned on a Switch flips it on each press,** a momentary button or a toggle alike: LFO Sync, Legato, Retrigger.
3. **(191.11) The BPM's keys as every knob's:** the arrows 1 BPM, Shift+arrow a tenth, Page Up and Down 10; the tempo's tip gets the steps line.
4. **(191.12) "Tap Tempo" off screen:** the button keeps its word "Tap" on screen; the glossary, the code and the tips say "Tap Tempo", the Taps staying the listening points.
5. **(191.6) The DX7's primary source found:** FM's History line keeps naming it (134, decision 9); a primary source, Yamaha's own DX7 documents, is found and cited so the fact meets 134's decision 5.

## Agent Brief

**Category:** enhancement
**Summary:** Five small changes the owner settled on 2026-11-03, each built and tested on its own commit.

**Current behavior:**
- Key Track and Velocity keep their whole names where the room is short.
- A pad or button learned on a Switch never switches it: Learn reads its 127 and 0 as a knob's.
- In the tempo field, Shift+arrow moves the BPM 10, where Shift is the fine step everywhere else; the tempo's tip has no steps line.
- "Tap" names both the tempo's button and the listening points in the glossary, code and tips.
- FM's History line names the DX7 on a fact graded C, without a primary source.

**Desired behavior:**
- "Key" and "Vel" where the room is measured short.
- Each press of a button learned on a Switch flips it, a momentary button's release doing nothing; a toggle button's two messages each flip it once.
- The BPM: arrows 1, Shift+arrow 0.1, Page Up and Down 10, and a steps line in its tip like a knob's.
- "Tap Tempo" in the glossary, the code and the tips; "Tap" on the button.
- The DX7 fact cited to a primary source in the History research, or, if none is found, the line and the owner told.

**Key interfaces:**
- The short forms and their measuring
- MIDI Learn and a Mapping on a Switch
- The tempo field's keys and its tip
- The glossary, the tips, the code's names
- The History research and FM's line

**Acceptance criteria:**
- [x] At the widths where 156 shortens, Key Track and Velocity read "Key" and "Vel" (browser test): where their row runs short, which in Mac fonts it never does (How it was built, call 1)
- [x] A momentary and a toggle button learned on LFO 1 Sync each flip it once a press (unit and browser tests)
- [x] The tempo's keys move 1, 0.1 and 10 BPM; its tip has the steps line (browser test)
- [x] No "Tap" for the tempo left in the glossary, the tips or the code's names; the button still reads "Tap"
- [ ] The DX7's source cited, its grade raised, or the owner told none was found: found, not yet read (call 6)

**Out of scope:**
- The header's words (154's rule)

## How it was built

Built on 2026-11-03, on night/2026-11-03, a commit each.

- **"Key" and "Vel"** (decision 1): Key Track → Key and Velocity → Vel join the short forms, in the code and CONTEXT.md. A knob's column is as wide as its name, so a knob's name runs short only when its row would wrap a control to a second line. Each row of knobs and faders now measures that and steps all its names down together, as the Timeline's key does, so a wider font (Linux's, a larger text setting) shortens them before a knob wraps. Tests: `shortForms.test.ts`; `e2e/oneLine.spec.ts`, the Filter's row in a wider font at 320, 861 and 1024 px reads Key and Vel on one line, whole in Mac fonts.
- **A button on a Switch** (decision 2): MIDI Learn hears a control on LFO Sync, Retrigger or Legato as a button, as on an Action. A release within half a second makes it momentary (each press flips the Switch, the release does nothing); one message alone makes it a toggle (each message flips it); a pad's Note flips it on each hit. Tests: `controlSurface.test.ts`; `e2e/midiLearn.spec.ts`, a toggle and then a momentary button learned on LFO 1 Sync.
- **The BPM's keys** (decision 3): the arrows 1 BPM, Shift+arrow 0.1, Page Up and Down 10, and the tip's steps line, "↑↓ 1 BPM · Shift 0.1 BPM · Page 10 BPM". The tempo is now kept, remembered and shown to a tenth, and its box is as wide as "238.8" at every BPM, so the header doesn't move. Tests: `tempo.test.ts`, `tempoStore.test.ts`, `controlSurface.test.ts`; `e2e/tempo.spec.ts`.
- **Tap Tempo** (decision 4): the button still reads "Tap". Its accessible name, its tip, its Action (the MIDI panel, the Learn bar, Quick Setup), the glossary (a new Tap Tempo entry; Tap is the listening points only), the code's names and comments all say Tap Tempo. A Mapping stored under the old Action id `tap` loads as `tapTempo`. Tests: `mappings.test.ts`; `e2e/tempo.spec.ts`, plus the specs that found the button by name.
- **The DX7's primary source** (decision 5): Yamaha's own manual library lists the *DX7 Operating Manual*, as a scan and as a text version. It is recorded in the History research as S34, but it has not been read (call 6). FM's line is unchanged and still rests on Yamaha's own Hub page (S33, graded B, from 194).
- Review: the code review found that the BPM box widened with a tenth, that a Controller knob jumped 1.5 BPM from a tenth, that a pad's Notes were not learned on a Switch, and that the shortening loop was duplicated. All are fixed in "the review's fixes".

Claude's calls, open to the owner:

1. **Key and Vel show whole today.** At every width in Mac fonts, a knob's column grows to fit its name, so no row runs short and Key Track and Velocity read whole, as an LFO's Destination did in 156. They shorten only where a row would wrap: in a wider font, or a larger text setting. To see Key and Vel on a phone, the knob columns would have to be capped below their names, which is a layout change 156 did not make.
2. **Every knob's and fader's name shortens the same way.** Cutoff → Cut, Resonance → Res, Detune → Det and Volume → Vol take their 156 forms on their knobs too, but only where a row runs short (never today).
3. **The keys step to the next value on their grid**, as a knob's do: from 120.3, ↑ gives 121, not 121.3, and from 123, Page Up gives 130. So the first test's ↑ then Page Up now gives 130, where it gave 131.
4. **A tenth comes only from the keys and from typing.** A drag still moves a whole BPM per pixel from where it started. Tap Tempo, a MIDI clock and a Controller's knob set whole BPMs; a Relative knob on 120.3 goes to 121 or 120.
5. **The accessible name is "Tap Tempo"**, the tip's title too, while the button reads "Tap" (as a short form keeps its whole name for screen readers). The button's CSS class became `tap-tempo`.
6. **The DX7 manual is found but not read.** Yamaha's server refuses the fetching tool, as its history pages did for 194. Reading the file means downloading it from yamaha.com (the scan is 5.3 MB, the text version a 43 KB zip), and a download needs the owner's go-ahead. With that go-ahead, the fact can be read and graded A, and the line can cite it.
7. **Which choices are Switches** is a list beside the Mappings (LFO 1 and 2 Sync and Retrigger, Legato). The code review would rather keep it on the choices' own definitions; Claude left it as a list for now.

What to try in the app:

- Tempo: focus the BPM, press Shift+↑ a few times (120.1, 120.2…), then ↑ (121) and Page Up (130). Hover the BPM for its steps line, and check the header doesn't move.
- Tempo: hover Tap. Its tip says Tap Tempo; with VoiceOver it is "Tap Tempo, button".
- MIDI Learn: press LFO 1 Sync on screen, then a button or a pad on the Controller. Each press switches Sync on and off, whether the button is momentary or a toggle (the MIDI panel says which). Try the same on Legato.
- Tell Claude whether to download the DX7 manual from Yamaha's library, and whether Key and Vel should show on phones (a narrower knob column).

**Since then (2026-11-04):** the DX7 manual read (call 6), its text version downloaded at the owner's word ("Yes, download it"). It says the DX7 employs "an entirely new FM digital tone generation system" and lists "FM Tone Generator: 6 operators, 32 algorithms": graded A in the History research [S34], and FM's History line now cites it. It names no year and neither Stanford nor Chowning, so the line's words are unchanged and its other facts keep their sources.
