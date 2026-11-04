# 229: Three Glow choices

**What to build:** The owner's idea (inbox, 2026-11-04): "Regarding the glow settings in the display menu, I think we should have three options: no glow at all, glow only for the scope, or glow for both scope and spectrum." Display's Glow is Off or On today, On fading the past traces of every Scope ([180](./180-steadier-scopes.md)) and, since 1.23.0, every Spectrum's outline ([199](./199-glow-on-the-spectrum.md)). Polish for v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-agent · enhancement. Polish for v1

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
- [ ] Display shows Glow as Off, Scopes and All; each choice draws as described (browser tests on the Scope's and the Spectrum's glow)
- [ ] A remembered On is read as All, a remembered Off as Off (unit test)
- [ ] The tip names the three; the design audit's Glow state uses All
- [ ] The words test passes

**Out of scope:**
- How Glow fades (its 250 ms)
