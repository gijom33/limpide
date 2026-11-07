# 264: Glow on the Scopes by default

**What to build:** The owner's idea (inbox, 2026-11-07): "Make glow on scopes the default." Display's Glow, built by [229](./229-three-glow-choices.md) as Off, Scopes and All, starts on Scopes instead of Off. This reverses 229's decision 3 ("Off by default, as now").

**Blocked by:** none

**Status:** ready-for-agent · enhancement. In v1 as polish of 229's Glow ([131](./131-v1.md)), Claude's call, open to the owner (2026-11-07).

## Decisions

Claude's calls, open to the owner (2026-11-07):

1. **A Glow already remembered is kept:** a visitor whose browser stored a choice (Off, Scopes or All, or the old On or Off) comes back to it; only a first visit, or a browser with nothing stored, starts on Scopes.
2. **Reset to defaults,** wherever the app has one, brings Glow back to Scopes.

## Agent Brief

**Category:** enhancement
**Summary:** Display's Glow starts on Scopes rather than Off.

**Current behavior:** With nothing remembered, Glow is Off: the Scopes and the Spectrums draw without fading traces.

**Desired behavior:**
- With nothing remembered, Glow is Scopes: each Scope fades its past traces, the Spectrums draw as with Glow off.
- A remembered Glow is kept as now (decision 1).
- 229's notes, the Display tip and any words or tests saying Glow is off by default say Scopes; 229 gains a Since then line pointing here.

**Key interfaces:**
- The remembered settings' default for Glow
- Display's Glow control
- The Viewers' tests that assume no Glow

**Acceptance criteria:**
- [ ] A unit test: with nothing stored, the recalled Glow is Scopes; a stored Off stays Off
- [ ] An end-to-end test: a first visit shows the Scopes glowing and the Spectrums not
- [ ] The tests that measured the Viewers without Glow still pass (setting Off where they need it)
- [ ] The statistics' running-app rows noted if the default's cost moves them

**Out of scope:** Glow's look; the All choice.
