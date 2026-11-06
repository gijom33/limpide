# 229: Three Glow choices

**What to build:** The owner's idea (inbox, 2026-11-04): "Regarding the glow settings in the display menu, I think we should have three options: no glow at all, glow only for the scope, or glow for both scope and spectrum." Display's Glow is Off or On today, On fading the past traces of every Scope ([180](./180-steadier-scopes.md)) and, since 1.23.0, every Spectrum's outline ([199](./199-glow-on-the-spectrum.md)). Polish for v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** done (2026-11-04). Built (2026-11-04) on night/2026-11-03, merged into main, released in 1.24.0; accepted by the owner, tried in part and the rest trusted: "All issues waiting on my feedback look fine, I tested some, others trust you."

## Decisions

Decided by the owner, 2026-11-04:

1. **Three choices for Glow in Display:** no glow, glow on the Scopes only, glow on the Scopes and the Spectrums.

Claude's calls, open to the owner:

2. **Their words on screen: Off, Scopes, All,** in Display's segmented control as its other choices are, the tip saying what each draws ("All: the Scopes' traces and the Spectrums' outlines").
3. **Off by default,** as now.
4. **A remembered On reads as All,** what On drew in 1.23.0; a remembered Off stays Off.

## Agent Brief

**Category:** enhancement
**Summary:** Display's Glow has two choices, Off and On; the owner wants a middle one that glows the Scopes alone.

**Current behavior:** Glow is Off or On; On fades the past traces of every Scope and every Spectrum's outline. The setting is remembered as on or off.

**Desired behavior:**
- Glow offers Off, Scopes and All: Scopes fades the Scopes' past traces only, the Spectrums drawn as with Glow off; All does both, as On does now.
- Off by default; a setting remembered as On comes back as All.
- The Glow tip says what each choice draws.

**Key interfaces:**
- Display's Viewer controls and their tip
- The remembered view settings
- The Scopes' and the Spectrums' Glow

**Acceptance criteria:**
- [x] Display shows Glow as Off, Scopes and All; each choice draws as described (browser tests on the Scope's and the Spectrum's glow)
- [x] A remembered On is read as All, a remembered Off as Off (unit test)
- [x] The tip names the three; the design audit's Glow state uses All
- [x] The words test passes

**Out of scope:**
- How Glow fades (its 250 ms)

## How it was built

- **Three choices:** Display's Glow is a segmented control of Off, Scopes and All, Off by default. Scopes fades each Scope's past traces and draws the Spectrums as with Glow off; All fades both, as On did. One rule says which Viewer glows under which choice, read by the Scopes and the Spectrums each frame, so a silent Spectrum still rests when Glow moves between Off and Scopes.
- **Remembered:** the setting keeps its key and its field; it now holds `off`, `scopes` or `all`. A `true` saved by 1.23.0 reads as All, a `false` as Off (decision 4), anything else as Off. Claude's call, open to the owner: the remembered settings gained a small way to read an older value as the one it now stands for, and their header says a value may change its form so long as the old one is still read.
- **Words:** the tip ends "Off: the Scopes and Spectrums show only now. Scopes: the Scopes' traces glow. All: the Scopes' traces and the Spectrums' outlines." and its how says "Choose Scopes or All with some Noise in the Mixer". Claude's call, open to the owner. `CONTEXT.md`, the design principles and dated lines in 180 (decision 5) and 199 (decision 2) say the same.
- **Switching** between any two choices starts a Viewer's wait before it rests again, as switching Glow did since 214, Scopes to All included, though the Scopes draw the same under both: Claude's call, open to the owner (a quarter of a second more drawing, nothing seen).
- **Tests:** a unit test reads `true`, `false` and the three choices back; one says which Viewer glows under each; the store's tests use the choices. In the browser, Scopes makes every Scope glow and is remembered across a reload; with a Filter Envelope sweeping, Scopes leaves every Spectrum at no past outline while the Filter Scope glows, and All gives every Spectrum its outlines, kept frozen. The Display panel's remembered settings choose Scopes; the design audit's "Glow on" state chooses All. Checked that the Spectrum test fails when the Spectrums glow under Scopes.
- **Run:** `npx tsc`, `npm run lint`, the unit tests of the files touched (the words test among them, 303 passed), and the displayPanel, viewerControls, viewersRest and design audit specs in Chromium and WebKit (73 passed each, before and after the review). The review found docs still saying one Glow (180, 199, the design principles), the tip's how saying "turn it on", and a comment out of place; fixed.

**To try in the app:** open Display: Glow shows Off, Scopes and All. Turn the Filter Envelope's Amount up, add some Noise and play: under Scopes the Scopes leave a soft trail and the Spectrums stay sharp; under All both trail. Reload: the choice comes back. A browser that had Glow On in 1.23.0 opens on All.
