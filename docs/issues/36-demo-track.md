# 36: The Demo as a track

**What to build:** The Demo becomes one original track instead of a tour of famous tunes: about 75 seconds of punchy, modern electronic music in A minor at 128 BPM, built like a set (an intro, a build, a break, a riser, a drop, an ending). Every section is a Preset, loaded exactly on the bar line so the music never stops; the builds and drops are knobs turning, the way a producer performs a synth live. While it plays, the page follows the knob being turned: the section it sits in scrolls into view when it is out of sight, so the Viewers that knob changes are on screen. From the owner, 2026-10-25: the old Demo felt cheesy.

**Blocked by:** none

**Status:** done. 75 seconds, 40 bars at 128 BPM over Am–F–C–G: Kick (4 bars), Acid (8), Poly Pluck (8), Strings (4), Self-Oscillation as the riser (2, the last beat silent), Wobble (8), Brass Section (4, then the first chord left to ring). Knobs turn on the same look-ahead as the Notes, so the Wobble's LFO Rate jumps are in force when each bar's first Note restarts it. On a laptop every section is usually on screen and the page stays put.

The owner's calls (2026-10-25):

- **Synth only.** No drum machine or backing under it: everything heard is the one Patch, so the Viewers explain every sound. The punch comes from the synth's own Kick, Acid, Wobble and stabs.
- **One track,** at one tempo, Preset changes on the bar, not a stop-and-start tour.
- **The view follows the moving knob,** on every screen, only when its section is out of view; a scroll of the person's own stops the following until the next section of the track.

- [x] The track: Kick intro, Acid build, Pluck arpeggio, Strings break, Self-Oscillation riser, Wobble drop, chord stabs to end; every phrase whole bars, every Preset loaded before its first Note is handed to the engine
- [x] Knob moves that show each Viewer: the Response Curve crossing the Harmonics (Acid), the Spectrum's gaps sliding (Pulse Width on the pluck), the LFO plot quickening in time with the beat (Strings, Wobble)
- [x] The page scrolls to the section of the knob being turned, and stops following while the person scrolls
- [x] From a Share link, the welcome still plays a short riff on the shared Patch, untouched
- [x] Unit tests for the track and the player; the Demo's e2e tests updated
- [x] CONTEXT.md, the Demo's tip and About's credits updated
