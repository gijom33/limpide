# 29: Phone header, round two

**What to build:** On a phone, the header keeps less while the page scrolls down and moves more gently. From the inbox, 2026-10-25.

**Blocked by:** none

**Status:** done. The header never changes height: it slides up under the screen's top edge (a sticky offset), so nothing below it moves and Safari's scroll is never disturbed. The MIDI icon's colour is the status at every width, and the dot is gone everywhere.

- [x] Scrolling down hides the playing row too (octave buttons, Demo, Song, Hold, MIDI, About): only the piano stays; any scroll up brings both rows back
- [x] Hiding and showing the header's rows slides smoothly instead of jumping (reduced motion: no slide)
- [x] Display moves from the first row to the playing row, left of About, so the Patch name gets the first row's room
- [x] The MIDI button's icon carries its status in place of the dot above it (saves a line): green with a device connected, yellow with none; struck through when the browser has no MIDI
- [x] Tapping a lower section in the strip keeps the header slid away once the page arrives (the jump now ends on arrival or `scrollend`, not after a 150 ms pause, which iOS's smooth scroll can outlast); not yet checked on a real iPhone
