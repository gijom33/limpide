# 45: The Timeline's draw cost

**What to build:** The Envelope Timeline replays the whole 30 s Modulation history for every pixel column, every frame: `src/viewers/timeline.ts:54` calls `modulationAt` (`src/engine/synthEngine.ts:620`) about 500 times a frame, each replaying `envelopeLevel` (`src/modulation/envelope.ts:37`) from the history's start, and `trim` (`synthEngine.ts:550`) runs only when a new event arrives. Measured by [review 9](../reviews/2026-10-26/9-ts-react-webaudio.md) on the live site: 3.7 ms a frame at load, 31 ms after 600 Notes, and it stays there in silence; the Demo at 35 fps on an M2 after 30 s, 6.6 fps with the CPU slowed 4×. From the inbox, 2026-10-26.

**Blocked by:** none

**Status:** done (2026-10-26). 25 s into the Demo at 1440 × 900 in Chromium: 60 fps (the screen's rate) where the live 1.8.1 gave 31; with the CPU slowed 4×, 12.6 fps against 5.8 (measured on the dev build, the slower one). A second cost turned up in the profile and is fixed too (below). **Before the LinkedIn post:** yes (every visitor who plays the Demo for half a minute pays for it; a phone more than a laptop)

- [x] A test that failed (32 ms a frame of 500 moments after 600 Notes, against 1.3 after 10): `modulationAt` costs no more per moment after 600 Notes than after 10; another that its Envelope levels match replaying every Gate event
- [x] Each moment one binary search: every Gate event in the history keeps the Envelope's level when it came, every pitch the slide's frequency and Note when it came (`lastAt`, `levelAfter`, `glideFrom`); the Velocity and the Gate are found by the same search, not a scan
- [x] The history trimmed on every draw: not needed once a moment costs a search (the history stays bounded at 4,096 entries and 30 s past the newest event)
- [x] Measured again (status above); `modulationAt` went from about half of each frame to 1 %
- [x] Found in the profile once the Timeline was cheap: every Patch change (every frame while the Demo turns knobs) rebuilt the pulse's Fourier series for each Voice's two Oscillators, 24 ms a change with 8 Voices, 39 % of the time. `harmonicSeries` now keeps the series it has computed, by their arguments (64 at most); a test holds a pulse Patch change near a saw's
