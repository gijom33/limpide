# Monophonic by design

**Superseded by [ADR-0007](./0007-optional-polyphony-viewers-follow-the-newest-note.md):** a Patch may now have up to eight Voices; the Viewers follow the newest Note.

Limpide has exactly one Voice, with last-note Note Priority. Overlapping notes make the Scope unreadable and blur the Spectrum's Harmonic ladder, which defeats the purpose of the app, which is seeing *why* a sound sounds the way it does. Polyphony is deliberately out of scope. It's not a missing feature.
