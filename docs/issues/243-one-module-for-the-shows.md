# 243: one module for the Shows

**What to build:** From the architecture review of 2026-11-05 (its first candidate, picked by the owner). The rules for who plays or guides the page, the Demo, the Song, a Tutorial and the Tour, have no home of their own: App wires them with callbacks between three hooks, each pointing at a hook declared after it, every new Show (the Tour, 210, 233) has added to that wiring in the busiest file, and the rules are checked only in the browser. One module built once holds them all, and React only reads it and sends it commands. Nothing a person sees changes. Upkeep in v1 ([131](./131-v1.md)), decided by the owner.

**Blocked by:** [228](./228-tidy-ups-after-1-23.md) (the Tour card and the next Tutorial in the app), [241](./241-every-preset-reachable-by-program-change.md) (Program Change in the app), [242](./242-three-shows-hand-over-alike.md) (the hand-over fixes, so this changes nothing)

**Status:** done (2026-11-06). Built (2026-11-05) on night/2026-11-05 and merged into main on 2026-11-06, approved by the owner: "All issues seem tobe implemeted fine", then "Merge the night"; ships with the next release

## Decisions

Decided by the owner, 2026-11-05 ("Agreed with suggestion", "ok", "yes"):

1. **A reshaping only:** every rule stays as it is; any oddity found is its own question, not a silent fix (Q1). Three became [242](./242-three-shows-hand-over-alike.md).
2. **In v1, as upkeep,** for a night shift once ready (Q2).
3. **The name is Show** (added to the glossary): the Demo, the Song, a Tutorial or the Tour. Not Lead (a Preset), Guide (Guides are a Viewer's), Host or player (Q3, Q6).
4. **Built once with its effects,** beside the Patch and Viewer stores, as [ADR-0013](../adr/0013-the-patch-lives-outside-react.md) and [ADR-0014](../adr/0014-the-stores-are-built-once-with-their-effects.md) set; it runs its own timers; React reads what is on and sends commands; the app passes none of today's callbacks between the Shows (Q4).
5. **Two tiers in one module:** one of the Demo and the Song plays at a time, one of a Tutorial and the Tour is open, the Demo ends either; Listen is a Tutorial's or the Tour's card's phrase, not a Show of its own. The takeover ("you are playing now"), what is given back, and the person's scroll (today watched in two places) live there (Q6).
6. **One "synth's hand"** for the Demo's knobs and the Tour's: a control the person turns is theirs until the next part or card. The Tour's Freeze, which works out whose Freeze it is and gives the synth's back, stays its own inside the module (Q7).
7. **The rules tested in node unit tests,** over a fake engine and fake timers: who stops whom, the takeover, the give-backs, Freeze's owner, a load ending the Tour. Each behaviour keeps one browser check that the page is wired; the repeats go (Q5).
8. **Built after 228, 241 and 242** (Q14).

Claude's calls, open to the owner:

9. **Which Section the strip follows for a Controller's bank stays with MIDI;** only the Demo's following moves into the module.
10. **The module's commands are the builder's to shape,** within decision 4.
11. **Not built the same night as [245](./245-beads-frame-read-decide-draw.md),** Bead's frame, which reads the Shows for its guiding: one after the other, either first. **Since then (2026-11-05):** the same night is allowed, one after the other on the night branch, at the owner's word: "do as many as possible, including the newer code refactoring ones".

## Today's rules

Mapped on 2026-11-05 for the grilling (after 242, its three rows change as it says):

- **Starting one stops the others** is written in four places: the players' own play, and the app's callbacks when the Demo, a Tutorial or the Tour starts. The Tour card's "start a Tutorial" ends the Tour by hand first, then again through the Tutorial's start.
- **The person takes over the Demo** by a key the stop rule does not let through, a press on the page, or a MIDI Note; the takeover card then shows for 6 s. The Song stops only on a Note held. Listen plays on through Notes.
- **A load ends the Tour** without giving the Patch back; the Tour's close, Done, a page hide or an unmount give it back. A Tutorial left keeps the Patch and gives back its overlays and Snapshot. The Demo ended by itself loads Init.
- **A control the person turns** is left alone by the Demo until its next part, and by the Tour for the rest of the card; the Tour's Freeze becomes the person's once they touch it, and the synth's is released at Next.
- **The person's scroll** pauses the Demo's following until its next part, and the Tour's for its card, wired in two places.
- **Tempo** is given back when a player stops, written twice for the Demo.
- Untested today: a load ending the Tour, a MIDI Note stopping the Demo end to end, the Tutorial's and the Tour's state as units, the Tour's Freeze owner, the Song against the Tour.

## Agent Brief

**Category:** enhancement
**Summary:** One module, built once with the stores, holds the Shows and their hand-over rules; the app reads it and sends it commands.

**Current behavior:** The players (the Demo, the Song, a card's phrase), the Tutorial and the Tour are three hooks the app wires together with callbacks, each ending or stopping the others; the takeover, the give-backs, the synth's hand and the scroll pause are spread across them and the app. Their rules are reachable only through React, and checked only in the browser.

**Desired behavior:**
- One module, built once in the audio session beside the Patch and Viewer stores, holds what is on in both tiers (decision 5), runs the players, the Tutorial's Steps and the Tour's cards, and enforces today's rules, as listed above and changed by 242.
- React subscribes to it and sends commands (start, Next, quit, a Note came, the person scrolled…); no callback between the Shows is passed in the app.
- The Demo and the Tour share one synth's hand for knobs; the Tour's Freeze owner stays its own.
- Every behaviour the browser tests check today is unchanged.
- Tests: the rules in node unit tests with a fake engine and fake timers (each row of the rules above); the browser specs keep one check per behaviour, the repeats removed.

**Out of scope:** any change a person sees; the MIDI hook's own reshaping and the strip's bank follow; Bead's guiding.

## How it was built

Built test-first on `night/2026-11-05`, on top of 228, 241, 242 and 238:

- **One module, the Shows** (`src/shows/shows.ts`), built once in the audio session beside the Patch and Viewer stores. It runs the Demo, the Song and Listen, a Tutorial's Steps and the Tour's cards, with its own timers, and holds every rule in "Today's rules": who stops whom, the takeover and its 6 s card, the give-backs, a load ending the Tour, the Tour's Freeze owner, Tempo given back, the person's scroll for the Demo and the Tour. The page reads what is on and sends commands (start, Next, quit, the person took over, the person scrolled); App passes no callback between the Shows, and the Tour card's "start a Tutorial" no longer ends the Tour by hand first: the Tutorial's start does.
- **One synth's hand** (`src/shows/synthHand.ts`, the Demo's knobs grown into it): a control the person turns is theirs until the next part or card, for the Demo and the Tour alike. The Tour's Freeze owner stays its own, inside the module.
- **What stays in React:** `useShows` reads the module, describes each key press and touch to the Demo's stop rule (its selectors read the page) and watches the person's scroll; the Tour's card asks the module whether the page is the person's. Which Section the strip follows for a Controller's bank stays with MIDI (decision 9).
- **Tests:** 35 node unit tests of the module over the real stores, a fake engine and fake timers, one or more for each row of the rules, the five untested ones among them (a load ending the Tour, the Tutorial's and the Tour's state, the Tour's Freeze owner, the Song against the Tour); 9 of the synth's hand; a browser test that the page's presses reach the stop rule; and, in the MIDI keyboard spec, a Controller's Note stopping the Demo end to end. The usePlayers browser test's seven became the unit tests.

Claude's calls, open to the owner:

1. **The browser specs were left as they are:** the night's brief asked for them to pass unchanged, so no repeat was removed (decision 7 asks for that). Which ones repeat a unit test now is for a later pass.
2. **The synth's hand skips a move to where a control already is.** The Demo's knobs used to write the Patch even then; nothing heard or seen changes, only fewer writes.
3. **The person's scroll is watched for the whole Tour, and for the Demo across its parts**, in one place, rather than from each Tour card and each Demo part; the Tour's card asks the module, which forgets the scroll at each card, as before.
4. **A Controller's learned Next or Previous Preset during the Demo** (242's call 3) is left as it was, the Demo playing on: decision 1 makes any rule change its own question.

To try in the app (nothing should look or sound different):

- Play the Demo, turn a knob, scroll the page, then press a key or a Note: it stops, says you are playing now, and the card goes after a few seconds.
- Start the Tour from About on a Preset of yours, turn the Filter card's Cutoff, press Freeze on the Amp card, then Song: the Tour ends, your Preset is back, the Song plays.
- Open a Tutorial with an overlay on, go to its Display Step, then quit: the overlay is back. Finish one: it is ticked in the Tutorials list.

