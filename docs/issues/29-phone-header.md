# 29: Phone header, round two

**What to build:** On a phone, the header keeps less while the page scrolls down and moves more gently. From the inbox, 2026-10-25.

**Blocked by:** none

**Status:** ready-for-agent

- [ ] Scrolling down hides the playing row too (octave buttons, Demo, Song, Hold, MIDI, About): only the piano stays; any scroll up brings both rows back
- [ ] Hiding and showing the header's rows slides smoothly instead of jumping (reduced motion: no slide)
- [ ] Display moves from the first row to the playing row, left of About, so the Patch name gets the first row's room
- [ ] The MIDI button's icon carries its status in place of the dot above it (saves a line): green with a device connected, yellow with none; struck through when the browser has no MIDI
