# 143: Bluetooth MIDI

**What to build:** The owner's idea (inbox, 2026-10-31): "Support Bluetooth MIDI. My TempoPAD C16 supports it. Exciting feature."

What is known before any research: the page reaches MIDI through the browser's Web MIDI, which lists the ports the operating system gives it. On a Mac, a Bluetooth MIDI device paired in Audio MIDI Setup becomes such a port, so a paired C16 may already play Limpide with no change; what may differ is the name it gives (Limpide recognises the C16 by "TempoPAD C16" to apply its layout) and its latency. Other systems differ (Windows, Android, ChromeOS); Safari and iOS have no Web MIDI at all.

**Blocked by:** the owner's answers below

**Status:** needs-triage · enhancement. Claude's call, open to the owner.

## Questions for the owner

1. **v1 or v2?** Under v1's scope rule ([131](./131-v1.md), decision 12) a new idea goes to v2 unless it is a bug or polish of something in v1. Claude's recommendation: v1 if it is what the first check finds (a paired C16 plays, at most its Bluetooth name to recognise and a line in the MIDI panel on pairing); v2 if it needs more than that.
2. **The first check, on the owner's Mac:** pair the C16 over Bluetooth in Audio MIDI Setup, open Limpide, and Claude reads the port's name and what it sends from the page. Claude's recommendation: yes, with the C16 check of [34](./34-c16-bank-layout.md).
3. **Then a `/research` pass** on Bluetooth MIDI in Web MIDI on each system (Mac, Windows, Android, ChromeOS), for what the MIDI panel should say. Claude's recommendation: only if the first check works on the Mac.
