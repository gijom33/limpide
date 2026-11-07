# 265: Words and comments that lag 1.26

**What to build:** Review 12's findings over the whole app on 1.26.2 (the inbox, 2026-11-07; [report](../reviews/2026-11-07/12-ripple-hunter.md)), words and comments the code has made untrue:

1. **Display's tip lists only the Viewers' settings,** though the panel also holds Keys, Tips, Bead and Theme, where the README and Bead's tip send people; a test name, a styles comment and a helper say the same three groups.
2. **The Synth Geek Layer's tip says the Mixer's levels and the Sustain read in dB:** the Volume does too, Ring does not; the layer's unit test is named for less than the layer reads.
3. **"The LFO" where there are two:** the LFO & Envelopes tip, the README and two code comments; the Timeline's tips and the glossary leave out the line aftertouch draws.
4. **The engine's opening comment says every Tap follows the newest Note,** against ADR-0022 and the Amp Tap's default of every Voice.
5. **The PRD's "In v1, still to do"** names issues done since 2026-11-02 and none of 251 to 264, and its module interfaces name functions that no longer exist.
6. **The README's "a dozen" reviewers,** where there are twenty.
7. **CONTRIBUTING says every push to main runs all its commands,** but GitHub runs neither the statistics nor the frame costs.
8. **The design principles put Modulation below the stages** (beside them from 1920 px), and say every screen state is audited, while the audit skips the Sub & Noise tab and the Tour's and the Tutorials' cards.
9. **"Init's Resonance" is 5 %** in the band-pass make-up's code, its comments and two test names, where Init's is 20 %.
10. **About 50 code comments and test names state an old layout or count** (the Mixer under the tabs, a 44 px label column, rows "on the heading line", 17 keys on phones, 12 px to Hold, fifteen Steps, the MIDI "dot", Bead taking no pointer): one sweep.

**Blocked by:** none

**Status:** ready-for-human · bug. Built (2026-11-07) on night/2026-11-07, for the owner to try. In v1 as polish ([131](./131-v1.md)), decided by the owner (2026-11-07, "Yes to both").

## Agent Brief

**Category:** bug
**Summary:** Ten groups of words, docs and comments that say what the code no longer does: put each right, and the audit's missing screens either audited or the principle worded to match.

**Current behavior:** As the ten items above say; review 12's report gives each one's place and quote.

**Desired behavior:**
- Each item's words true of the code; where a word is the code's (a test name, a constant's meaning, "Init's Resonance"), the word changes and the behaviour stays.
- The design audit covers the Sub & Noise tab and the Tour's and the Tutorials' cards, or the principle says what it covers.
- An accepted ADR is not edited; ADR-0022 is right and the comment is wrong.

**Key interfaces:**
- The tips and the glossary
- The README, CONTRIBUTING, the PRD and the design principles
- Code comments and test names

**Acceptance criteria:**
- [ ] Each item done, the report's quotes no longer found
- [ ] The design audit's states listed, the new ones passing
- [ ] Every test passes, renamed tests included

**Out of scope:** the Preset and tip claims about sound ([266](./266-preset-and-tip-words-that-hold.md)); the two MIDI Learn bugs review 12 found ([255](./255-midi-learn-and-the-c16-say-what-they-do.md)).

## How it was built

Each item put right where review 12's report placed it; where a word was a test's name, the name changed and the test still passes, widened where that was cheap and true, narrowed otherwise.

1. **Display's tip** ends "and the page's own settings: the letter keys, the tips, Bead and the theme". The grouping test now checks all seven groups (View, Axes, Show, Keys, Tips, Bead, Theme), the toolbar's tip test hovers every control of the panel (Freeze, Snapshot, Viewers follow, Glow and Geek, Keys, Tips, Bead and Theme added), and the styles comment and the `openDisplay` helper name the seven groups.
2. **The Synth Geek Layer's tip:** "the Mixer's levels (Ring's aside), the Sustain and the Volume in dB"; the gains' comment says Ring stays in %; the unit test, renamed, also checks the Volume in dB and Ring with no readout.
3. **Two LFOs and aftertouch:** the LFO & Envelopes tip ("the two LFOs"), the Timeline's two tips and the glossary's Envelope Timeline name the line aftertouch draws, dashed; the README's Timeline line; the section's, the engine's and the styles' comments; the key's comment.
4. **The engine's opening comment** now says what ADR-0007 and ADR-0022 say: the Oscillator and Filter Taps follow the newest Note, the Amp Tap carries every Voice unless the Viewers are set to follow the newest. No ADR touched.
5. **The PRD:** "In v1, still to do" points to issue 131's checklist instead of restating it; the module interfaces name `patchToJSON` / `patchFromJSON`, `patchToShare` / `patchFromShare`, and `release(note)` beside `noteOff()`, with no `start()`.
6. **The README's reviewers:** twenty, seventeen playing a kind of visitor and three checking the words and the sound against the code.
7. **CONTRIBUTING:** a push to `main` runs the type check, the lint, the three test commands and the build; the statistics and the frame costs are measured by hand.
8. **The design principles and the audit:** Modulation "below them, or beside them as a fourth column on a wide screen (from 1920 px)". The audit gains three states, the Sub & Noise tab, a Tutorial's card (Sub Ladder's first) and the Tour's first card, and the principle and the spec's header list the states it covers. The new states found two real failures, both fixed: a primary button's words in the light theme (Start and Next on the cards) were 2.85:1 on the orange, now near-black as About's buttons already were, the MIDI panel's primary button with them (the dark theme is unchanged); and in a window narrower than a phone (280 px) the Tour's "Oscillators and Mixer" and its "1 of 6" each took two lines, so below 320 px a card's progress goes under its name.
9. **"Init's Resonance"** is "5 %" in the band-pass make-up's code, its comments and the two test names; Init's 20 % is named where it is meant.
10. **The sweep** of review 12's findings 12 to 18: the Oscillator tabs and the label column, the rows under a heading, the tab dot, the Filter Mode icons' box, the piano on a phone, the strip and the 860 px breakpoint, Hold's glyph, the Patch and MIDI panels, the MIDI socket, the Timeline's key, the folded and the three cards, Bead and the pointer, the tremolo's rest, the LFO wiring, the reach, the readout's widest shapes, the Tutorials' order, the Demo's chords, the LFO Presets and `initialPatch`'s doc, and the test names and comments review 12 listed. Hold's two gap checks now ask for 8 px within 1, as issue 188's own test does.

**Claude's calls, open to the owner:**

1. **The audit widened rather than the principle narrowed,** and its two findings fixed rather than waived: the near-black words follow the precedent About's buttons set ("light ones fell to 2.9:1 on the light theme's orange"); the card's progress under its name applies only below 320 px, narrower than any phone.
2. **The PRD points to 131** rather than keeping its own list, so it cannot lag again.
3. **Test names narrowed where widening meant new behaviour to pin down:** the Voices test (FM only), the modulation ring (the Envelope alone), the Tour's phone lines (the first four cards), the 2 × 2 Tour test (one size), Display's remembered settings (the View's and the Axes'), the 22 Preset names, Bead's tricks ("every one moves it": its last pose is not where it started, the waddle travels), the Tutorial started over another. Widened where it was a few lines: Display's groups and tips, the Mixer's three other faders' tips, Hold's 8 px.
4. **`passBand`:** its claim (what the Timeline shades) dropped; the function stays, though only its tests call it now (its sibling `bandwidthOctaves` is used). Removing it is a code change for another issue.
5. **Left to other issues:** issue 42's Status line and the briefs' figures (review 12's findings 6 and 7, not in this issue's list), the ADRs' lists (finding 19: no ADR edited), MIDI Learn's two bugs (255), the sound claims (266).

**What to try in the app:**

- Switch to the light theme and start a Tutorial and the Tour: the Start and Next buttons' words are now near-black on the orange; the dark theme looks as before.
- Narrow a window below 320 px (or zoom a phone) and take the Tour: "1 of 6" sits under the card's name.
- Hover Display's button: its tip names Keys, Tips, Bead and Theme too. Turn the Synth Geek Layer on: the Volume reads dB, Ring stays in %.
- Read the LFO & Envelopes and Envelope Timeline tips with a keyboard that sends aftertouch.
