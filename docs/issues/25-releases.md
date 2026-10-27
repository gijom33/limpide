# 25: Releases

**What to build:** The new look ships in minor versions as its issues land, not as one 2.0.0: each push bumps the minor version, after a full-suite run, when the owner says so. A 2.0.0 comes only if the owner asks for one.

**Blocked by:** none

**Status:** ongoing

- [x] 1.2.0 (2026-10-24): look B controls and faders (issue 19), the LFO & Envelopes section and the Mixer tab (issue 22), the Hold rhythm by pattern
- [x] 1.3.0 (2026-10-25): the phone section strip (issue 23), modulation rings (issue 20), the piano's pitch dots (issue 21), two LFOs with six destinations and a falling saw (issue 26), evenly spaced faders, shaded octave buttons
- [x] 1.3.1 (2026-10-25): About centred at every size, an ⓘ button at every width, and a welcome for a first visit (issue 24)
- [x] 1.4.0 (2026-10-25): the Maths Layer (issue 14), LFO Retrigger (31), 13 new Presets (32), the phone header sliding to the piano with Display and the MIDI status beside About (29), the design-principle checks and their waivers (17, 27, 28), tighter rows (33) and small fixes (30)
- [x] 1.4.1 (2026-10-25): chosen options and Retrigger filled with their section's colour, Retrigger an icon named below it, the phone's octave buttons stacked beside the piano, the playing buttons apart from the settings
- [x] 1.5.0 (2026-10-25): the C16 layout, a section per bank (issue 34, ADR-0009); Quick Setup for any Controller, in the page's order; a call to play while the browser holds sound back (35); the Demo an original 75-second track (36); one width for every curve (37); MIDI messages channel first, and a truthful notice on iPhone and iPad
- [x] 1.6.0 (2026-10-26): the sections 2 × 2 between a phone and a laptop, for a foldable opened flat or a small tablet (issue 38), with no more sideways scroll at 601 px; MIDI Learn tested on the LFO Waveform and Destination selectors (22, 26); the flaky timing and contrast tests fixed
- [x] 1.7.0 (2026-10-26): multi-touch on the piano, each finger its own Note (issue 39); four across from 1920 px, LFO & Envelopes a column beside the stages and the Viewers taller (43)
- [x] 1.8.0 (2026-10-26): one header across the layouts (issue 44): the same order of buttons everywhere, the octave buttons stacked beside the piano, the 17 keys at a finger's width from the 2 × 2 layout up, and in 2 × 2 a header that stays on top and slides away as on a phone; issue 41 traced to an article on zero-delay feedback filters
- [x] 1.8.1 (2026-10-26): the 2 × 2 layout's four sections share one inner margin, their headings level, LFO & Envelopes' plot reaching the Amp's bottom
- [x] 1.9.0 (2026-10-26): the Demo at 60 fps (issue 45); a start that survives refused storage, asks for MIDI only when the MIDI panel opens, and says so if it fails (46); one inner margin per section and the Filter Envelope on one line at every width (47); a long press on touch screens shows what a control does, and About credits the work and links the source and third-party notices (48, 49); the licence notices shipped with the site, plain privacy words and the visit counter left out of forks (review 11); the Response Curve stops at the floor, Harmonic labels on the first eight, LFO plots at full height, the favicon for Safari; Firefox holds a value where it lacks cancelAndHoldAtTime; unit, engine and e2e tests run before each deploy
- [x] 1.10.0 (2026-10-26): Tutorials (issues 40, 57, 58): Bass, Acid, Pluck and Wobble rebuilt from Init one Step at a time, the visitor turning each control, opened from the Patches panel or the Welcome; the Demo explains itself (50): a card with the sound, what to listen for, its part of seven and Stop, a word when a Note stops it, and a Kick a phone can play; the sections tinted with their colours, Harmonic labels on the first seven, no Ideal rings below the floor, a favicon.ico for Safari
- [ ] Each later release: full suite green, README screenshots refreshed when the look changed, minor version bumped, pushed on the owner's word
