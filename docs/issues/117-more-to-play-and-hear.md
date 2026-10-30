# 117: More to play and hear

**What to build:** Six ideas from Claude's brainstorm (inbox, 2026-10-30), kept by the owner, each a yes or no:

- **A legato mode:** a Note played while another is held glides there without restarting the Envelopes. Today a held key's next Note keeps the Oscillators running (issue 94) but starts both Envelopes again.
- **An additive oscillator:** each Harmonic's level set by drawbars, as on an organ, building the Spectrum by hand beside the Ideal Reference. The browser's custom waves make it natively.
- **Unison, a thick supersaw:** out of scope in the PRD, the Viewers following one Note ([ADR-0007](../adr/0007-optional-polyphony-viewers-follow-the-newest-note.md)).
- **Hard Sync:** Osc 1 restarting its cycle each time Osc 2 does. Left out of [89](./89-cross-modulation.md). The browser's own oscillators cannot be reset mid-cycle, so it needs custom audio code, against [ADR-0001](../adr/0001-native-web-audio-nodes-over-custom-dsp.md).
- **A peak Filter mode:** the notch already exists (low-pass, high-pass, band-pass, notch); the browser's peaking filter boosts a band without cutting anything, more an equaliser than a synth filter.
- **Recording or WAV export:** to share a sound, not only a link. Out of scope in the PRD. The browser records its own output natively.

**Blocked by:** none

**Status:** needs-triage · enhancement. Questions for the owner below.

## Questions for the owner

1. **Legato mode?** Claude's recommendation: yes, a switch beside Glide with one Voice: a Note played over a held one slides there and the Envelopes carry on, as on a classic monosynth.
2. **The additive oscillator?** Claude's recommendation: yes, but later, as its own issue to grill: it teaches the Spectrum directly, but it is a new panel of nine or more faders.
3. **Unison?** Claude's recommendation: no, out of scope as the PRD says (the Viewers can follow one Note only). To `.out-of-scope/`.
4. **Hard Sync?** Claude's recommendation: no, as long as ADR-0001 holds. To `.out-of-scope/`, naming the ADR.
5. **A peak mode?** Claude's recommendation: no; the notch covers the case worth teaching. Dropped.
6. **Recording?** Claude's recommendation: yes, a small one: a record button that captures what is played and saves a WAV file, with the Patch's Share link beside it. The PRD's scope amended.
