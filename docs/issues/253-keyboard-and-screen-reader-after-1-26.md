# 253: Keyboard and screen reader after 1.26

**What to build:** Review 6's findings on 1.26.1 (the inbox, 2026-11-07; [report](../reviews/2026-11-07/6-accessibility.md)):

1. **Tap Tempo changes the BPM without announcing it** to a screen reader (WCAG 4.1.3, since 1.21.1; [189](./189-accessibility-after-1-21.md) meant to announce it).
2. **Escape does not close the Tour's card or a Tutorial's,** though it closes every other panel.
3. **With Safari's default Tab setting, Tab skips every plain button** (Patch, ‹ ›, Demo, Song, Tutorial, About, MIDI, Display, Hold, Tap…): 32 stops against Chromium's 56, a Preset or a panel out of reach (WCAG 2.1.1).

**Blocked by:** none

**Status:** done (2026-11-07). Built (2026-11-07) on night/2026-11-07 and merged into main on 2026-11-07, approved by the owner, untried: "Merge the night"; released in 1.27.0. In v1 as polish ([131](./131-v1.md)), decided by the owner (2026-11-07, "Yes" to the triage's eight v1 issues).

## Agent Brief

**Category:** bug
**Summary:** The tapped tempo is not spoken, Escape leaves the Tour's and the Tutorials' cards open, and Safari's default Tab setting skips every button.

**Current behavior:** As the three items above say. Safari reaches a button by Tab only with "Press Tab to highlight each item" turned on, which most people leave off.

**Desired behavior:**
- Each new BPM from Tap is announced politely, once the tapping settles, as a clock's is meant to be.
- Escape on the Tour's card or a Tutorial's closes it, as Done or Quit does, focus returning to what opened it.
- With Safari's default setting every control a keyboard needs is reachable by Tab, or the page offers another way to each (the buttons made focusable for Tab, without changing how they look or what they do elsewhere).

**Key interfaces:**
- The tempo's live region
- The Tour's and the Tutorials' cards and their close
- What Tab reaches in WebKit

**Acceptance criteria:**
- [x] A test: three taps change the BPM and the live region says the new tempo
- [x] A test: Escape closes the Tour's card and a Tutorial's, focus back on their opener
- [x] A WebKit test with Tab reaching every header button and a Preset, as in Chromium
- [x] Every test passes in both engines

**Out of scope:** a real screen reader's run (a human check, later).

## How it was built

- **Tap Tempo's announcement was already there** (issue 189's `TempoNews`, in 1.26.1 too). Three taps by Enter set the BPM, and 0.6 s after the last tap the Tempo's polite status says "Tempo 150 BPM", in Chromium and WebKit alike. The review most likely read the live regions before that 0.6 s rest, or tapped close to 120 BPM, where nothing changes to say. Nothing in the code changed for it; a new test pins it: three taps by the keyboard, and the status says the new BPM, once.
- **Escape on the Tour's card or a Tutorial's closes it,** as its × does (Close the Tour, Quit the tutorial), with the focus going back to what opened it (About, the Tutorial button). It works wherever the focus is on the card. Escape on a Step's control still goes back to Next first, and MIDI Learn's Escape is still its own. The one Escape closes only the card: the Preset's about line under the Patch stays, though a tip open elsewhere still hides.
- **Safari's Tab reaches every button and link.** As soon as it comes onto the page, each button and link without a tabindex of its own gets `tabindex="0"`. Safari, as it comes, Tabs only to fields and to elements given a tabindex (as the knobs are), so it now reaches Patch, ‹ ›, Hold, Tap, Demo, Song, Tutorial, About, MIDI, Display, Legato, the LFO Destinations, Retrig, Sync, a Preset in the Patches panel, the cards' buttons and About's links. Roving stops (a radio group, the piano keys, a menu's items) keep the tabindex they have. In Chromium the Tab order stays the same. The header's 15 stops, then the panels', now match in both engines, and so does a Preset found by its search and loaded by keys alone.
- **Tests:** a new test for each of the three, in both engines. The Tab-walking tests that skipped WebKit for this now run in it (the header's order at each size, the octave buttons, the × after Next Preset, Shift+Tab under the header on a phone and at 200 % zoom, the Tutorial card's stops, the Demo card's Previous, parts and Next). So do the Tutorial end card's two focus checks, which skipped WebKit because a click there left the focus off.
- **Tests run:** `npx tsc`, `npm run lint`, the unit tests related to the change (none), and the specs that cover what changed (keyboard access, tempo, the Tour, the Tutorials, the Demo, the header, layout polish, the welcome, About, tips, touch tips, the piano, MIDI Learn, the Envelopes, the Patch search, the design audit): 386 passed in Chromium; 374 passed and 12 skipped (their own engine's tests) in WebKit. After the review's fixes, the touched specs again (keyboard access, tempo, Tour, Tutorials, welcome, Patches, tips): 370 passed across the two engines.

## Claude's calls, open to the owner

1. **All at once, not button by button.** One small observer gives every button and link `tabindex="0"` as it appears, rather than writing `tabIndex={0}` on some 85 buttons across the app. A new button is covered without anyone remembering it. Links are included: Safari's default passes over them too (Option+Tab reaches them), and About's links are part of what a keyboard needs. Firefox on a Mac, under the system's own keyboard setting, gains the same.
2. **A click now focuses a button in Safari, as it does in Chrome.** That is WebKit's rule for an element with its own tabindex. No ring shows on a click (`:focus-visible`), and since issue 252 no tip opens on that focus. But a clicked button keeps the focus, so Space or Enter after the click presses it again, as it already did in Chrome.
3. **No line on the card about Escape going back from a Step's control.** The review suggested one ("Escape returns here"), but it is not in the Desired behaviour. Left for the next review.

## What to try in the app

- In Safari, with "Press Tab to highlight each item" off (as it comes): Tab from the top of the page. Patch, ‹ ›, Hold, Tap, Demo, Song, Tutorial, About, MIDI and Display each take the focus in turn. Enter on Patch, type "glass", Tab to Glass Keys, Enter. Then click a few buttons: no ring, no tip.
- Take the Tour from About, press Next, then Escape: the card closes, your Patch comes back, and the focus is on About. Start a Tutorial from the Tutorial button, then Escape on its card: it quits, and the focus is on Tutorial.
- With VoiceOver: Tab to Tap, press Enter three times, then wait a moment. It says the new tempo.

## Review (`/code-review` since 0d56854, 2026-11-07)

Fixed:
- **Spec:** the card's Escape stopped the key going further, so a tip open elsewhere stayed up as the card closed. Now the key goes on, marked as taken, and the about line leaves a taken Escape alone. The Tap test also checks that the tempo is said once and nothing more after it settles.
- **Standards:** the new module's comment describes the code, not the bug; its helper has a name that says it acts. The Tour, Tutorial and welcome tests that focused a button by script, because Safari once skipped buttons, now reach it by Shift+Tab. The Tab test reads the focused name in one place.

Noted, not changed:
- The observer watches only buttons added to the page, not a tabindex taken away later. Nothing in the app takes one away (every `tabIndex` is always 0 or −1).
- The Tap test runs at the laptop's width. On a phone, Tap sits in the Tempo panel and the same status speaks for it.
- A click focusing a button in Safari, and so Space or Enter pressing it again, is call 2 above.
