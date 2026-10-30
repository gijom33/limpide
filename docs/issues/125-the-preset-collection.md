# 125: The Preset collection after review 15

**What to build:** From review 15 (the inbox, 2026-10-30; [report](../reviews/2026-10-30/15-sound-designer.md): "The collection", "Presets to add"):

- **Near-copies:** Organ and Chord Organ (distance 0.10), Fast Beats and Out of Tune (0.13), Glass Keys and Bell Chords (0.16), Electric Piano and Poly Keys (0.26), Pad and Chord Pad (0.50); four mallets from one recipe; three LFO'd band-pass saws (Vowel, Wah, Talking Filter).
- **Categories:** Chords is a feature, not a sound family (most of its siblings already have 8 Voices); bells sit in five groups and organs in three. The report proposes Keys & Organs, Plucks & Mallets, and Strings, Brass & Choir, the lessons kept as they are, and Movement & Effects opening on Laser or Wind rather than Glide Slide.
- **Ten Presets to add**, each rendered with its settings in the report: Riser, Phase Pad, Flute, House Organ, Sub Drop, Rave Stab, PWM Bass, Pick Pluck, Ride, Analog Drift Lead. They show tricks no Preset uses yet (a slow Filter Attack with Env Amount, a notch phaser, Noise as a strike, a sub-audible pitch drift, a Ring cymbal).
- **The Bass group's register:** on the default keys the Basses play in the tenor; a Preset could carry the keyboard's octave, the Basses at C2.
- **The master's room for Voices:** each extra Voice lowers every Note (1 / √Voices), 9 dB on a single Note of an 8-Voice Preset, part of why levels spread 29 dB.

**Blocked by:** none

**Status:** done (2026-10-30). The Presets sit in sound families, the five near-copies are gone, review 15's ten are added at their family's level, and a Bass starts the keyboard on C2. Not yet heard by the owner: the owner listens to the added Presets before the release.

## Questions for the owner

1. **Categories:** reorganise as the report proposes (Chords dissolved into the sound families, Keys & Organs, Plucks & Mallets, Strings, Brass & Choir; "8 Voices" said in each description instead)? Claude's recommendation: yes.
2. **Near-copies:** replace Chord Organ, Poly Keys, Bell Chords and Chord Pad with House Organ, Rave Stab and Phase Pad, and cut Out of Tune (Fast Beats teaches the same)? Claude's recommendation: yes. Saved Patches are unaffected; a Share link carries its own settings.
3. **The ten Presets:** add all ten, each fact-checked and rendered for level before the push? Claude's recommendation: yes. The collection grows from 135 to about 140 after the cuts.
4. **The Basses' register:** let a Preset set the computer keyboard's and the on-screen piano's octave when loaded (the Basses at C2, the Leads where they are)? Claude's recommendation: yes; the octave buttons still move it after.
5. **The master's room:** keep 1 / √Voices, and level the Presets with their Volume instead ([108](./108-preset-claims-and-levels.md))? Claude's recommendation: keep it: it is what stops a full chord clipping, and the limiter is the only other guard.

## Decisions (triage, 2026-10-30, decided by the owner)

1. The categories are reorganised as the report proposes: Chords dissolved into the sound families, Keys & Organs, Plucks & Mallets, Strings, Brass & Choir, the lessons as they are; each 8-Voice Preset says so in its description; Movement & Effects opens on Laser or Wind.
2. Chord Organ, Poly Keys, Bell Chords and Chord Pad are replaced by House Organ, Rave Stab and Phase Pad; Out of Tune is cut.
3. The ten Presets are added, each fact-checked and rendered for level before the push.
4. A Preset may set the keyboard's octave (the computer keyboard and the on-screen piano) when loaded: the Basses at C2; the octave buttons still move it after.
5. The master's room for Voices (1 / √Voices) stays; Presets are levelled with their own Volume ([108](./108-preset-claims-and-levels.md)).

## Agent Brief

**Category:** enhancement
**Summary:** The Preset list is reorganised into sound families, near-copies give way to new sounds, ten Presets are added, and a Preset can start the keyboard in its own octave.

**Desired behavior:**
- **Categories:** the list and the Patches panel's category pills follow decision 1; every Preset sits in one family; the search finds each by its new category.
- **Near-copies:** the four replaced and Out of Tune are gone from the list; a Tutorial or Demo part that used one uses its replacement or the Preset it copied (Organ, Electric Piano, Glass Keys, Pad, Fast Beats), its words checked.
- **Additions:** the ten in review 15's report, with its settings as the start, each description written in the collection's style and true when rendered (the fact-check), each level within 3 dB of its new family's median.
- **Keyboard octave:** a Preset may carry the octave the keyboard starts in when it is loaded (the Basses at C2); loading another Preset without one returns to the default octave; the octave buttons still move it; a saved Patch and a Share link keep it; old Patches load without one.
- **The Demo** keeps playing the same Notes (its parts set their own pitches).

**Acceptance criteria:**
- [x] The Preset tests list the new categories and every Preset in one of them; no two Presets closer than the report's near-copy distance (0.3) unless the test names why
- [x] Each added Preset is rendered on C2, C4 and C6 within its family's level, and its words fact-checked
- [ ] Loading a Bass puts the keyboard at C2; loading Init brings back the default; the octave buttons work after either
- [ ] Every Tutorial and the Demo still pass their tests
- [ ] The owner listens to the added Presets before the release

**Out of scope:**
- The Preset reworks of 108 (built first, on the same list)
- The master's level law

## How it was built

**The families** (`src/patch/presets.ts`): the lessons as they were, then Bass, Leads, Keys & Organs, Pianos, Plucks & Mallets, Pads, Strings, Brass & Choir, Drums, Movement & Effects. Leads gain Duo Lead; Keys & Organs take Electric Piano, Tremolo Keys, Clav, Organ and Cathedral; Plucks & Mallets take Poly Pluck, Harp, Chorus Pluck, Marimba, Vibes, Kalimba, Toy Piano (from Pianos), Glass Keys, FM Bell and Zap Pluck; PWM Strings, Strings, Brass Swell, Brass Section and Choir make their own family. Movement & Effects opens on Laser. Fifteen 8-Voice Presets now say "eight Voices" in their words. The Patch panel's categories and rows follow the list, so the pills and search needed no change of their own.

**The near-copies:** Chord Organ, Poly Keys, Bell Chords, Chord Pad and Out of Tune are removed. No Tutorial or Demo part used any of them (the Demo plays Kick, Acid, Poly Pluck, Strings, Tremolo Keys, Self-Oscillation, Wobble, Double Wobble, Split Octave Bass, Sweep Pad, Cathedral, FM Bell and its lead and brass), so none needed its replacement. Saved Patches and Share links are unaffected: the Library stores each Patch's own values and a Share link encodes them (`src/patch/library.ts`, `src/patch/serialize.ts`); neither refers to a Preset by name, and a MIDI Program change counts Presets by position (Program n is the n-th), which this reorder moves.

**The ten added**, from review 15's settings, rendered again after 103, 108 and 124 (dBFS, loudest 100 ms on C2 / C4 / C6, the safety limiter made straight):

| Preset (family) | C2 / C4 / C6 | Changed from the report |
|---|---|---|
| Riser (Movement & Effects) | −22.0 / −21.6 / −21.9 | Key Track 100 % (C6 was 5 dB over the family) |
| Sub Drop (Movement & Effects) | −21.9 / −21.8 / −21.8 | Volume 50 % |
| Phase Pad (Pads) | −26.7 / −24.4 / −25.0 | none |
| Flute (Leads) | −18.7 / −18.7 / −18.8 | none |
| Analog Drift Lead (Leads) | −16.7 / −17.1 / −17.6 | Volume 80 % |
| House Organ (Keys & Organs) | −26.6 / −26.5 / −26.5 | Volume 75 %; Cutoff 800 Hz and Env Amount 2.5 (at 2.5 kHz the strike was no brighter than the hold) |
| Rave Stab (Keys & Organs) | −27.3 / −26.7 / −25.2 | none |
| PWM Bass (Bass) | −12.9 / −12.6 / −11.7 | none |
| Pick Pluck (Plucks & Mallets) | −29.3 / −28.3 / −26.1 | Noise 0.25 to 0.5 (at 0.25 it added 1.5 dB to the strike's top) |
| Ride (Drums) | −26.4 / −26.0 / −26.9 | Key Track 60 % (C6 was 3.5 dB over) |

Each word was checked by rendering (`src/patch/presets.browser.test.ts`, "the ten Presets review 15 proposed"): Riser's high-pass goes from 200 Hz past 5 kHz in six seconds and its Envelope (so Osc 2's Env Amount) reaches 0.95, "almost two octaves"; Sub Drop's Osc 2 starts over 3.2 times its own pitch and settles on it; Phase Pad's notch travels from under 500 Hz to over 2.5 kHz; House Organ's strike is more than 4 dB brighter above 1.5 kHz than at 0.3 s, and its level falls more than 6 dB by 0.6 s; Rave Stab's fifth sounds within 6 dB of the Note; Pick Pluck's Noise adds more than 3 dB above 6 kHz to the strike and is under −60 dB there by 0.15 s; Ride fades less than 30 dB in its first second, more than 25 by 1.5 s; Analog Drift Lead's pitch swings 4 cents each way. Each plays every Note and a chord under the limiter's knee (0.8).

**Levels after the move** (the same test, each family within 3 dB of its median on C4): Duo Lead to full Volume (it was 6.5 dB under the Leads at 50 %), Cathedral to 75 % (3.4 dB over Keys & Organs; the Demo's Cathedral part plays 2.5 dB quieter). Pluck needs no exception in Envelope; the four others named in 108 stay.

**The near-copy test** (`src/patch/presets.test.ts`): review 15's distance, each Parameter's difference as a share of its control's travel, added up, plus 1 for each choice that differs, Volume left out. It gives the report's figures (Organ and Chord Organ 0.10, Fast Beats and Out of Tune 0.13, Glass Keys and Bell Chords 0.16). Every two Presets are now at least 0.3 apart, except three lesson pairs named in the test: Perfect Fifth and Major Third (0.13), Major Third and Slow Beats (0.21), Slow and Fast Vibrato (0.23).

**The keyboard octave** (`src/patch/patch.ts`, `src/input/keyboardLayout.ts`, `src/ui/App.tsx`): an optional Patch field, `keyboardOctave`, which every Bass carries at 2. The page opens in the loaded Patch's octave, and each load (the arrows, the panel, a Program change, a Tutorial, the Demo) sets the keyboard to it or back to C4; the octave buttons still count from C4 (the down button reads −2 on a Bass) and move it after. The Demo and Listen show their phrase's octave just after their load, as before, so the Demo plays and shows the same Notes. `sanitizePatch` keeps the field when it is an octave the buttons reach (0 to 7), so files, Share links and the Library keep it, and older Patches load without one. A Tutorial's Steps do not set it: its comparison with the Preset leaves it out, and the Preset loaded at the end brings it.

**Tests:** unit: `src/patch/presets.test.ts` (families, eight Voices in the words, the Basses' octave, the distance), `src/input/keyboardLayout.test.ts`, `src/patch/serialize.test.ts`, `src/tutorial/tutorial.test.ts`, `src/tutorial/tutorials.test.ts`; engine: `src/patch/presets.browser.test.ts`. The whole Vitest suite passes (962 tests; two engine tests in `src/engine/synthEngine.browser.test.ts` failed once under a load average of 35 and pass alone). Playwright was not run in this lane; to run at the merge: `e2e/piano.spec.ts` (new: a Bass starts on C2, Init on C4, the buttons after), `e2e/patches.spec.ts` (the families, the last Preset now Machine Chatter, the panel fitting without a scrollbar from 840 px with 15 groups), `e2e/patchSearch.spec.ts` ("bell" now finds five), `e2e/tutorial.spec.ts` (Bass, Acid and Wobble load at the end, moving the keyboard to C2), `e2e/demo.spec.ts` (Cathedral quieter; the piano's octave on each part) and `e2e/designPrinciples.spec.ts` (the panel’s new pills and rows).

**Judgement calls** (Claude's call, open to the owner):

1. **Pluck sits in the Envelope lesson**, after Pluck Shape, at one Voice: its words teach the Filter Envelope's snap, its Tutorial needs one Voice, and in Plucks & Mallets it would have been the one Preset whose chord cuts its own Notes off (review 15).
2. **Drums keeps its name**: the decision names the three new families; review 15's table called it "Drums & Percussion".
3. **Chorus Chords goes to Pads** and **Rave Stab to Keys & Organs** (no Stabs family): review 15's list placed neither Chorus Chords nor a Stabs group.
4. **Every Bass starts on C2**, 808 Boom and FM Growl included, as the decision says "the Basses"; the other families keep C4.
5. **The end of a Bass, Acid or Wobble Tutorial moves the keyboard to C2**, since it loads the Preset once the sound matches.
6. **Movement & Effects' order:** Laser, then Riser and Sub Drop, then the rest as before; Glide Slide moves to sixth.
