# 125: The Preset collection after review 15

**What to build:** From review 15 (the inbox, 2026-10-30; [report](../reviews/2026-10-30/15-sound-designer.md): "The collection", "Presets to add"):

- **Near-copies:** Organ and Chord Organ (distance 0.10), Fast Beats and Out of Tune (0.13), Glass Keys and Bell Chords (0.16), Electric Piano and Poly Keys (0.26), Pad and Chord Pad (0.50); four mallets from one recipe; three LFO'd band-pass saws (Vowel, Wah, Talking Filter).
- **Categories:** Chords is a feature, not a sound family (most of its siblings already have 8 Voices); bells sit in five groups and organs in three. The report proposes Keys & Organs, Plucks & Mallets, and Strings, Brass & Choir, the lessons kept as they are, and Movement & Effects opening on Laser or Wind rather than Glide Slide.
- **Ten Presets to add**, each rendered with its settings in the report: Riser, Phase Pad, Flute, House Organ, Sub Drop, Rave Stab, PWM Bass, Pick Pluck, Ride, Analog Drift Lead. They show tricks no Preset uses yet (a slow Filter Attack with Env Amount, a notch phaser, Noise as a strike, a sub-audible pitch drift, a Ring cymbal).
- **The Bass group's register:** on the default keys the Basses play in the tenor; a Preset could carry the keyboard's octave, the Basses at C2.
- **The master's room for Voices:** each extra Voice lowers every Note (1 / √Voices), 9 dB on a single Note of an 8-Voice Preset, part of why levels spread 29 dB.

**Blocked by:** none

**Status:** needs-triage · enhancement. Questions for the owner below.

## Questions for the owner

1. **Categories:** reorganise as the report proposes (Chords dissolved into the sound families, Keys & Organs, Plucks & Mallets, Strings, Brass & Choir; "8 Voices" said in each description instead)? Claude's recommendation: yes.
2. **Near-copies:** replace Chord Organ, Poly Keys, Bell Chords and Chord Pad with House Organ, Rave Stab and Phase Pad, and cut Out of Tune (Fast Beats teaches the same)? Claude's recommendation: yes. Saved Patches are unaffected; a Share link carries its own settings.
3. **The ten Presets:** add all ten, each fact-checked and rendered for level before the push? Claude's recommendation: yes. The collection grows from 135 to about 140 after the cuts.
4. **The Basses' register:** let a Preset set the computer keyboard's and the on-screen piano's octave when loaded (the Basses at C2, the Leads where they are)? Claude's recommendation: yes; the octave buttons still move it after.
5. **The master's room:** keep 1 / √Voices, and level the Presets with their Volume instead ([108](./108-preset-claims-and-levels.md))? Claude's recommendation: keep it: it is what stops a full chord clipping, and the limiter is the only other guard.
