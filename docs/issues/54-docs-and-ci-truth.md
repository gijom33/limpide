# 54: Docs that agree with the code, CI that runs every suite

**What to build:** What a sceptic quotes as unreviewed AI output: the documents contradict the code or themselves ([review 4](../reviews/2026-10-26/4-ai-expert.md), [review 8](../reviews/2026-10-26/8-oss-sceptic.md), [review 10](../reviews/2026-10-26/10-methodology.md)), and the README says every push is tested while CI runs only the unit tests. From the inbox, 2026-10-26.

**Blocked by:** none

**Status:** done (2026-10-26); CI's new steps to confirm on the next push. **Before the LinkedIn post:** yes (the post invites people to read the repository)

- [x] The PRD: "Limpide (formerly Limpide)" (line 11), tooltips no longer out of scope, the testing decisions as they are (three suites, not one smoke test)
- [x] ADR-0007's consequences agree with each other and with the code (the Amp Tap's default is the sum, `'all'`); ADR-0001 no longer promises the Ghost. ADR-0007 is amended in place with a dated line, not superseded: whether a reversal should take a new ADR is for issue 56
- [x] `CONTEXT.md`: the Preset entry without a count that ages; the stray `_Avoid_` line moved to Preset
- [x] The comment at `src/engine/synthEngine.ts:15` on the Amp Tap's default
- [x] CI (`.github/workflows/deploy.yml`) runs the engine suite and the Playwright e2e suite before deploying, both browsers, or the README says what it runs. Done: both run before the build is deployed, a failure retried once on CI (a WebKit crash was seen locally), the test results kept a week when one fails; to confirm on the next push
- [x] A pass over every ADR and the glossary against the code, findings fixed or logged. Done (2026-10-26): ADR-0003 (the Ghost, two twin filters, two LFOs), ADR-0004 (Encoder Mode detection, Quick Setup for any Controller), ADR-0006 (no OVER label since f3aa691, the compressed margin, LIMITING, the Sub, the master level by √Voices, the Amp Tap's sum), ADR-0008 (compact knob sizes, the play list's origin), ADR-0009 (Glide on bank A); the glossary's LFO, Mixer, Effective Cutoff, Nominal Level, Harmonic Marker, Envelope Timeline, Snapshot, Mapping, Action, MIDI Learn and Quick Setup
