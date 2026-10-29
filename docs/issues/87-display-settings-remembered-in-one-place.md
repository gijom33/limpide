# 87: Display settings remembered in one place

**What to build:** From the 1.15.0 review (2026-10-28): Display settings are remembered three ways (the Viewer settings store's key, the overlays' own key, and the app's on/off pairs for the letter keys and Tooltips), with the load-and-check code copied between the store and the overlays, a try/catch around a storage that never throws, and a key named only `KEY`; which Display settings are remembered is answered in two places. Nothing visible changes.

**Blocked by:** none

**Status:** ready-for-agent · enhancement

## Agent Brief

**Category:** enhancement
**Summary:** One module remembers every Display setting (the Viewers' settings, the overlays, the letter keys, Tooltips, the theme), with one way to read back and check a saved value.

**Current behavior:**
- The Viewer settings store saves five settings under one key and the overlays under another, each with its own parse-and-check code.
- The app keeps the letter keys and Tooltips as on/off strings with a state and an effect each; the theme saves itself.

**Desired behavior:**
- One place says which Display settings are remembered and reads each back checked against the values it may take, a missing or garbled one starting at its default.
- What a reload restores is unchanged, including choices saved under today's keys (a browser that saved them before keeps them).
- Freeze and the Snapshot are still never saved.

**Key interfaces:**
- The Viewer settings store's saved state, and how the app reads and writes the letter keys, Tooltips and the theme

**Acceptance criteria:**
- [ ] `npx tsc`, `npm run lint`, `npx vitest run` and `npx playwright test` green, no Playwright test changed
- [ ] One read-back-and-check helper; no copied parse code
- [ ] A node test: settings saved under today's keys come back after the change

**Out of scope:**
- Remembering anything not remembered today
- The Patch library's storage

## Decisions (triage, 2026-10-28)

1. A tidy-up issue, ready for an agent, after 1.15.0. Claude's call, open to the owner.
