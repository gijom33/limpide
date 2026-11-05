# 143: Bluetooth MIDI

**What to build:** The owner's idea (inbox, 2026-10-31): "Support Bluetooth MIDI. My TempoPAD C16 supports it. Exciting feature."

What is known before any research: the page reaches MIDI through the browser's Web MIDI, which lists the ports the operating system gives it. On a Mac, a Bluetooth MIDI device paired in Audio MIDI Setup becomes such a port, and a paired C16 plays Limpide with no change: checked with the owner on the real C16 with [34](./34-c16-bank-layout.md)'s (2026-10-31), its Bluetooth name ("Synido TempoPAD C16 BT Bluetooth") recognised as a C16. What is left to know is its latency (in [145](./145-the-c16-layout-strip-by-strip.md)'s comments, waiting on the owner's test over USB). Other systems differ (Windows, Android, ChromeOS); Safari and iOS have no Web MIDI at all.

**Blocked by:** none

**Status:** done (2026-11-04). Built (2026-11-01) on night/2026-11-01, released in 1.19.0; accepted by the owner, tried in part and the rest trusted: "All issues waiting on my feedback look fine, I tested some, others trust you."

## Decisions

1. **v1 says what works; v2 the rest.** In v1 the MIDI panel says, in a line, that a Bluetooth MIDI Controller works once paired in the system (Audio MIDI Setup on a Mac), as the owner's C16 does; nothing else is built. Bluetooth on Windows, Android and ChromeOS, and its latency, are v2, not committed. Decided by the owner, 2026-10-31 ("ok on all questions"), on question 1 below.

## Agent Brief

**Category:** enhancement
**Summary:** The MIDI panel says that a Bluetooth MIDI Controller works once paired in the system.

**Current behavior:** A Bluetooth Controller paired on a Mac already plays Limpide (the C16 is recognised by its Bluetooth name), but nothing on the page says so.

**Desired behavior:** The MIDI panel's text (and its tip) says in one line that Bluetooth Controllers work once paired in the system's MIDI settings (Audio MIDI Setup on a Mac); Safari and iOS have no Web MIDI, as the panel already says or now says.

**Acceptance criteria:**
- [ ] The MIDI panel shows the line; its spec covers it; every test passes in Linux's fonts too

**Out of scope:**
- Anything for Windows, Android or ChromeOS, and latency (v2)

## Questions for the owner

1. **v1 or v2?** Under v1's scope rule ([131](./131-v1.md), decision 12) a new idea goes to v2 unless it is a bug or polish of something in v1. Claude's recommendation: v1 if it is what the first check finds (a paired C16 plays, at most its Bluetooth name to recognise and a line in the MIDI panel on pairing); v2 if it needs more than that.
2. **Answered (2026-10-31): the paired C16 plays, its name recognised.** The first check, on the owner's Mac: pair the C16 over Bluetooth in Audio MIDI Setup, open Limpide, and Claude reads the port's name and what it sends from the page. Claude's recommendation: yes, with the C16 check of [34](./34-c16-bank-layout.md).
3. **Then a `/research` pass** on Bluetooth MIDI in Web MIDI on each system (Mac, Windows, Android, ChromeOS), for what the MIDI panel should say. Claude's recommendation: only if the first check works on the Mac.

## How it was built

Built on 2026-11-01, on night/2026-11-01: v1's line only (decision 1); Bluetooth on Windows, Android and ChromeOS, and its latency, stay v2, not committed.

- **The line:** with nothing connected, the MIDI panel and the MIDI button's tip (the same words) now read: "No MIDI Controller connected. Plug one in by USB and it is picked up straight away. A Bluetooth one plays once paired in the system's MIDI settings (Audio MIDI Setup on a Mac), as a TempoPAD C16 does." It takes the place of "(USB, or pair it over Bluetooth MIDI)", which did not say where to pair. Safari's and the iPhone's lines already said there is no Web MIDI there, so they stay as they were.
- Tests: `e2e/piano.spec.ts`, beside the other MIDI status tests: with Web MIDI and nothing plugged in, the tip and the panel say it.

**Calls made (Claude's call, open to the owner):**

1. **Only with nothing connected:** the line is in the words shown while no Controller is connected, the moment someone looks for how to connect one. Once one is connected, the panel names it, as before.
2. **The C16 named** ("as a TempoPAD C16 does") as the one checked, and Audio MIDI Setup as the Mac's place to pair; nothing is said of other systems, which are v2's to find out.

**To try:** open the MIDI panel with nothing plugged in (and hover the MIDI button) and read the line; then pair the C16 over Bluetooth in Audio MIDI Setup and see it connect.
