# 66: Square and saw LFOs overshoot their edges

**What to build:** From the 1.12.0 code review: "A square or saw LFO on Volume overshoots its edges (the LFO's Fourier series, Gibbs, about ±1.18): at full Depth the gain passes the Envelope's level by about 9 % and dips below 0 (polarity flips) for well under a millisecond at each edge, where the model stays at exactly ±1. The same overshoot reaches every destination." The sound and the pictures should agree (ADR-0003: one model for picture and sound), and a gain should never flip polarity.

**Blocked by:** none

**Status:** done · 2026-10-28. The square and saw LFOs now stay within ±1 at every Rate: their series is softened (Lanczos's sigma factors) and each LFO goes through a clamp before its Destinations, so a full-Depth tremolo never passes the Envelope's level nor flips polarity, and the sound stays with the model a millisecond from each jump. Whether the edges sound different is the owner's to hear.

- [x] A test that measures the engine's square and saw LFOs against ±1 at their edges
- [x] The fix, and the model and sound still agreeing elsewhere in the cycle

## How it was built

Claude's call, open to the owner; listening is the owner's.

**Measured** (engine tests in Chromium, `src/engine/synthEngine.browser.test.ts`, "LFO edges (issue 66)"): a sine Note with the LFO on Volume at full Depth, read at the Amp Tap and divided sample by sample by the same Note without the LFO, which gives the tremolo's gain (0.5 + 0.5 × the LFO) around a jump.

| | Before | Sigma factors alone | Clamp alone | Both (built) |
| --- | --- | --- | --- | --- |
| Gain at 1 Hz, square | −0.114 to 1.088 | −0.026 to 1.006 | 0 to 1 | 0 to 1 |
| Gain at 1 Hz, Saw Down | −0.088 to 1.114 | −0.006 to 1.026 | 0 to 1 | 0 to 1 |
| Gain at 20 Hz, square | −0.008 to 1.008 | −0.005 to 1.005 | 0 to 1 | 0 to 1 |
| Gain at 20 Hz, saws | −0.004 to 1.004 | −0.002 to 1.002 | 0 to 1 | 0 to 1 |
| Farthest from the model over 1 ms from the jump (gain, 1 Hz) | 0.025 | 0.0008 | 0.025 | 0.0008 |

So the LFO reached about +1.18 and −1.23 at 1 Hz (Chrome's rendering of the series), ringing at about 2 kHz (the series' top term, 2047 × the Rate) and still 5 % off the model a millisecond after the jump.

**The fix** (`src/engine/synthEngine.ts`): both. Each term of the square's and saws' series is multiplied by Lanczos's sigma factor, which takes the ringing out (within 0.2 % of the model a millisecond from the jump) at the cost of a corner a fraction of a millisecond rounder (about 0.4 ms from 10 % to 90 % at 1 Hz, against 0.2 ms before). Each LFO's bus is now a `WaveShaperNode` with the curve [−1, 1]: it passes −1 to 1 untouched and holds anything past at ±1. The clamp alone would leave the ringing below the top, 5 % off the model; the softening alone still passes ±1 by about 5 % at 1 Hz, so it needs the clamp. The clamp also holds at fast Rates, where the browser drops the series' top terms whatever their softening (Chrome, by its design, keeps all 2047 only below about 12 Hz at 48 kHz). Sine and triangle pass through the clamp unchanged. The model (`lfoShape`) is unchanged: the rounder corner is far below what any Viewer can draw.

**To listen:** the Trance Gate Preset (a square on Volume at full Depth), or Init with a square or saw LFO at full Depth on Volume or Cutoff at a slow Rate: each jump carried a short ring, at about 2 kHz at 1 Hz (higher at faster Rates); the ring should now be gone, the jump itself as before.

**Found on the way, not changed:** the output lags the Taps and the model by about 4 ms in Chrome (measured at 48 kHz, the same at every Rate), most likely the safety limiter's 4× oversampling; the limiter's comment says a DynamicsCompressorNode was rejected for a few milliseconds of lookahead delay. Not heard as such, but the owner may want it noted.
