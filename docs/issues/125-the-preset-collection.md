# 125: The Preset collection after review 15

**What to build:** From review 15 (the inbox, 2026-10-30; [report](../reviews/2026-10-30/15-sound-designer.md): "The collection", "Presets to add"):

- **Near-copies:** Organ and Chord Organ (distance 0.10), Fast Beats and Out of Tune (0.13), Glass Keys and Bell Chords (0.16), Electric Piano and Poly Keys (0.26), Pad and Chord Pad (0.50); four mallets from one recipe; three LFO'd band-pass saws (Vowel, Wah, Talking Filter).
- **Categories:** Chords is a feature, not a sound family (most of its siblings already have 8 Voices); bells sit in five groups and organs in three. The report proposes Keys & Organs, Plucks & Mallets, and Strings, Brass & Choir, the lessons kept as they are, and Movement & Effects opening on Laser or Wind rather than Glide Slide.
- **Ten Presets to add**, each rendered with its settings in the report: Riser, Phase Pad, Flute, House Organ, Sub Drop, Rave Stab, PWM Bass, Pick Pluck, Ride, Analog Drift Lead. They show tricks no Preset uses yet (a slow Filter Attack with Env Amount, a notch phaser, Noise as a strike, a sub-audible pitch drift, a Ring cymbal).
- **The Bass group's register:** on the default keys the Basses play in the tenor; a Preset could carry the keyboard's octave, the Basses at C2.
- **The master's room for Voices:** each extra Voice lowers every Note (1 / √Voices), 9 dB on a single Note of an 8-Voice Preset, part of why levels spread 29 dB.

**Blocked by:** none

**Status:** ready-for-agent · enhancement. The owner accepted the five answers (decisions below).

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
- [ ] The Preset tests list the new categories and every Preset in one of them; no two Presets closer than the report's near-copy distance (0.3) unless the test names why
- [ ] Each added Preset is rendered on C2, C4 and C6 within its family's level, and its words fact-checked
- [ ] Loading a Bass puts the keyboard at C2; loading Init brings back the default; the octave buttons work after either
- [ ] Every Tutorial and the Demo still pass their tests
- [ ] The owner listens to the added Presets before the release

**Out of scope:**
- The Preset reworks of 108 (built first, on the same list)
- The master's level law
