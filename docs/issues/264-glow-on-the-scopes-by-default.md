# 264: Glow on the Scopes by default

**What to build:** The owner's idea (inbox, 2026-11-07): "Make glow on scopes the default." Display's Glow, built by [229](./229-three-glow-choices.md) as Off, Scopes and All, starts on Scopes instead of Off. This reverses 229's decision 3 ("Off by default, as now").

**Blocked by:** none

**Status:** done (2026-11-07). Built (2026-11-07) on night/2026-11-07 and merged into main on 2026-11-07, approved by the owner, untried: "Merge the night"; released in 1.27.0. In v1 as polish of 229's Glow ([131](./131-v1.md)), Claude's call, open to the owner (2026-11-07).

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
- [x] A unit test: with nothing stored, the recalled Glow is Scopes; a stored Off stays Off
- [x] An end-to-end test: a first visit shows the Scopes glowing and the Spectrums not
- [x] The tests that measured the Viewers without Glow still pass (setting Off where they need it)
- [x] The statistics' running-app rows noted if the default's cost moves them

**Out of scope:** Glow's look; the All choice.

## How it was built

Built at night, 2026-11-07, full tier.

- **The default:** the remembered settings' Glow starts on Scopes when nothing is stored for it, so each Scope fades its past traces and the Spectrums draw only now. A stored choice is kept: Off, Scopes or All as saved, and an older page's `true` or `false` as All or Off (decision 1). The app has no reset to defaults, so decision 2 has nothing to act on yet.
- **Words:** `CONTEXT.md` and the design principles say Scopes by default; 180 (decision 5 and its Glow note), 199 (decision 2) and 229 (decision 3 and its "How it was built") each gain a dated line pointing here. The Glow tip never named a default; its how, which asked to "Choose Scopes or All", now reads "With Scopes or All, add some Noise in the Mixer: the flicker softens into a cloud."
- **Tests:** a unit test recalls Scopes with nothing stored, and with a value it does not know; a stored Off stays Off. The Viewer store starts on Scopes. In the browser, a visit with nothing stored shows Scopes chosen, every Scope glowing and every Spectrum without past outlines; Off, chosen, comes back after a reload. Checked that this test fails on the old default. The Display panel's remembered settings now choose All, since choosing Scopes no longer shows it is remembered; the design audit's "Glow on" state, All, goes back to Scopes when it closes, so the states after it see the page as a visitor does. No spec measuring the Viewers needed Glow set Off: only the Glow specs read a Viewer's past traces, the pixel checks (the smoke test, the Envelope Timeline, a frozen frame) look for ink or for no change, and the Viewers' rest waits a Glow's length whatever the choice (issue 214).
- **Statistics:** the running-app states (`scripts/measurePerformance.ts`, `scripts/measureStatistics.ts`) store only the welcome and Bead, never a Glow, so from the next release's stats run they measure the Scopes glowing. Not measured tonight: the next release's `npm run stats` measures it. Glow's frame cost, measured in 199, was a few tenths of a millisecond a frame.
- **Run:** `npx tsc`, `npm run lint`, the unit tests of `src/app`, `src/viewers` and `src/ui` (all passed), and the viewerControls, displayPanel, viewersRest, enginePause, smoke, envelopes, tooltips, geek, stageColours and design audit specs in Chromium (135 passed) and WebKit (133 passed, 2 failed), then tooltips and touchTips again after the tip's words changed, in both. The two WebKit failures, the light theme's contrast at the two narrowest phone widths (the section strip's "LFO & Envelopes" over the Tutorial's and the Tour's cards at 4.47:1), fail the same on `b9d2af0`, before this change: not Glow's.
- **Review** (Standards and Spec): the dated lines in 180, 199 and 229 did not say who decided, and 229's and 180's notes of how Glow was built had no line beside them; fixed. The tip's how asked to choose what is now chosen; reworded.

**Claude's calls, open to the owner:**

1. A browser that stored its Display settings with Glow Off, by choice or only because it saved another Display setting while Glow was Off by default, keeps Off: the store keeps what it holds and cannot tell the two apart (decision 1 as written). Only a browser with nothing stored for Glow starts on Scopes.
2. A stored Glow the app does not know starts on Scopes, the default, as every other remembered setting does with a value it does not know; before, it started Off.
3. The tip's how reads "With Scopes or All, add some Noise in the Mixer" rather than asking to choose Scopes, now chosen at first.
4. The running-app statistics are left to the next release's stats run, which will measure them with the Scopes glowing.

**To try in the app:** in a private window (nothing stored), open the page and play a Note with some Noise in the Mixer: the Scopes leave a soft trail, the Spectrums stay sharp, and Display's Glow shows Scopes. Choose Off and reload: it stays Off. In your usual browser, Glow comes back as you last left it.
