# 271: tidy-ups after 1.28.0

**What to build:** The 1.28.0 code review's leftovers (the inbox, 2026-11-08), the judgement calls not fixed before the release. Nothing a person sees or hears but item 1, one frame of Bead's. Polish for v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-agent · enhancement. In v1 as polish, as 268 was; Claude's call, open to the owner (2026-11-08).

## The items

From the Standards review:

1. **Bead's foot on a landing frame:** standing on its line, its foot is read under where it strolls, while on the frame it lands it is drawn at the landing spot. Two gates for one place: one.
2. **The 2.5 Hz ride test** finds LFO 1's plot by its class and reads its svg, where the same release moved other lookups to roles.
3. **The Piano's wait,** its first key waited for, written 49 times in 9 specs: one e2e helper, beside `frames`. The ride's turns and its slope a pixel either side are counted twice, in the frame's unit tests and the browser spec: one each.
4. **The C16's place** comes in two near-identical shapes (its bank as a number, then as a letter) and an inline type for a kind's CCs that the knobs, faders and buttons don't declare: one shape, one declared type. `onTheC16` reads as a yes or no and returns a place; `KINDS` says little: names that say what they hold.
5. **`useDescribing`,** which adds to any control's description, lives in the file about greyed-out controls: its own place. Quick Setup's last step type is exported from its panel's component to the MIDI hook: beside `Learned`.
6. **The line under Bead** is 0 when there is no plot, though every caller has one; the plot's svg is asserted present when the frame reads it: no sentinel, and a reading that says when the svg is missing.

## Agent Brief

**Category:** enhancement
**Summary:** Six small tidy-ups of the code and the specs from the 1.28.0 code review.

**Current behavior:** As the items above say.

**Desired behavior:**
- Item 1: on the frame Bead lands on its line, its foot is on the line under the spot it is drawn at.
- Items 2 to 6 as each says; nothing seen or heard changes, every test passes as it is (renamed where a name changes).

**Key interfaces:**
- Bead's frame and its reading of the page
- The e2e helpers and Bead's ride specs
- The C16's layout and the known Controllers
- MIDI Learn, Quick Setup and the control descriptions

**Acceptance criteria:**
- [ ] Each item done, or answered in this file with why not
- [ ] A test: on its landing frame, Bead's foot is on the line under the spot it is drawn at
- [ ] `npx tsc`, `npm run lint`, `npx vitest run` and the touched specs pass

**Out of scope:** the Spec review's points, each a builder's call already open to the owner in its issue (268's calls 2 and 4, 269's call 1, 270's calls 1 and 3).
