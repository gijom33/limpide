# 78: Knobs and faders find their own tip

**What to build:** Every knob and fader knows its Parameter, yet its tooltip is chosen where it is placed: the app's main component wraps 18 of them in a tooltip naming the tip by hand, with a table for the eight Envelope faders, and the LFO controls wrap their Depth and Rate the same way. Nothing checks that every Parameter has a tip. One map gives each Parameter its tip, and the knob and the fader look theirs up. The main component's stage block also drops four props it never uses. Candidate 6 of the architecture review of 2026-10-28, in the version the owner chose. Nothing visible changes.

**Blocked by:** none

**Status:** done (2026-10-28). Every Parameter's tip is in one map that the type checker holds complete; Knob and Fader show their own; the 19 hand-written wrappers, the Envelope faders' table and the stage block's four dead props are gone. Nothing visible changed: the Playwright suite passes untouched.

## Agent Brief

**Category:** enhancement
**Summary:** A tip for every Parameter in one map the type checker holds complete; Knob and Fader show their own; the hand-written wrappers and the stage block's dead props go.

**Current behavior:**
- Each knob and fader is wrapped in a tooltip at its call site; the Envelope faders find theirs through a table of their stage.
- The stage block takes a list of Parameters, the Patch, a change handler and extra controls, none of which any caller uses.

**Desired behavior:**
- One map, beside the tips, gives every Parameter its tip, keyed so a Parameter without one fails the type check.
- A knob or a fader shows its Parameter's tip by itself.
- The stage block takes only what it uses.

**Key interfaces:**
- The tip of a Parameter
- Knob and Fader, which no longer need a tooltip around them

**Acceptance criteria:**
- [x] `npx tsc`, `npm run lint`, `npx vitest run` and `npx playwright test` green, no Playwright test changed
- [x] No tooltip wraps a knob or a fader at its call site
- [x] A node test: every Parameter's tip has a title and a body

**Out of scope:**
- One table for the choices' names and order (version B, not chosen)
- The sections each Parameter sits in

## Decisions (grilling, 2026-10-28, decided by the owner)

1. Version A: every Parameter's tip in one map, found by Knob and Fader themselves; the stage block's dead props go; nothing visible changes.

Claude's calls, open to the owner:

2. Built in the session that grilled it, test-first, not pushed.

## How it was built

- **The map** (`src/ui/tips.ts`): `PARAM_TIPS: Record<ParamId, TipContent>`. Tests: `src/ui/tips.test.ts`, one case per Parameter.
- **The controls** (`src/ui/Knob.tsx`, `src/ui/Fader.tsx`): each wraps its own root in a `Tooltip` with `PARAM_TIPS[id]`, the same markup the call sites made.
- **The call sites**: App's 17 wrappers and the LFO controls' two go, with `STAGE_TIPS`; the tuning knobs are a list of ids. `Block` takes only `title`, `stage`, `children`, `more`, `heading`, `viewers` and `tip`.

