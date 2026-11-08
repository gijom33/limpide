# 150: Bead shown by default

**What to build:** The owner's idea (inbox, 2026-10-31): "Show Bead by default, without requiring to play BEAD first." Bead, the water drop of [115](./115-an-easter-egg.md), comes onto the page by itself on a first visit, and Display's Bead switch is there from the start. Playing B, E, A, D still sends it away and calls it back. It turns 115's decision 7 (Bead hidden from the tips and the README) around for what is now in plain view; its tricks stay a surprise. In v1 as Bead's polish ([131](./131-v1.md), decision 12; Claude's call, open to the owner).

**Blocked by:** none

**Status:** done (2026-11-02). Built (2026-10-31) on night/2026-10-31 and released; tried by the owner: "Perfect."

## Decisions

The idea is the owner's; how it is done is Claude's call, open to the owner (2026-10-31):

1. **On by default.** A visitor who has never met Bead (its stored setting still "unmet") is treated as on. A visitor who switched Bead off keeps it off; one who has it on keeps it on.
2. **Its first entrance:** a few seconds after the page is ready, by one of its ways in, as when called by the Notes; while the welcome card is up, it waits until the card is closed, so the first thing a newcomer reads is not covered or upstaged.
3. **The Notes stay:** B, E, A, D by hand sends Bead away when it is out and calls it when it is not, as now, and flips Display's switch to match (as the switch already stops the Notes calling it while off).
4. **Display's switch is shown from the start,** not only once Bead has been met, and its tip says in a line who Bead is and how to send it away: the switch, or the Notes.
5. **The words:** the README says in a line that a water drop called Bead lives on the page; [bead.md](../bead.md) no longer calls Bead hidden, its tricks still listed there and nowhere else.
6. **Reduced motion:** as now (Bead's own rule for reduced motion holds on a first visit too).

Decided by the owner, 2026-10-31 (evening), on trying the night's build: "Making Bead appear and disappear is not the same as switching Bead off in the display menu. In the display menu, the switch is intentional and permanent whereas making Bead disappear with BEAD is only temporary and a reload goes back what is defined in the display settings menu."

7. **The switch and the Notes are two things.** Display's switch is the lasting setting, remembered across visits. B, E, A, D only sends Bead away or calls it back for this visit: it changes neither the switch nor what is stored, and a reload goes back to what the switch says. Replaces decision 3's "flips Display's switch to match", and the night's call 1 under How it was built. 8. **With the switch On,** B, E, A, D sends Bead away and, played again, brings it back, the switch reading On throughout. The owner's words, 2026-10-31: "calling BEAD after having made it disappear with a first BEAD, with menu saying BEAD ON, does make the mascot reappear."
9. **With the switch Off, Bead never appears:** the Notes do nothing then, and nothing else brings it, until the switch is turned On. "I confirm that with Bead Off in settings, Bead should never appear. It's about avoiding certain people from being annoyed." Decided by the owner, 2026-10-31.

## Agent Brief

**Category:** enhancement
**Summary:** Bead comes onto the page by itself for every visitor who has not switched it off, instead of only after B, E, A, D has been played.

**Current behavior:** Bead appears only once B, E, A, D is played by hand. Its Display switch is shown only once it has been met, and its stored setting starts at "unmet". The tips and the README leave it out on purpose.

**Desired behavior:** A visitor whose stored Bead setting is "unmet" or "on" sees Bead come in by itself a few seconds after the page is ready, or after the welcome card closes when it is up. "Off" keeps it away. Display's Bead switch shows from the first visit, its tip naming Bead and how to send it away. B, E, A, D still sends it away or calls it, for the visit only, the switch untouched; with the switch off, the Notes do nothing (decisions 7 to 9). The README gains one line about Bead; bead.md stops calling it hidden.

**Key interfaces:**
- The Display settings module's Bead setting ("unmet", "on", "off") and what reads it
- Bead's entrance (its ways in) and the B, E, A, D Notes rule
- Display's Bead switch and its tip
- The welcome card's closing
- The end-to-end tests' starting state: with Bead out by default, its pixels take the pointer, so every spec that is not about Bead starts with Bead off (one fixture), and the mascot spec starts as it needs

**Acceptance criteria:**
- [x] A first visit (nothing stored): Bead comes in by itself once the welcome card is closed
- [x] A visitor with Bead switched off: no Bead after a reload; one with it on: Bead as now
- [x] Display's Bead switch and its tip show on a first visit
- [x] B, E, A, D sends Bead away and calls it back for the visit, the switch untouched; switched off, the Notes do nothing (decisions 7 to 9)
- [x] The other end-to-end specs pass unchanged, Bead kept out of their way; the mascot spec covers the default
- [x] Bead's frame-cost test passes as before
- [x] The README's line and bead.md's opening say so
- [ ] ~~Every test passes in Linux's fonts too~~ (not checked at the time)

**Out of scope:**
- New tricks ([127](./127-more-tricks-for-bead.md)) or Bead riding the LFOs ([141](./141-bead-rides-the-lfos.md))
- The tips naming Bead's tricks

## How it was built (2026-10-31, on night/2026-10-31)

**What was built:**
- **Bead's rules** (`src/ui/beadPresence.ts`): one pure function, `beadAfter`, takes Bead (where it is: away, up or leaving; its switch; whether its own entrance is still to come) and an event (the Notes, the switch turned on or off, its entrance, its melting done). The Notes call it when it is away and send it away when it is up, turning the switch to match; while it melts they do nothing. (Since decisions 7 to 9: the switch untouched, and nothing while it is off.) Its entrance brings it up only if it is on and neither the Notes nor the switch have had their say yet.
- **The app:** Bead's entrance comes 3 s after the page opens. While About is open (the welcome among it) it waits, and its 3 s start again once About closes. The switch is remembered in `limpide.bead`, now on or off and on by default; a stored "unmet" from before reads as on. Display's Bead switch shows from the first visit, with a tip in `src/ui/tips.ts`.
- **The words:** a "Meet Bead" line in the README; bead.md's opening and its "Calling it, and sending it away"; CONTEXT.md's Mascot; dated lines in 115 (decisions 6 and 7, and its build notes), 127 and 87.
- **The end-to-end start state** (`e2e/startState.ts`): one place says what every spec's browser holds. The config starts every spec welcomed with Bead off. The first-visit specs (welcome, Tour, keyboard access) start with Bead off only. The specs that empty storage (Patches, LIMITING, the stand-in Controller) go through one helper that keeps Bead off. The mascot spec calls Bead with the Notes as before, and adds tests for the default: a first visit (the welcome waits, then Bead comes, and the switch and its tip show), "on" bringing it by itself again after a reload, "off" keeping it away, and the Notes turning the switch both ways.
- **Tests:** unit, `beadPresence.test.ts` (6), the Display setting's default and the old "unmet" (`displaySettings.test.ts`), and Bead's tip (`tips.test.ts`).

**Claude's calls, open to the owner:**
1. (Replaced by decisions 7 to 9, the owner's: the Notes are for the visit only, and do nothing while the switch is off.) **The Notes work whatever the switch says.** B, E, A, D sends Bead away and turns the switch off; played again, it calls Bead back and turns the switch on, even after Bead was switched off in Display. This is the only reading that fits "sends Bead away and calls it back, the switch following". It drops 115's rule that a switched-off Bead could not be called by the Notes, which was there for anyone who would hate it. Someone who switched it off could now bring it back by playing B, E, A, D in a tune, within 4 s.
2. **3 seconds** after the page opens, or after About closes. It also waits whenever About is open, not only for the welcome.
3. **The Tour and the Demo do not hold it back.** A newcomer who leaves the welcome by "Take the Tour" or "Play the Demo" sees Bead come 3 s later, while the Tour's first card or the Demo is on.
4. **Once a visit.** If the Notes or the switch have had their say before it comes, it does not come by itself that visit.
5. **Switched back on while it melts,** it comes back up once melted (before, it ended away with the switch on).
6. (The tip and the README line since reworded for decisions 7 to 9, below.) **The tip:** "Bead is the little water drop living on the page, answering what you play and turn. Off sends it away, and so does playing B, E, A, D; the same Notes call it back. Your choice is remembered." The README: "A little water drop called Bead lives on the page and answers what you play. Switch it off in Display, or play `B, E, A, D` to send it away."

**Tests run:**
- `npx tsc` and `npm run lint`.
- The whole Vitest suite: 1246 passed. The two that timed out, the edge Patches (issue 116), are not touched here and passed run alone.
- The whole Playwright suite in Chromium once: 532 of 533 passed. The one failure was Bead's frame cost at 1.005 ms, while the unit suite loaded the machine; it passed in each run since.
- After the review's fixes:
  - The specs that use the start state, in Chromium: 112 of 113 passed. The 113th, issue 112's Tap tempo, a timing test, passed 3 times alone.
  - The mascot spec in both browsers, twice: all 41 passed both times.
- Under load (parallel runs while other work kept the machine busy), some mascot tests failed once each in WebKit: "three across" (Bead over the Demo or Song button), and "thrown, lands on an edge". Bead's frame cost failed under load in Chromium. Each passed when run again on a quiet machine. The throw test fails just as often on the code before this issue (2 in 24).

**Not verified here:** "every test passes in Linux's fonts too" (GitHub's run of the branch will say). The app was not opened by hand on port 5174.

**To try in the app:** (the first try; for decisions 7 to 9, see below)
- In a private window (nothing stored): the welcome opens, and Bead does not come while it is up. Close it, and Bead comes about 3 s later. Open Display: its Bead switch is on, and its tip says who Bead is.
- (No longer so since decisions 7 to 9.) Play B, E, A, D (J, D, H, S): Bead leaves, and Display's switch reads Off. Reload: no Bead. Play it again: Bead comes, the switch reads On, and after a reload Bead comes by itself again.
- Switch it off in Display and reload: no Bead.

**The owner's correction, decisions 7 to 9 (built 2026-10-31, on night/2026-10-31):**
- **What changed:** Display's Bead switch is the only lasting setting. `beadAfter` no longer lets the Notes turn it: with it on, B, E, A, D sends Bead away or calls it back for this visit, and the rules remember that the Notes sent it away, so it does not come back up once melted nor come by itself again that visit; with it off, the Notes do nothing, and nothing brings Bead until the switch is turned on. What is stored is only ever the switch, so a reload goes back to it.
- **The words:** Bead's tip ("Off keeps it away, remembered, until you switch it on again. While it is on, playing B, E, A, D sends it away for this visit, and the same Notes call it back."), the README line ("Switch it off in Display to keep it away, or play `B, E, A, D` to send it away for the visit."), bead.md's "Calling it, and sending it away", CONTEXT.md's Bead, and 115's build note.
- **The tests:** unit, `beadPresence.test.ts` (7: decisions 8 and 9 each a test) and Bead's tip. The mascot spec brings Bead with Display's switch, since the Notes do nothing while it is off, and has two new tests: switched on, the Notes send it away with the switch still on, it does not come by itself, a reload brings it, the Notes send it away and bring it back; switched off, the Notes do nothing, nor a reload, until the switch brings it and takes it away again.
- **Tests run:** `npx tsc` and `npm run lint`. The whole Vitest suite: 1249 of 1250 on the second run, the one failure the edge Patches' timeout (issue 116, not touched here; it passed alone), while the machine was heavily loaded; the first run had 4 failures in 3 files under the same load. The mascot spec in Chromium and WebKit: 41 passed (the frame cost is Chromium only), after one fix: in the short phone window Display's switch was out of reach, so that test brings Bead before the window shrinks. Its issue 150 tests again after the review's fixes, both browsers: 10 passed.
- **The review** (standards and spec, since `88389f6`): no path lets Bead appear while the switch is off. Fixed: a test's name now cites decision 8, a comment wrapped, and this file brought up to date.
- **To try in the app:**
  - With Bead on in Display, reload: Bead comes by itself. Play B, E, A, D (J, D, H, S): it leaves; Display still reads On; it does not come back by itself. Play it again: it comes back. Send it away and reload: it comes by itself again.
  - Switch it off in Display: it melts away. Play B, E, A, D: nothing. Reload, wait, play it again: nothing. Switch it on: it comes.
