# 255: MIDI Learn and the C16 say what they do

**What to build:** Findings of the full review round on 1.26.1 (the inbox, 2026-11-07; reviews [17](../reviews/2026-11-07/17-midi-mapping-geek.md) and [2](../reviews/2026-11-07/2-synth-enthusiast.md)):

1. **MIDI Learn takes a control from the C16's layout without saying so:** a learned Cutoff ends bank B's K1, Hold on a pad ends M4 on all banks, the mod wheel ends bank A's K1 and leaves that knob turning the new target the wrong way; the Learn bar says only "Mapped" (review 17, a fake C16).
2. **A factory C16 runs backwards below the middle,** its knobs sending positions (Cutoff turned up from 40 to 48 goes down), and the MIDI panel never says to set them to Relative #1 (review 17).
3. **Pickup gives no cue:** a mapped knob waiting for the hardware to cross its value shows no waiting state, so the Mapping looks dead (review 2, since 1.16.0).

**Blocked by:** none

**Status:** ready-for-human · bug. Built (2026-11-07) on night/2026-11-07 and merged into main on 2026-11-07, approved by the owner, untried: "Merge the night"; released in 1.27.0. Left: the owner tries it on the C16. In v1 as polish ([131](./131-v1.md)), decided by the owner (2026-11-07, "Yes" to the triage's eight v1 issues).

**Added in triage (2026-11-07, from [review 12](../reviews/2026-11-07/12-ripple-hunter.md) over the whole app, decided by the owner (2026-11-07, "Yes to both")):**

4. **A learned pitch-bend Mapping is dropped on reload:** stored as CC 128, it fails the stored Mappings' 0 to 127 check.
5. **A Switch learned from a button press cut short is kept as a toggle,** against its comment that nothing is learned; and the MIDI Learn test of every Action's pad leaves out Tap Tempo.

## Agent Brief

**Category:** bug
**Summary:** MIDI Learn silently replaces the C16's layout entries, a factory C16 is not told to use Relative #1, Pickup's waiting is invisible, a pitch-bend Mapping is lost on reload, and a cut-short press learns a Switch.

**Current behavior:** As the five items above say.

**Desired behavior:**
- When a learned Mapping takes a control the C16's layout used, the Learn bar says which ("Mapped; bank B's K1 no longer turns Resonance"), and the knob it took leaves no half-mapping behind that turns its new target the wrong way.
- When a C16 is seen sending absolute positions where its layout expects Relative #1, the MIDI panel says to set the knobs to Relative #1, once, with how.
- A learned pitch-bend Mapping survives a reload; a press too short to tell a toggle from a momentary learns nothing, as its comment says.
- A mapped knob waiting for Pickup shows it is waiting (on its ring, and in its description), until the hardware crosses its value.

**Key interfaces:**
- MIDI Learn's Mapping and the C16 layout's entries
- The Learn bar's words
- The MIDI panel's notices
- Pickup's state on a knob

**Acceptance criteria:**
- [x] A test with a fake C16: learning Cutoff, Hold and the mod wheel each says what it took, and no knob turns its target backwards after
- [x] A test: positions from a C16 bring the Relative #1 notice
- [x] A test: a knob waiting for Pickup shows it, and stops once crossed
- [x] A test: a pitch-bend Mapping comes back after a reload; a cut-short press learns no Switch; Tap Tempo in the every-Action pad test
- [ ] The owner tries it on the C16 (a human check)

**Out of scope:** the MIDI panel as a C16 map (v2, [262](./262-v2-ideas-from-the-1-26-1-round.md)).

## How it was built

- **The Learn bar says what a learned Mapping took.** These are the Mappings it replaced, because they shared its control or its target. A C16 place is named by bank and place: "Mapped Cutoff ← ch 1 · CC 1; bank A’s K1 no longer turns Osc 1 Octave; bank B’s K1 no longer turns Cutoff". A place taken on all four banks is said once: "every bank’s M4 no longer fires Hold". A person's own Mapping is named by its control: "ch 2 · CC 74 no longer turns Cutoff". Knobs turn, faders move, buttons fire an Action or switch a choice. Learning a target again on the control it already had takes nothing. Quick Setup's card says the same after each step.
- **A C16 knob taken by another input drives nothing.** Say a keyboard's mod wheel (ch 1, CC 1, the same CC as bank A's K1) is learned for the Cutoff. The new Mapping answers every Controller but the C16. The MIDI panel marks it "· not the C16". The C16's K1 then does nothing at all: it does not turn the Cutoff the wrong way, and it does not turn LFO 1's Depth either, which is what an unmapped CC 1 does. Learning that control again from another input keeps the C16 out. Learning it from the C16 itself gives it back to the C16, as before. ADR-0017's Status line and the glossary's Mapping record the narrowed rule.
- **A factory C16 is told about Relative #1.** A C16 layout knob that sends a position (a value more than 15 from 64) brings a notice to the MIDI panel's first line, and to the MIDI button's tip: "The C16’s knobs are sending positions, so they turn the wrong way below the middle: in the C16’s companion editor, set every knob to Relative #1. Print C16 card shows how to set each button too." It is said once per visit and stays for the rest of the visit.
- **Pickup shows that it waits.** A mapped Absolute knob that has not yet caught its value gets a dashed ring in its section's colour. Learn mode's ring is thin and grey, so the two do not look alike. The slider's description says "Pickup: turn your Controller’s knob up (or down) to this value to take it over." Both stay until the knob crosses the value. They are dropped when the Patch changes other than from a Controller (a Preset, the screen) or when the Mappings change, and they come back, with the right way to turn, at the knob's next move. The old 400 ms grey flash is gone; the "moved" flash stays.
- **Items 4 and 5.** A stored bend-wheel Mapping (CC 128) is read back after a reload. A press on a Switch cut short by another target learns nothing, as an Action's press already did. The every-Action pad test now has Tap Tempo.
- **Tests:** `src/midi/controlSurface.test.ts` covers Learn beside the C16 layout (what it took, the C16 kept out, the taken knob inert, a C16 knob learned from the C16), the positions notice, the Pickup way and the cut-short Switch. `src/midi/taken.test.ts` covers the words. `src/midi/mappings.test.ts` covers CC 128 read back. `e2e/c16Learn.spec.ts` (new) plays a C16 beside a keyboard; the fake MIDI can now play one input alone. `e2e/midiLearn.spec.ts` covers the Pickup cue, the bend wheel across a reload, and Tap Tempo's pad. The e2e test was checked red with the C16 not kept out. The two review bugs' unit tests were checked red too.
- **Tests run:** `npx tsc`, `npm run lint`, and the unit tests of the changed files (524 passed). The C16 Learn, MIDI Learn, C16 card, Quick Setup, MIDI keyboard, MIDI clock, knob, fader, tooltip, header and keyboard-access specs passed in Chromium (178) and in WebKit (174, 4 skipped as before), both before and after the review's fixes. One WebKit run after the fixes had one failure, in `fader.spec.ts`, with Playwright's "Cannot find parent object browser" error. Rerun alone, it passed (14 of 14), at a load average of 85.

## Claude's calls, open to the owner

1. **Taken, not shared.** Review 17 offered two fixes. One was to let a C16-only Mapping and a learned one live side by side. The other was to "at least name what is replaced". The issue's Desired behaviour asks for the second, so one control still has one target and one target one control, and Learn now says what it took.
2. **A Mapping learned away from the C16 leaves the C16 out.** This narrows ADR-0017's "Mappings made by MIDI Learn or Quick Setup answer any Controller" and issue 145's "a MIDI-Learned Mapping still answers any input". It applies only to a Mapping learned from another input on a control the C16's layout had. It is recorded in ADR-0017's Status line, as issue 145's correction was there, rather than in a new ADR. A Mapping learned from the C16 itself still answers every input, as before; review 17's finding 5 (record the input Learn heard) is left for later.
3. **The words.** "bank B’s K1 no longer turns Cutoff", "every bank’s M4 no longer fires Hold", "· not the C16" in the MIDI panel. The Learn bar also names a person's own Mappings that were taken, not only the C16's.
4. **The notice's test and its life.** "A position" means a value more than 15 from 64, the line Learn already uses for a 64-centred Relative step, sent by a C16 layout knob. One such value is enough. The notice stays until the page is reloaded, even after the knobs are set right. This assumes a C16 on Relative #1 never sends a value that far from 64; if its fastest turn does, the notice would show wrongly.
5. **"With how."** The notice says to use the C16's companion editor, the only place known to set the knobs, and points to the card. It does not walk through the editor's own screens, which this project has not documented.
6. **Pickup's cue.** A dashed ring in the section's colour, plus the way to turn in the slider's description. No ghost mark shows where the hardware knob is. The tempo, mapped Absolute, gets the dashed ring but no description. Since 2026-11-08 ([268](./268-tidy-ups-after-1-27-0.md)) its description says so too, as a knob's does.

## What to try in the app

On the owner's own C16, set as the card says (knobs on Relative #1), with nothing else changed:

- Open the MIDI panel, then MIDI Learn. Click the Cutoff and turn a knob on another keyboard (or the C16 on another bank's free knob). The bar says "bank B’s K1 no longer turns Cutoff". Escape, then turn bank B's K1 on the C16: the Cutoff stays put.
- With a keyboard's mod wheel, learn the Resonance. The bar names bank A's K1 (Osc 1 Octave) and bank B's K2 (Resonance). Then turn bank A's K1 on the C16, both ways. Nothing moves: not the Resonance, not Osc 1's Octave, not LFO 1's Depth. The keyboard's wheel still drives the Resonance once it passes its value.
- Learn Hold on a keyboard pad: the bar says "every bank’s M4 no longer fires Hold", and M4 then does nothing on any bank.
- In the C16's companion editor, set one knob back to its factory positions and turn it. The MIDI panel's first line says to set every knob to Relative #1. Then set it back.
- Learn a fader (an Absolute one) for a knob on screen, set that knob with the mouse far from the fader, and move the fader a little. The knob shows a dashed ring until the fader passes its value.
- C16 layout in the MIDI panel puts everything back.
