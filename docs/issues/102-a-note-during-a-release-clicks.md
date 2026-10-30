# 102: A Note played during a Release clicks

**What to build:** From the fourteen reviews of 1.16.0 (the inbox, 2026-10-30; review 2, [report](../reviews/2026-10-30/2-synth-enthusiast.md)). Since [94](./94-oscillators-restart-on-each-note.md) each Note restarts the Oscillators, the owner's call so that a Patch sounds the same whatever came before. Its legato fix covers a key still held; a Note played while the last one is still in its Release restarts them mid-sound. Measured offline, not heard: the steepest step is 16 times the steady sine's on Init, 28 times with a 1.5 s Release; a chord struck again bursts to 3.6 times Glass Pad's sustain; a stolen held Voice jumps 18 times.

**Blocked by:** none

**Status:** done (2026-10-30). A Note reaching a Voice still sounding (in its Release, or taken while held) takes it in a straight line to silence over 3 ms, then restarts the Oscillators and starts, 3 ms late; a Note into silence starts at once, and a legato one slides on as before. Not yet heard by the owner.

## Question for the owner

Which way, when a Note reaches a Voice that is still sounding?

1. **A quick dip (Claude's recommendation):** the Voice fades to silence in about 3 ms, then the Oscillators restart and the Note starts, about 3 ms late. Every Note still starts the same way (issue 94's aim), and the dip is too short to hear as a gap. Many hardware synths do this.
2. **No restart while it sounds:** a Voice still sounding carries on its cycle, as a legato Note does. No click, but a Note played into a Release no longer starts the same way as one played into silence, which is what 94 set out to end.
3. **Leave it:** the click stays, small on most Patches.

## Decisions (triage, 2026-10-30, decided by the owner)

1. The quick dip: a Voice still sounding fades to silence in about 3 ms, then the Oscillators restart and the Note starts, about 3 ms late.

## Agent Brief

**Category:** bug
**Summary:** A Note that reaches a Voice still sounding starts without a click, after a dip of about 3 ms.

**Current behavior:** the Oscillators restart mid-sound when a Note arrives during the last one's Release, or steals a held Voice: a jump up to 28 times the steady slope.

**Desired behavior:**
- A Note reaching a Voice that is still sounding (in its Release, or stolen while held) first takes that Voice to silence over about 3 ms, then restarts the Oscillators and starts its Envelopes, all about 3 ms after the Note was asked for.
- A Note reaching a silent Voice starts at once, as now.
- A legato Note (a key still held, one Voice) does not restart, as now.
- The players' Notes keep their timing relative to each other: the dip is the same for every Note that needs one.

**Key interfaces:**
- The engine's Note On and its restart of the Oscillators

**Acceptance criteria:**
- [x] An engine test plays a Note during a Release (Init, and a 1.5 s Release) and finds no step bigger than a few times the steady slope
- [x] The same for a chord struck again on Glass Pad and a stolen held Voice
- [x] A Note into silence starts within a sample of when it is asked for
- [x] The legato test still passes

**Out of scope:**
- The handed-over Notes doubling ([101](./101-handed-over-notes-stop-cleanly.md))

## How it was built

- **The dip** (`src/modulation/envelope.ts`, `src/engine/synthEngine.ts`). At a Note On the engine asks the Voice's own Amp Envelope history (each Voice now keeps one) for its level at the Note's moment; above −60 dB the Voice is still sounding. It then dips: the Amp Envelope falls in a straight line to silence over `DIP` (3 ms), and everything the Note does starts at the dip's end: the Oscillators' restart, the pitch and its Glide, both Envelopes, the Velocity, a retriggered LFO. A Note handed over ahead of the clock asks the history at its own moment, which holds the release the player handed over before it, so it dips exactly when it will still sound.
- **The model** (ADR-0003). The dip is a Gate event of its own in the Modulation model, a Gate off that falls in a straight line rather than releasing, so the Timeline and the Amp Envelope's level follow it. For its 3 ms the model reports no Note sounding.
- **Two browser details.** Chromium starts a straight ramp placed after `cancelAndHoldAtTime` mid-curve at its target at once (measured: the gain fell to 0 in one sample), so the dip sets the level it starts from, the model's, outright, then ramps. The Attack after it follows on with no hold between: without `cancelAndHoldAtTime` (Firefox) the hold would bring back the level from before the dip.
- **A Note called off before it starts** (left to this issue by [101](./101-handed-over-notes-stop-cleanly.md)). A Gate off before its Note has started (a player stopped, Hold switched off, a key let go within the dip) calls off that Note's restart of the Oscillators, which used to come inside the Release: the restart's new node is stopped before it starts, and the node sounding plays on. The browser cannot take a stop back, so it is called again for a moment that never comes (`NEVER`, 10⁹ s).
- **Tests** (`src/engine/synthEngine.browser.test.ts`, `src/modulation/envelope.test.ts`). On Init with a sine and the Filter open, a Note 54 ms into C2's Release, timed for C2's peak: the steepest step was 36 times the steady sine's (0.4 s Release) and 66 times (1.5 s, D2 or C2 again); now 1.3 times, the new Note's own Attack, as from silence. Glass Pad's C major chord struck again 0.2 s into its Release: a second difference 2.4 times its sustain's, now 0.6. A held A2 taken by A3 on 2 Voices at A2's peak: 16 times, now under 1.5. A Note called off before it starts (a player stopped, a key let go within the dip), A4's restart due at a quarter of its cycle: 9 and 7 times the held Note's steepest step, now under 1.1, and the level follows the model's (a first try at calling the restart off left a second copy playing, 1.3 times the level: the test now checks it). The Amp's gain at the Taps (the Amp Tap over the Filter Tap, sample by sample) matches the model through the dip and the next Attack within 10⁻⁴, and within 10⁻² without `cancelAndHoldAtTime`, played live (it failed with the hold kept). A Note into silence starts on the sample asked for, counted from the first Note (the limiter's oversampling delays the whole output by about 190 samples). The model test that replays every Gate event now expects the dips of its three Notes played into a Release, checked every millisecond. The legato test and the other engine tests pass unchanged.
- **Claude's calls, open to the owner.**
  1. The dip is a straight line, not the Envelopes' curve: exactly silent when the Oscillators restart, and never steeper than it must be (an exponential fall over 3 ms starts 3.5 times steeper than the steady sine, and leaves a residue).
  2. A Voice counts as still sounding while its Amp Envelope is above −60 dB (0.001); below, a Note starts at once.
  3. Only the Amp Envelope dips. The Filter Envelope starts from where it is, as before, 3 ms later: sweeping the Cutoff down within 3 ms could itself be heard on a resonant Patch.
  4. The Notes of one chord can start 3 ms apart: those reaching a silent Voice at once, those reaching a sounding one after the dip. A retriggered LFO then restarts at both moments.

**Since then (2026-10-30, the 1.16.1 code review):** a chord's Notes, asked for at the same moment, restart a retriggered LFO once, at the first moment one of them starts: where the Notes that do not dip start, when any do not (Claude's call, open to the owner). Those that dip start 3 ms into its cycle, under 6 % of a cycle at the fastest Rate (20 Hz), and the jump comes inside their dip, towards silence; restarting at the dip's end would jump the LFO 3 ms into the others' Attack. A lone Note that dips still restarts it at its own start. The model's clock calls off the restarts after one, as the sound does (before, the sound kept the earlier restart and the model the later). And a Gate off before its Note starts now calls off the retriggered LFOs' restarts too, in the sound and the model, as it does the Oscillators': an LFO no longer restarts inside the Release. It calls off every LFO restart after that moment, so a Note handed over on another Voice for later, still to come, would lose its own (Claude's call: no player hands Notes over that way). Tests: the Release under a square LFO keeps it down (it went back up, in the sound and the model); a chord of a dipping and a free Voice, in either order, restarts a saw LFO once at the chord, in the model and alike in the sound.
