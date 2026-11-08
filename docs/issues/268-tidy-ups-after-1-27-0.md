# 268: tidy-ups after 1.27.0

**What to build:** The 1.27.0 code review's leftovers (the inbox, 2026-11-07), the judgement calls not fixed before the release. Nothing a person sees or hears. Polish for v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-human · enhancement. Built (2026-11-08) on night/2026-11-08, for the owner to try. In v1 as polish, as 250 and 251 were; Claude's call, open to the owner (2026-11-07).

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
- [x] Each item done, or answered in this file with why not
- [x] A test: a mapped tempo waiting for Pickup says so in its description
- [x] `npx tsc`, `npm run lint`, `npx vitest run` and the touched specs pass

**Out of scope:** the tips' window listeners and the Safari Tab fix watching added buttons only (the review found no case they miss); the fade's timing (251's item 7, narrowed there).

## How it was built

Built at night (2026-11-08) on night/2026-11-08. Item 11 was built test-first. For items 1 to 10, the tests already there were the net, run before and after each item.

**What was built.**

- **Items 1 and 9.** One helper, `writeChanged`, now lives beside the render loop and writes only what changed. The Viewers' test hooks call it against the canvas's dataset. The LFO plot calls it against what it last wrote. The hooks' type is now `TestHooks`, and its writer is `writeTestHooks`, so neither reads as React's.
- **Item 2.** About's and the welcome's waits are the shared `frames` helper. They were 100 ms and a frame. A focus tip opens at 0 ms, so two frames are enough to see one that should not be there. The Envelope Timeline spec used to read twelve times, 60 ms apart, from outside the page. It now reads once inside the page, frame by frame, over the same 720 ms.
- **Item 3.** The C16's controls are now one table: each kind of control, its CCs, and how it is named on the panel. One loop over that table gives a control's bank, kind and name. Inside `c16.ts` a bank is a number. A known Controller's place gives the bank's letter as `bankLetter`.
- **Item 4.** The statistics' median of a state takes `{ runs, settle, seconds }`. The Mode fade takes one options object.
- **Item 5.** Fourteen locators now find their element by role and name:
  - the Piano's keys, waited for in five specs, through the Piano group's buttons;
  - the Scopes and Spectrums in the Viewer controls spec, as images by name;
  - the shut Display panel, by its Viewer controls region.

  Two locators stay as they were (Claude's call 2).
- **Item 6.** The pulse's scale is now one function, `pulseScale`, in `harmonics.ts`, beside `ENGINE_HARMONICS`, the number of Harmonics the Oscillators play. The engine and the Ideal Reference each used to keep their own copy of both. The pulse is still built as 266's decision 2 says: a saw less its copy delayed by the low part, the saw keeping its sign. The engine's and the Ideal's tests pass unchanged. See Claude's call 3 for the build itself.
- **Item 7.** A learned Mapping and the Mappings it replaced now travel as one `Learned`. It goes through Learn's state, its callback and Quick Setup's `learned` event. That event now carries it to the step's card, so the ref that used to be set before the event is gone.
- **Item 8.** Pickup's way is now one `PickupWay` type. The Display panel used to close on a counter that stood for a close. It now closes on a plain `shut()` call through its ref, the focus going back to its button as before. The Tour card's box is the docked card's `CardBox`. One function moves it along the bottom, and `cardAside` reads the same box.
- **Item 10.** `totalSwing` in the Modulation model now adds the two LFOs' swing on a Destination. The rings' reaches (the Cutoff's, the even ones, the Volume's) use it. So do the Harmonics Ring keeps and FM's peak.
- **Item 11.** While a mapped tempo waits for its Controller's knob, its description now says which way to turn it, as a knob's slider does. Both draw one `PickupNote`, described through the same `useDescribing` as the Synth Geek Layer's readout. A new test in `e2e/midiLearn.spec.ts` checks this. It failed first, with the ring showing but the description not. Issue 255's call 6 gets a dated line.
- **The review** (code-review skill, since the branch's tip before 268) found no bug. Its standards findings are fixed:
  - one description ref, not two;
  - the C16's names in its table, not a second switch on the kind;
  - no one-line wrapper around `totalSwing`;
  - the last Quick Setup step's type named once;
  - a shadowed name in the Timeline spec;
  - a long comment shortened.

Tests: `npx tsc`, `npm run lint` and `npx vitest run` (all 118 files) pass. The Playwright specs the change touches pass in Chromium and WebKit: about, welcome, envelopes, lfo, viewersRest, viewerControls, c16Learn, midiLearn, quickSetup, header, designPrinciples, keyboardAccess, toolbarLayout, tour, modulationRing, tempo, displayPanel, knob, lfoDestination and geek, plus tutorial's issue 260 tests. In WebKit, the tests that need Web MIDI are skipped.

**Claude's calls, open to the owner:**

1. **Item 11's test is at the page.** A fake Controller maps the tempo to an Absolute knob, as the knob's own Pickup test does. The skill asks for the seam to be agreed first, and the owner was away. The brief names this behaviour, so the page was the seam taken.
2. **Item 5 keeps two CSS locators.** The Envelope rows' fader (`e2e/envelopes.spec.ts`) stays, as the test measures the fader's box: its slider sits at its value, so the two Attacks' sliders do not line up, and the swap made the test fail. The Demo card's focused part segment (`e2e/demo.spec.ts`) stays too: it is found by role inside its group already, and only the focus is CSS's, which no role states.
3. **Item 6 shares the scale, not the build.** The engine builds the pulse as nodes: a gain and its turned-over, delayed copy. The Ideal Reference builds it twice as numbers: once as a Harmonic's level and once as a sampled cycle. These are three different things, and each says "one less the width" for the delay. A shared constant for `1 − width` would read no better.
4. **Display closes at the call.** Before, the panel closed one render after the Tutorial's Step was made. Now it closes as the call is made. Nothing seen differs, and tutorial's issue 260 tests pass in both browsers.
5. **The names.** `Learned` lives beside `Mapping` in `mappings.ts`, so Quick Setup does not import Learn's surface. The letter is `bankLetter`, after the function that gives it. The test hooks are `TestHooks` and `writeTestHooks`.

**To try in the app:** nothing should look or sound different, except item 11.

- With a screen reader (VoiceOver), map the tempo to an Absolute knob in MIDI Learn. Turn the knob away from the BPM and leave Learn. Then focus the tempo: it says "Pickup: turn your Controller’s knob up (or down) to this value to take it over." That stops once the knob passes the BPM. A knob says the same, as before.
- MIDI Learn beside the C16: learn a keyboard knob onto the Cutoff. The Learn bar still names the C16 place it took, "bank A’s K1". Quick Setup's card still says what a step took.
- On a phone, a Tutorial's Display Step, made: the Display panel closes. On the Tour, the card still stands aside where it would cover what it shows.
- The Viewers and the LFO plots draw as before. A pulse sounds and its Ideal marks sit as in 1.27.0.

