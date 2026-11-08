# 260: Small things for newcomers after 1.26

**What to build:** Five ideas of the full review round on 1.26.1, polish on what is built (the inbox, 2026-11-07; reviews [1](../reviews/2026-11-07/1-curious-contact.md), [16](../reviews/2026-11-07/16-synth-neophyte.md) and [20](../reviews/2026-11-07/20-curious-kid.md)):

1. **Bead's card says to tickle it "with the mouse",** which a finger cannot, and never says it can be picked up and thrown, the best trick on a tablet (review 20).
2. **On a phone a Tutorial's Next moves:** alone on a second row before the Step is made, at the first row's end after (review 16).
3. **On a phone a Display Step done by hand leaves the Display panel** over what the Step's note describes (Ideal in Sub Ladder 4 and Bass 4, the Snapshot in Acid 2) until Next (review 16).
4. **The Tour ends on the geek extras** (the Synth Geek Layer, then "Build a Sub Ladder" as card 6's main button), so a newcomer leaves by Done with nothing to play (review 1).
5. **The Song says nothing once it plays:** a line inviting a newcomer to flip Presets with › or turn a knob over it (review 1).

**Blocked by:** none

**Status:** ready-for-human · enhancement. Built (2026-11-07) on night/2026-11-07, for the owner to try. In v1 as polish ([131](./131-v1.md)), decided by the owner (2026-11-07, "Yes" to the triage's five small ideas).

## Agent Brief

**Category:** enhancement
**Summary:** Bead's card names the finger and the throw, a Tutorial's Next stays put on a phone, the Display panel closes after a Display Step on a phone, the Tour ends on something to play, and the Song invites playing over it.

**Current behavior:** As the five items above say.

**Desired behavior:**
- Bead's card speaks of a finger as well as the mouse, and says Bead can be picked up and thrown.
- On a phone a Tutorial's Next keeps one place, before and after the Step is made.
- On a phone a Display Step made by hand closes the Display panel, so what the Step's note describes is in view.
- The Tour's last card leaves the newcomer with something to play (a Preset to try, the keyboard, the Song), the Geek Layer and the Tutorials offered before it rather than as the way out.
- While the Song plays, a short line (one line, the short-words rule of [156](./156-one-line-shorter-words.md)) invites flipping Presets with › or turning a knob over it.

**Key interfaces:**
- Bead's card
- A Tutorial's card on a phone
- The Display Steps
- The Tour's last cards
- The Song's card or caption

**Acceptance criteria:**
- [ ] Tests for each, on a phone where the item is a phone's
- [ ] The Tour's and the Tutorials' tests keep passing, their words checked by the short-words rule
- [ ] Every test passes in both engines and in Linux's fonts

**Out of scope:** the Tour's other cards (their words for a ten-year-old are v2, [262](./262-v2-ideas-from-the-1-26-1-round.md)); the control the Tour turns ([254](./254-the-tour-keeps-what-it-turns-in-view.md)).

## How it was built

Built on 2026-11-07, on night/2026-11-07, test-first, one item at a time.

1. **Bead's card** (About, Bead's button) now says it sprays droplets "when clicked or tapped", and a new line: press it and move, with the mouse or a finger, to pick it up; let go and it is thrown, landing with a splash on a section's edge. "Tickle it with the mouse" stays, as a finger cannot tickle it.
2. **A Tutorial's Next keeps one place on a phone:** the card's way forward keeps its row's right end. Before the Step it wraps alone to the second row, at the right; after, it joins the first row at the right, so it does not move. Measured at 390, 375 and 320 px through Bass's first three Steps. The Tour's card follows the same rule.
3. **A Display Step closes the Display panel on a phone,** as the Step is made (Ideal in Sub Ladder 4 and Bass 4, the Snapshot in Acid 2). The Step's Viewer comes into view, and the focus goes back to the Display button if it was on the option. Wider than a phone (the docked card not pinned), the panel stays open beside the Viewers, as before.
4. **The Tour ends on something to play:** a seventh card, **Your turn**, rings the Song button. Its first line, all a folded phone card shows: "Now play the piano's keys, or press the ringed Song for a tune to play over." Then the letter keys from A, and "That is the whole Tour. As the Song plays, flip the Presets with › beside the sound's name, or turn a knob…". Its button **Play the Song** ends the Tour, gives the person's Patch back and starts the Song; Back and Done stay. The Tutorials card is now 6 of 7: Next is its way forward, and **Build a Sub Ladder** sits beside it, offered, not the way out.
5. **The Song's line:** while the Song plays, a line in the Preset about line's place, under the sound's name and its ›, says "**Song** · Flip the Presets with ›, or turn a knob as it plays". It is one line at every width: where those words do not fit, it takes "Flip the Presets with ›, or turn a knob", at worst "Try ›, or turn a knob" (measured, as issue 156's labels are). It goes once the person changes the sound, or the Song stops; started again, it asks again.

Tests: `e2e/about.spec.ts` (the card's words), `e2e/tutorial.spec.ts` (Next's place at three phone sizes; the panel closed on a phone in Sub Ladder, Bass and Acid, the Viewer clear and uncovered; open on a laptop), `src/tutorial/tour.test.ts` and `e2e/tour.spec.ts` (seven cards, the last ringing Song and playing it on the person's Patch, the Sub Ladder offer on card 6), `e2e/song.spec.ts` (the line at 320, 375, 390, 768 and 1440 px on one line, gone after › or a knob, back on a new start), `e2e/keyboardAccess.spec.ts` (2 of 7). Issues 210 and 233 have a dated line on the new ending; CONTEXT.md's Tour says it ends on the Song.

**Calls made (Claude's call, open to the owner):**

1. **The last card's way out is the Song,** of the three the brief names (a Preset, the keyboard, the Song): the card names all three, and its button plays the Song, which gives back the person's Patch and leads straight into item 5's line. The card asks to flip the Presets once the Song plays, not before: a Preset loaded during the Tour ends it without giving the person's Patch back.
2. **The new card's name is "Your turn",** its button "Play the Song". The Tutorials card keeps "Build a Sub Ladder", now a plain button beside Next.
3. **The Song's line sits where a Preset's about line does,** under the name and its ›, in the same box, so it reads next to the arrow it names. On a phone that place is over the Section strip's tabs, as the about line is; the tabs still take a tap through it.
4. **The line goes once the person changes the sound** (a Preset flipped, a knob turned, the octave moved), not when the Song stops only: it has done its work, and it would otherwise cover the strip for the whole Song. It does not show while a Tutorial is open, where flipping a Preset would undo the Steps. A screen reader does not hear it; the Song's tip already says the same.
5. **It keeps to one line with shorter words,** as the brief asks, although the design principles let sentences wrap; its three forms are its own, not in the short forms' table of names.
6. **The panel closes on any Display Step made on a phone,** by hand or by "Do it for me": "a phone" is any window up to 600 px, where the card is pinned to the bottom edge. Coming back to a Step made already leaves the panel as it is.
7. **Next keeps the right end of the row on every width,** not only on a phone: wider, the row has room for all its buttons, so Next stands where it did.

**To try in the app:**
- On a phone (or a 390 px window), start Bass: on Steps 1 to 3, Next should stay bottom right before and after the Step. At Step 4, open Display and tap Ideal: the panel should close and the circles show on the Oscillator Spectrum. Try Acid's Snapshot (Step 2) and Sub Ladder 4 too.
- Take the Tour to its end: card 6 offers Build a Sub Ladder beside Next; card 7, Your turn, rings Song. Press Play the Song: the Tour ends, your own sound comes back and the Song plays, with the line under the sound's name. Press › and the line goes. On a phone, see whether the line over the tabs bothers you.
- In About, tap Bead: read the new line on picking it up and throwing it, and try it with a finger on a tablet.

