# 66: Square and saw LFOs overshoot their edges

**What to build:** From the 1.12.0 code review: "A square or saw LFO on Volume overshoots its edges (the LFO's Fourier series, Gibbs, about ±1.18): at full Depth the gain passes the Envelope's level by about 9 % and dips below 0 (polarity flips) for well under a millisecond at each edge, where the model stays at exactly ±1. The same overshoot reaches every destination." The sound and the pictures should agree (ADR-0003: one model for picture and sound), and a gain should never flip polarity.

**Blocked by:** none

**Status:** ready-for-agent · bug. To diagnose first, with `/diagnosing-bugs`: whether it is heard, and what keeps the corners without the ringing (fewer terms with a smoothing window, a clamp after the LFO, or a waveshaper).

- [ ] A test that measures the engine's square and saw LFOs against ±1 at their edges
- [ ] The fix, and the model and sound still agreeing elsewhere in the cycle
