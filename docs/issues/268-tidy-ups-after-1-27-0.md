# 268: tidy-ups after 1.27.0

**What to build:** The 1.27.0 code review's leftovers (the inbox, 2026-11-07), the judgement calls not fixed before the release. Nothing a person sees or hears. Polish for v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-agent · enhancement. In v1 as polish, as 250 and 251 were; Claude's call, open to the owner (2026-11-07).

## The items

From the Standards review:

1. **Two ways of writing only what changed:** the Viewers' test hooks and the LFO plot's fields each keep their own record of what they last wrote: one helper for both.
2. **The e2e specs' waits:** two hand-written waits of 100 ms and a frame (About's, the welcome's) where the shared frame helper serves; the Envelope Timeline spec's twelve reads, 60 ms apart, from outside the page, read inside it instead.
3. **The C16's place** works out each knob's, fader's and button's offset again after its bank has looped over them: the bank's loop gives the kind and the offset. Its `bank` is a number there and a letter in a known Controller's place: one name each.
4. **Positional numbers:** the statistics' median of a state takes three numbers in a row, the Mode fade five positional arguments: an options object each.
5. **About eleven new CSS or `data-` locators** in the specs where a role and a name would find the control.
6. **The pulse's scale is written twice,** in the engine and in the Ideal Reference, and 266's turn of its sign touched four places: one source both read.
7. **A learned Mapping and the Mappings it replaced travel together** through Learn's state, its callback and Quick Setup's last step, the replaced ones reaching Quick Setup through a ref set just before its event: one type, carried in the event.
8. **Pickup's way written as `'up' | 'down'` five times:** one type. Display's `shut` counter standing for a close: a plain call. Three shapes for one card box (the Tour's): one.
9. **The test hooks' `Hooks`** reads as React's: a name that says test hooks.
10. **The Destinations' swings summed twice** (the reach and the Harmonics' list): one function.

From the Spec review:

11. **The tempo waiting for Pickup** shows it on its ring but not in its description, as 255's brief asks of a mapped knob.

## Agent Brief

**Category:** enhancement
**Summary:** Ten small tidy-ups of the code and the specs from the 1.27.0 code review, and the tempo's description naming Pickup's wait.

**Current behavior:** As the items above say.

**Desired behavior:**
- Items 1 to 10 as each says; nothing seen or heard changes, every test passes as it is (renamed where a name changes).
- Item 11: while a mapped tempo waits for its Controller to come back to it, its description says so, as a knob's does.

**Key interfaces:**
- The Viewers' test hooks and the LFO plot
- The e2e helpers
- The C16's layout and the known Controllers
- The statistics scripts and the Mode fade
- MIDI Learn, Pickup and Quick Setup
- The Tour's card placement and Display's panel
- The pulse's scale in the engine and the Ideal Reference

**Acceptance criteria:**
- [ ] Each item done, or answered in this file with why not
- [ ] A test: a mapped tempo waiting for Pickup says so in its description
- [ ] `npx tsc`, `npm run lint`, `npx vitest run` and the touched specs pass

**Out of scope:** the tips' window listeners and the Safari Tab fix watching added buttons only (the review found no case they miss); the fade's timing (251's item 7, narrowed there).
