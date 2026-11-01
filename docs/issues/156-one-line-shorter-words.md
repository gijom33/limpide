# 156: One line, shorter words

**What to build:** The owner's rule (inbox, 2026-10-31), with a screenshot of the Envelope Timeline's key on two lines on a phone ("Pitch · Pulse Width · Cutoff" then "Filter Env · Amp Env"): "If text is too long and multiple lines are needed, use abbreviations, and even in worst case, just a few letters." The rule is now in [the design principles](../design-principles.md) ("One line, shorter words"). This issue makes the app keep it, the Timeline's key first, and has the design audit check it. Polish of v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-agent · enhancement

## Decisions

1. **The rule:** a label, a key or a button's word that would take a second line takes a shorter form instead, an abbreviation, at worst a few letters; the full name stays in its tooltip and accessible name. Sentences (tips, cards, about lines) wrap as text does. Decided by the owner, 2026-10-31.

Claude's call, open to the owner:

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
- [ ] The Timeline's key is one line at 375, 430, 690 and 1440 px, both LFOs on and both Envelopes shown
- [ ] Each shortened label keeps its full name for screen readers and in its tip
- [ ] The design audit fails on a label that wraps (a test of the check itself) and passes on the app at every width
- [ ] Every test passes in Linux's fonts too

**Out of scope:**
- Sentences, which wrap as text does
- Renaming anything in CONTEXT.md
