# 17: Design principles

**What to build:** The rules the new look is judged against ([design-principles.md](../design-principles.md)), and the checks that keep them true: contrast and target sizes measured in both themes, so later issues cannot quietly break them.

**Blocked by:** none

**Status:** ready-for-agent

- [x] `docs/design-principles.md` written: structure, controls, motion, accessibility, sources
- [ ] e2e: text contrast ≥ 4.5:1 and control boundaries ≥ 3:1 in both themes, sampled from computed colours of every knob, fader, button and label
- [ ] e2e: every interactive element ≥ 24 × 24 px at 1440×900, ≥ 44 × 44 at 375×812
- [ ] e2e: every knob and fader works from the keyboard and shows a focus ring
- [ ] Today's failures listed here, each assigned to the issue that fixes it
