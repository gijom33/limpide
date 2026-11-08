# 123: A Patch in plain words

**What to build:** From Claude's brainstorm, accepted by the owner in triage ([118](./118-new-ways-to-learn.md), decision 3, 2026-10-30): one generated line under the Patch name describing the sound in plain words ("a detuned saw, filtered low, opening on each Note"), beside the about line of [109](./109-teaching-the-new-oscillator-features.md): a Preset shows its own about line, a changed or saved Patch the generated one.

**Blocked by:** [109](./109-teaching-the-new-oscillator-features.md) (the line under the Patch name)

**Status:** done (2026-11-02). Built (2026-11-01) on night/2026-11-01 and released; tried by the owner: "Nice."

## Agent Brief

**Category:** enhancement
**Summary:** Once a Patch is changed, the line under its name describes it in a few plain words, written from the Patch.

**Desired behavior:**
- A pure function turns a Patch into one short phrase (at most about 12 words) naming what matters most, in the glossary's words and everyday ones: the main source and its shape ("a saw", "two detuned saws", "a square with a sub"), FM or Ring when up, the Filter's character ("filtered low", "bright", "a resonant sweep"), the Envelope's shape ("a pluck", "a slow swell", "held"), and an LFO's motion ("a wobble", "vibrato", "tremolo").
- Under the Patch name, where 109 shows a Preset's about line: after the first knob is turned, or for a saved Patch, the generated phrase shows instead, updated as knobs move (not more than a few times a second).
- It never claims what the sound does not do: each phrase's terms come from thresholds the engine's behaviour supports (a Filter "low" only when it cuts the source's Harmonics, an LFO named only when its Depth is heard).

**Key interfaces:**
- The Patch, the line under the Patch name

**Acceptance criteria:**
- [ ] ~~Unit tests give the phrase for Init and for a dozen Presets, each read and accepted as true by the fact-check before the push~~ (not checked at the time)
- [x] Turning a knob changes the line within a moment; a Preset shows its own about line until a knob is turned
- [x] At every layout the line fits or is cut with an ellipsis, never pushing the header

**Out of scope:**
- Other languages
- Describing a Patch with an AI model (the phrase is written by rules, in the page)

## How it was built

Built 2026-11-01, at night, on `night/2026-11-01` (commits `Issue 123: …`).

**The words.** A pure function (`describePatch`, in `src/patch/describe.ts`) writes the phrase from the Patch, at most 12 words, in this order: the source, the Filter, its Envelope, the Amp Envelope's shape, Glide, the LFOs. Each word stands on a threshold:

- **Source:** a level from −20 dB up is named (the Noise from −28 dB, as a hiss is heard lower); where every source is quieter, those up are named. Two Oscillators: "two saws", "two detuned saws" (2 cents or more apart), "two sines a fifth apart", or "a saw with a square an octave down", the louder first. FM when Osc 1 is named, as it moves Osc 1 alone (from 3 %, "a little FM" below 20 %), and Ring when up; Ring alone, "two sines through Ring" or "a saw times a sine". Then "a Sub" ("a deep Sub" two octaves down) and Noise ("a breath of pink Noise" below 20 %). "pure" for a sine with nothing beside it that has Harmonics (no square Sub, no Noise), "bright" for a saw, square or pulse whose every Harmonic to the 20th passes.
- **Filter:** measured against the Note in the middle of the Patch's keys (G4, or G2 for a bass that opens on C2), at the Filter Envelope's Sustain, played softly, Key Track counted. A low-pass passing fewer than 1.5 Harmonics is "muffled", fewer than 4 "filtered low", fewer than 10 "softly filtered", more is not named. Resonance from 60 % is "resonant", from 98 % "a singing Filter". A high-pass is named only when it cuts the fundamental. None of it is said of a sound without Harmonics (sines and a sine Sub, no FM, Ring or Noise): no Filter can make a sine darker.
- **Filter Envelope:** "opening on each Note" when it swings an octave or more above the Sustain where the Harmonics are; "opening after each strike" for a negative Amount; "brighter played harder" for Velocity from 25 %.
- **Amp Envelope:** "a slow swell" (Attack 1 s or more), "swelling in" (0.3 s), "plucked" (no Sustain, Decay under 1.2 s), "ringing out" (longer), "fading slowly" or "accented" (a low Sustain, reached slowly or at once, then held), "sustained", "with a long tail" (Release 2 s or more).
- **LFOs,** by what each moves as the engine's laws have it: "vibrato" (3 cents each way or more, 1 to 12 Hz; slower, "a slow pitch drift"; faster, "a fast warble"), "a wobble" or "a slow Filter sweep" (a quarter octave or more, where the Filter's Mode shapes Harmonics: a high-pass swung under the fundamental moves nothing), "a rhythmic chop", "tremolo", "a moving Pulse Width" (only on a pulse), "FM coming and going" (only with FM up, which gives it room), "a chorus-like drift" (only with Osc 2 heard itself, not through FM alone), "Osc 2 drifting in pitch". An LFO whose Depth moves nothing heard is not named.
- **Twelve words:** the source shortens first ("an octave down" becomes "below", then the Noise and the Sub go, then the quieter Oscillator), so the Filter, the Envelope's shape and the first LFO are kept; "sustained", velocity, Glide and a second LFO give way first.

The unit tests give Init's phrase and sixteen Presets' (Rubber among them), each beside the figures that make it true, for the fact-check before the push; and every Preset's within 12 words.

**The line.** Under the Patch name once the sound is not a Preset as loaded: after the first change to the sound, or for a saved, imported or shared Patch or the last session. A Preset as loaded shows none (by the arrows), or its own about line when picked in the Patches panel (issue 153), until a knob is turned. It follows the knobs at most four times a second, and goes at once on a load. A synced LFO is read at the page's tempo. Built in `src/ui/hooks/usePatchWords.ts` and the Patch bar.

- **From 861 px** it lies where the about line's words lie, one line under the header's left end, as wide as the Oscillators and the Filter, in the room above the Sections (it needs 20 px of the 41), cut with an ellipsis.
  **Since then (2026-11-01, issue 154):** from 861 px wide and 700 px tall the Sections start 8 px lower, room for Bead under the header, so that room is 8 px taller. Claude's call, let stand by the owner in 1.21.0.
- **Up to 860 px** (the 2 × 2 and phones) there is no room under the header: it is sticky, and the Sections or their strip begin right under it, and under the Patch name sits the next row of buttons. The words are the Patch name's second line there, in the 9 px of the header buttons' words, cut with an ellipsis within the name.

An e2e test turns a knob from a Preset picked in the panel, watches the line change within a second, keeps it through a save and loses it on the arrows; another sets every Preset's phrase, as drawn and in wider type, at 320, 375, 700, 861, 1100, 1440 and 2000 px, and checks it on one line or ending in an ellipsis, clear of the Sections and within the Filter's right edge (or inside the Patch name), the header's and the name's sizes unchanged. The design audit has the line as one more state; Bead keeps clear of it as of the about line.

**The octave buttons are no change** (found after the build, 2026-11-01): the Song spec's first test caught the words coming under Init once Octave up was pressed, as the line compared the whole Patch, the keyboard octave the buttons write into it (issue 126) included. The octave says where the keys start, not the sound, and the Patch's changed dot already left it out; so the words and the Preset's about line now go by the sound alone: an octave moved brings no words and leaves the about line showing. The Song, the Demo and the Tutorials move the octave shown without writing it into the Patch, so they bring none either; the Demo and the Tutorials bring the words only as their Steps turn knobs (call 4). A patches spec test covers it, and the Demo spec reads the name alone, as its knobs' words follow a moment after it stops.

Calls made without the owner (Claude's call, let stand by the owner in 1.21.0):

1. **Its place up to 860 px:** the Patch name's second line, small. The alternatives were a row of its own in the header (which pushes the header) or no line on phones and the 2 × 2.
2. **The Note the words are measured on:** the G in the middle of the Patch's keys, so "filtered low" is true where the Patch is meant to be played; on a much higher Note without Key Track a Filter called "low" cuts more, on a much lower one less.
3. **Not said to a screen reader:** it changes with every knob; the name and the knobs' own values are what is heard. It could be the Patch name's description, heard on focus.
4. **The Tutorials and the Demo** show it too, as their Steps change the sound: a Step's words and the line agree, since both are about the Patch.
5. **The words are lower case, the glossary's words capitalised** ("a saw with a Sub, filtered low, opening on each Note"), as a line under the name rather than a sentence.

**What to try:** at about 1440 px pick Init in the Patches panel (its about line), turn the Cutoff: the about line goes and "a saw, softly filtered, sustained" shows; turn it right up and within a moment "a bright saw, sustained". Step through a few Presets with the arrows (no line), turn a knob on each and read whether the words are true to what you hear: Pluck, Bass, Wobble, Pad, Ring Bell, Tine Piano, Kick. Then try a phone width: the words under the name.
