# 156: One line, shorter words

**What to build:** The owner's rule (inbox, 2026-10-31), with a screenshot of the Envelope Timeline's key on two lines on a phone ("Pitch · Pulse Width · Cutoff" then "Filter Env · Amp Env"): "If text is too long and multiple lines are needed, use abbreviations, and even in worst case, just a few letters." The rule is now in [the design principles](../design-principles.md) ("One line, shorter words"). This issue makes the app keep it, the Timeline's key first, and has the design audit check it. Polish of v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** done (2026-11-02). Built (2026-11-01) on night/2026-11-01 and released; tried by the owner: "Perfect."

## Decisions

1. **The rule:** a label, a key or a button's word that would take a second line takes a shorter form instead, an abbreviation, at worst a few letters; the full name stays in its tooltip and accessible name. Sentences (tips, cards, about lines) wrap as text does. Decided by the owner, 2026-10-31.

Claude's call, let stand by the owner in 1.20.0:

2. **The shorter forms, by steps:** each label has a short form, and at worst a shortest one, chosen by the room it gets, never by the layout's name: Pulse Width → PW; Filter Env → F Env → FE; Amp Env → A Env → AE; Cutoff → Cut; Resonance → Res; Key Track → Key; Velocity → Vel; Retrig stays (already short); the LFOs' Destinations in their pickers likewise. The full name is what a screen reader hears, and what the tip says.
3. **The Timeline's key** takes the short forms before it ever wraps, so on a 375 px phone it is one line.
4. **Found everywhere by the audit:** the design audit fails on any label, key or button word that runs to a second line at any width it checks, so a new one cannot slip in; the sentences are exempt by their role.

## Agent Brief

**Category:** enhancement
**Summary:** No label, key or button word wraps to a second line at any width: each falls back to an abbreviation, at worst a few letters, its full name kept for tips and screen readers.

**Current behavior:** Labels shrink by layout rules or not at all. The Envelope Timeline's key wraps to two lines on a phone ("Filter Env · Amp Env" on the second); other labels may wrap at some widths.

**Desired behavior:** Each label that can run short of room has a short and a shortest form. Where its full form would wrap, it shows the short form, then the shortest, chosen by measuring the room it has (so it holds in Linux's wider fonts too), never wrapping. Its accessible name and tip keep the full name. The Timeline's key is one line at 375 px. The design audit checks every label, key and button word at each of its widths and fails on a second line; sentences (tips, cards, the about line, the Tutorial cards) are exempt.

**Key interfaces:**
- The Envelope Timeline's key, the knobs' and faders' names, the LFOs' Destination pickers, the header's button words
- CONTEXT.md's names (the full forms) and a table of short forms beside them
- The design audit spec and its widths

**Acceptance criteria:**
- [ ] ~~The Timeline's key is one line at 375, 430, 690 and 1440 px, both LFOs on and both Envelopes shown~~ (not checked at the time)
- [ ] ~~Each shortened label keeps its full name for screen readers and in its tip~~ (not checked at the time)
- [ ] ~~The design audit fails on a label that wraps (a test of the check itself) and passes on the app at every width~~ (not checked at the time)
- [ ] ~~Every test passes in Linux's fonts too~~ (not checked at the time)

**Out of scope:**
- Sentences, which wrap as text does
- Renaming anything in CONTEXT.md

## How it was built

Built on 2026-11-01, on night/2026-11-01.

- **The short forms** are a table (`shortForms`), beside CONTEXT.md's names in a new "Short forms" section there: each name's forms on screen, longest first, the last at worst a few letters. A name not listed keeps its own.
- **Chosen by measuring** (`useOneLine`): a label holds all its forms; the longest that keeps its text on one line inside its box shows, measured again when its room changes, the fonts arrive or what it holds changes. So it holds in Linux's wider fonts too. The full name stays its accessible name and its tip's title.
- **The Timeline's key** steps all its entries together: whole (Pulse Width, Osc 2 Pitch, Cutoff, Filter Env, Amp Env), then short (PW, O2 Pitch, Cut, F Env, A Env), then shortest (PW, O2P, Cut, FE, AE), where its gaps and line samples tighten too. Measured with both LFOs on Pulse Width and Osc 2 Pitch and the Filter Envelope on: whole from 1440 px (and 1920), short at 375, 430 and 1024 px, shortest at 280, 320 and 690 px and in the 212 px it has at 861 px, one line at each. Before, it took two lines at every one of those widths but 1440 and 1920.
- **An LFO's Destination** on its picker's button takes a shorter form where the button's room runs short. In Mac fonts every name fits, so it shows whole today.
- **The design audit** has a one-line rule: a label's own text on one line, and a key (`data-one-line`) all its text on one, at each of its widths; sentences (paragraphs, list items, tips) are exempt. It runs with the targets and overlaps, and a test of the check itself fails on a button, a label and a key that wrap and not on a sentence or a tip. It found one more: the Patches panel's group names, which took two lines in their 76 px column at every width (issue 30's narrow column). They now take a shorter form there (Keys & Org, Plucks, Str & Brass, Move & FX), whole in the category pills above and for screen readers.
- Tests: `src/ui/shortForms.test.ts`; `e2e/oneLine.spec.ts` (the key at 375, 430, 690, 1440 px and the audit's widths and 861 and 1024 px; a shortened entry's name and tip; the Destination's name on its button); `e2e/designPrinciples.spec.ts` (the rule's own test, the rule at every size); `e2e/patches.spec.ts`'s group names test, now one line. Not run in Linux's fonts here: GitHub's run is the first in them.

**Calls made (Claude's call, let stand by the owner in 1.21.0):**

1. **The forms** are the decision's, plus O2 Pitch then O2P for Osc 2 Pitch, Det for Detune and Vol for Volume. Pitch and FM have none.
2. **The key steps as a whole**, every entry to its next form together, rather than the longest first, so it reads alike; at its shortest the gaps between entries go from 14 to 8 px and the line samples from 16 to 10 px, which is what makes it fit at 861 px.
3. **The Preset groups' names** follow the rule too, as the audit asks, which reverses issue 30's "the long ones on two lines". Taking a wider column instead would give the Presets less room.
4. **The knobs' and faders' names** (Key Track, Velocity…) are left whole: each is kept to one line by its style, and a check before building found none running past its box at the audit's widths (in Mac fonts); the audit now keeps them on one line. No form was given them until one needs it.
   **Since then (2026-11-04, [223](./223-the-owners-calls-after-1-21-built.md)):** Key Track and Velocity take Key and Vel, decided by the owner, and every knob's and fader's name shortens the same way where its row would wrap (Cut, Res, Det, Vol).

**To try:** on a phone, turn up both LFOs' Depth with LFO 1 on Pulse Width and LFO 2 on Osc 2 Pitch, and the Filter Envelope's Amount: the key reads PW · O2 Pitch · Cut · F Env · A Env on one line, its tips and a screen reader saying the whole names. Widen the window and watch the names grow back. Open the Patches panel and read the group names beside the Presets.
