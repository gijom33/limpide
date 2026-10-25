# 33: Tighter rows

**What to build:** The Oscillators and Amp sections take as little height as the LFO & Envelopes section does for what they hold: rows sit closer together, so more of the instrument is on screen, above all on a phone. From the inbox, 2026-10-25.

**Blocked by:** none

**Status:** done, with a finding. Rows of controls are now 8 px apart everywhere, as the LFOs' are (they were 12 px between the Oscillator tabs, the Waveform row and the Tuning row, and between every stage's rows on laptops). That saves 8 px in the Oscillators on a phone and gives the Viewers 8 px more on a laptop; the Amp was already at 8 px on phones. Most of the two sections' height is their Viewers (230 px on a phone) and their knobs and faders, not spacing. On laptops the Oscillators and Amp look roomier because all three stages share the Filter's height, so their Viewers line up (issue 15, A9).

- [x] The gaps between the Oscillators' rows (tabs, Waveform, Tuning) and the Amp's (Voices, Envelope) measured against the LFO section's, and brought down to match
- [x] Phone and laptop both; nothing overlaps, the whole app still fits 1440 × 900 without scrolling, every control keeps its target size waiver
