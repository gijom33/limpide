# 199: Glow on the Spectrum too

**What to build:** The owner's idea (inbox, 2026-11-02): "The glow effect should probably apply to the spectrum viewer too." Display's Glow ([180](./180-steadier-scopes.md), decision 5) fades the Scopes' past traces; the Spectrum was left out of 180. Polish of v1's Viewers ([131](./131-v1.md)).

**Blocked by:** none

**Status:** done (2026-11-03). Built (2026-11-02) on night/2026-11-02, merged into main, released in 1.23.0; tried by the owner: "All good."

## Decisions

Decided by the owner, 2026-11-02:

1. **Glow reaches the Spectrum** ("The glow effect should probably apply to the spectrum viewer too"). This widens 180, whose brief left the Spectrum out.

Claude's calls, let stand by the owner in 1.22.0:

2. **One Glow for both:** Display's one Glow choice turns it on for the Scopes and the Spectrums together, Off by default and remembered as now. Its tip says both. Since 2026-11-04 ([229](./229-three-glow-choices.md), decided by the owner): Glow has three choices, Off, Scopes and All, the Spectrums glowing under All alone. Since 2026-11-07 ([264](./264-glow-on-the-scopes-by-default.md), the owner's idea, Claude's call there): Scopes by default, so the Spectrums still start without it.
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
- [ ] ~~A test: with Glow on, a Spectrum keeps at most a quarter of a second of outlines, each faded by its age; off, it keeps none~~ (not checked at the time)
- [ ] ~~An e2e test: with Glow on and a sweeping Filter, a Spectrum's canvas holds past outlines; frozen, it keeps them~~ (not checked at the time)
- [ ] ~~The design audit's "Glow on" state covers a Spectrum~~ (not checked at the time)
- [ ] ~~The Viewers' frame cost stays within its bound; every test passes in Linux's fonts too~~ (not checked at the time)

**Out of scope:**
- The Envelope Timeline
- Changing Glow's length or decay (180's)

## How it was built

Built 2026-11-02 on `night/2026-11-02`, test-first.

- **One Glow, kept in one place:** the Scope's keeping and fading of its past traces became a module of its own, which the Scopes and now the Spectrums both use; the Scopes draw exactly as before. A unit test covers it: at most a quarter of a second kept, oldest first, each faded by 0.85 per 60th of a second of age, one per 60th of a second on a 120 Hz screen, none while Off, and frozen the ones it had, faded as they were.
- **The Spectrum:** with Glow on, each Spectrum strokes its past outlines, faded, under the newest outline and its fill; the fill, the Response Curve, the Harmonic Markers, the Ideal Reference and the readout draw only now (decision 3). Frozen, it keeps its glow (decision 5). The Spectrum's own averaging is untouched (decision 4).
- **Words:** Glow's tip, the Display panel's description and the glossary's entry now say the Scopes and the Spectrums, the tip naming a Filter Envelope's sweep among what glows.
- **Tests:** an e2e test turns the Filter Envelope's Amount up, turns Glow on and plays a Note: every Spectrum holds past outlines, and frozen, the Filter Spectrum keeps them past twice the Glow's length. The design audit's "Glow on" state now waits for the Amp Spectrum's glow too.
- **Frame cost**, measured at 1440 × 900 in Chromium with a Note held (the median frame, three rounds): Glow On 3.4 ms a frame against 3.1 to 3.2 ms before; Off unchanged at 3.6 to 3.7 ms.

Claude's calls, let stand by the owner in 1.22.0:

- **An outline drawn on another axis or width is passed over:** switching the frequency axis between log and linear, or resizing, would otherwise leave a quarter of a second of outlines in the wrong place.
- **Each past outline is drawn at the live outline's width** (1.5 device pixels), so a moving Harmonic's trail stays as fine as the Harmonic.

**To try in the app:** open Display, turn Glow On, turn the Filter Envelope's Amount up and play a few Notes: the Filter and Amp Spectrums leave a soft trail of the Harmonics as the Cutoff sweeps; a held Note settles sharp. Add some Noise or detune Osc 2 and the outline softens. Press Space to freeze: the glow stays.

