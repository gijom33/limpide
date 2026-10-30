# 123: A Patch in plain words

**What to build:** From Claude's brainstorm, accepted by the owner in triage ([118](./118-new-ways-to-learn.md), decision 3, 2026-10-30): one generated line under the Patch name describing the sound in plain words ("a detuned saw, filtered low, opening on each Note"), beside the about line of [109](./109-teaching-the-new-oscillator-features.md): a Preset shows its own about line, a changed or saved Patch the generated one.

**Blocked by:** [109](./109-teaching-the-new-oscillator-features.md) (the line under the Patch name)

**Status:** ready-for-agent · enhancement

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
- [ ] Unit tests give the phrase for Init and for a dozen Presets, each read and accepted as true by the fact-check before the push
- [ ] Turning a knob changes the line within a moment; a Preset shows its own about line until a knob is turned
- [ ] At every layout the line fits or is cut with an ellipsis, never pushing the header

**Out of scope:**
- Other languages
- Describing a Patch with an AI model (the phrase is written by rules, in the page)
