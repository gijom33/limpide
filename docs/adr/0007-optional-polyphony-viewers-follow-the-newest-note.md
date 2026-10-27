# Optional polyphony; the Viewers follow the newest Note

**Status:** accepted · **Date:** 2026-10-22 · **Decided by:** the owner

Supersedes [ADR-0005](./0005-monophonic-by-design.md).

A Patch chooses its number of Voices, 1 to 8. At 1 the instrument is exactly what ADR-0005 described: one Voice, last-note Note Priority, Glide between Notes. At 2 to 8, each new Note takes a free Voice (or the oldest one when none is free) and sounds alongside the others, so chords can be played and held.

Whatever the number of Voices, every Viewer shows the Voice of the **newest Note**, exactly as if it were played alone: the three Taps (Oscillator, Filter, Amp), the Scope's Cycle Lock, the Harmonic Markers, the Ideal Reference, the Response Curve and the Envelope Timeline. The sound is the sum of all Voices.

## Why not show every Voice

ADR-0005 was right about what overlapping Notes do to the Viewers. The Scope locks to one fundamental: a chord has no single period and would never stand still. The Harmonic Markers, Ideal Reference and Response Curve are computed for one fundamental, one Velocity and one Envelope; a chord would show one Note's markers over another Note's peaks. The Envelope Timeline draws one Amp Envelope and one Effective Cutoff. Summing the Taps would turn all of this into decoration, which is what ADR-0005 was written to avoid.

Following the newest Note keeps every Viewer meaningful with no new UI, and matches what the hands are doing: the Note just played is the one being looked at. Learners stay with 1 Voice to study a sound; players turn Voices up to play.

## Considered Options

- **Stay monophonic** (ADR-0005): no chords, ever. Rejected by the user: polyphony for playing is wanted, defined per Patch.
- **Sum the Taps and switch off Cycle Lock, Markers and Ideal Reference while a chord sounds:** cheaper, honest, but the Scope and Timeline become unreadable during the very thing the player is doing.
- **One Viewer column per Voice:** breaks the left-to-right signal-flow layout (the columns are stages, not Voices) and does not fit the 1440×900 promise.

## Consequences

- The engine builds eight Voice chains from one Voice factory; the LFO, master level and safety stage are shared. The three Tap analysers are shared and reconnected to the newest Note's Voice at each Note On, so the Viewers' canvases and the render loop are untouched (ADR-0002).
- The Modulation model's history (Gate events, pitches, Velocity) is the newest Note's, which is what it already was in mono: a Note On from any Voice starts a new segment; only the newest Voice's Note Off records a Gate off. The Timeline, Response Curve and Cycle Lock therefore need no change (ADR-0003).
- Glide and last-note priority are mono behaviours; with 2 or more Voices, Notes start at pitch and no Note replaces another's pitch. Hold keeps every sounding Voice sounding until Hold is turned off or the Voice is taken by a new Note.
- The Display panel's "Viewers follow" chooses what the Amp Tap carries: All (the default) sums every Voice, so a chord is seen at the Amp as it is heard at the output; Newest shows the newest Note's Voice there too. The Oscillator and Filter Taps, the Markers and the Timeline always follow the newest Note, so the Amp Scope is the only Viewer that cannot Cycle Lock during a chord.
- The output's safety stage (ADR-0006) protects the listener from eight full-level Voices.
- Amended the same day (2026-10-22): the Amp Tap's default became the sum (All), the option first rejected above, but at the Amp Tap only, where a chord is what the player hears; the rest of this decision stands.
- Patches saved before this ADR load with 1 Voice (the migration default), so every existing Preset and saved Patch sounds as before.
