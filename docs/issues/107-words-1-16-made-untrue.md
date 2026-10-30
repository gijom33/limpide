# 107: Words that 1.16 made untrue

**What to build:** From the fourteen reviews of 1.16.0 (the inbox, 2026-10-30; reviews 1, 5 and 12, [curious contact](../reviews/2026-10-30/1-curious-contact.md), [learner](../reviews/2026-10-30/5-learner-teacher.md), [ripple hunter](../reviews/2026-10-30/12-ripple-hunter.md)):

- 19 places still state what 1.16.0 changed, listed one by one in review 12's report: tips (the LFO Destination's seven Destinations without FM, the Oscillators section, the Filter Envelope, the Noise fader, the Osc 2 tab), the styles' header comments, issues 15, 36, 44 and 63, the design principles' greyed-out examples, the Demo's "dots" now segments, a half-deleted Timeline comment, a Preset test's hand-written Destination list, and issue 82 still open on a look since replaced.
- The FM tip: on Init, FM barely changes the Spectrum (its sidebands land on the Harmonics), and the way out (Sine on both) is deep in a 120-word tip.
- The Demo's captions turn to jargon after its first four parts (Tremolo Keys, Double Wobble, Split Octave Bass) for someone who knows no music.

**Blocked by:** none

**Status:** ready-for-agent · bug

## Agent Brief

**Category:** bug
**Summary:** Every tip, comment, test name and doc listed by the review says what the app does today, and the Demo's captions speak to someone who knows no music.

**Current behavior:** as listed above; review 12's report gives each place and what is now true.

**Desired behavior:**
- **Tips:** each one review 12 names states today's behaviour (eight LFO Destinations with FM; the Sub one or two octaves down and Ring a fifth Mixer source; the Filter Envelope also moving Osc 2's pitch by its Env Amount; the Noise fader for both colours; Osc 2's Env Amount).
- **The FM tip** leads with what to do to see FM clearly (Osc 1 and Osc 2 on Sine), in its first lines.
- **Comments and test names** say what the code and the tests do now; a test listing the LFO Destinations by hand reads the one list instead.
- **Done issues** get a "Since then" line where they state what is no longer true (15, 36, 44, 63); their Status lines are left as they are. Issue 82 closes with a "Since then" line saying the 2026-10-29 header replaced its look, and its owner check is no longer due.
- **The design principles' examples** of greyed-out controls match today's rule.
- **The Demo's captions**, from Tremolo Keys on: each in everyday words first (what you hear, where to look), the synth word after it if at all, as the Kick's and Acid's are.

**Acceptance criteria:**
- [ ] Every item in review 12's findings is fixed or answered in this issue's notes
- [ ] The LFO Destination tip names all eight Destinations, by reading the one list or by a test that fails when the list grows
- [ ] Each changed tip and caption is checked against the engine (rendered or measured) before the push, as review 13 did
- [ ] Every test passes, with renamed tests checking what they did

**Out of scope:**
- The README's screenshot and sections ([111](./111-the-repository-front-page-and-community-files.md))
- Preset descriptions ([108](./108-preset-claims-and-levels.md))
- Frozen ADRs: ADR-0006's source list is left, Ring being a fifth source noted only if an ADR supersedes it
