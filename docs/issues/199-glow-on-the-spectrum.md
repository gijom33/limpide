# 199: Glow on the Spectrum too

**What to build:** The owner's idea (inbox, 2026-11-02): "The glow effect should probably apply to the spectrum viewer too." Display's Glow ([180](./180-steadier-scopes.md), decision 5) fades the Scopes' past traces; the Spectrum was left out of 180. Polish of v1's Viewers ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-agent · enhancement. Polish for v1

## Decisions

Decided by the owner, 2026-11-02:

1. **Glow reaches the Spectrum** ("The glow effect should probably apply to the spectrum viewer too"). This widens 180, whose brief left the Spectrum out.

Claude's calls, open to the owner:

2. **One Glow for both:** Display's one Glow choice turns it on for the Scopes and the Spectrums together, Off by default and remembered as now. Its tip says both.
3. **Only the live outline glows:** the Spectrum's past outlines fade under the newest, by 0.85 every 60th of a second for a quarter of a second, as on the Scopes. Its fill underneath, the Response Curve, the Harmonic Markers, the Ideal Reference and the hover readout draw only now, so the marks still read clearly.
4. **Where it shows:** a Filter Envelope's sweep leaves a trail of the moving Harmonics, Noise and detune soften, a held steady Note stays sharp. The Spectrum's own averaging between frames stays as it is.
5. **Frozen,** a Spectrum keeps its glow, as a frozen Scope does.

## Agent Brief

**Category:** enhancement
**Summary:** Display's Glow, which fades each Scope's past traces, applies to the Spectrums too.

**Current behavior:** With Glow on, each Scope redraws its traces of the last quarter of a second under the newest, each fading by 0.85 every 60th of a second. The Spectrums draw only their newest outline.

**Desired behavior:**
- With Glow on, each Spectrum redraws its outlines of the last quarter of a second under the newest, faded the same way, kept by time so a fast screen draws no more.
- Only the live outline glows; the fill, the Response Curve, the Harmonic Markers, the Ideal Reference and the readout draw only now.
- Frozen, it keeps its glow. Off, the Spectrum looks as now.
- One Glow choice for the Scopes and the Spectrums; its tip and the glossary say so.

**Key interfaces:**
- The Spectrum's drawing, and the Scope's Glow as the model to follow
- Display's Glow setting
- Glow's tip and the glossary's entry

**Acceptance criteria:**
- [ ] A test: with Glow on, a Spectrum keeps at most a quarter of a second of outlines, each faded by its age; off, it keeps none
- [ ] An e2e test: with Glow on and a sweeping Filter, a Spectrum's canvas holds past outlines; frozen, it keeps them
- [ ] The design audit's "Glow on" state covers a Spectrum
- [ ] The Viewers' frame cost stays within its bound; every test passes in Linux's fonts too

**Out of scope:**
- The Envelope Timeline
- Changing Glow's length or decay (180's)
