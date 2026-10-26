# 54: Docs that agree with the code, CI that runs every suite

**What to build:** What a sceptic quotes as unreviewed AI output: the documents contradict the code or themselves ([review 4](../reviews/2026-10-26/4-ai-expert.md), [review 8](../reviews/2026-10-26/8-oss-sceptic.md), [review 10](../reviews/2026-10-26/10-methodology.md)), and the README says every push is tested while CI runs only the unit tests. From the inbox, 2026-10-26.

**Blocked by:** none

**Status:** to do. **Before the LinkedIn post:** yes (the post invites people to read the repository)

- [ ] The PRD: "Limpide (formerly Limpide)" (line 11), tooltips no longer out of scope, the testing decisions as they are (three suites, not one smoke test)
- [ ] ADR-0007's consequences agree with each other and with the code (the Amp Tap's default is the sum, `'all'`); ADR-0001 no longer promises the Ghost
- [ ] `CONTEXT.md`: the Preset entry without a count that ages; the stray `_Avoid_` line moved to Preset
- [ ] The comment at `src/engine/synthEngine.ts:15` on the Amp Tap's default
- [ ] CI (`.github/workflows/deploy.yml`) runs the engine suite and the Playwright e2e suite before deploying, both browsers, or the README says what it runs
- [ ] A pass over every ADR and the glossary against the code, findings fixed or logged
