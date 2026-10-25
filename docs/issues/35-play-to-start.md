# 35: A call to play

**What to build:** Until sound has started, the page invites a first Note: a label over the piano's keys, "Play to start the sound" ("Tap a key to start the sound" on touch screens), gone the moment sound runs. Browsers keep audio suspended until the page is used (autoplay policy); today a returning visitor gets no sign of that, and the only notice comes after a click the browser still refused. From the inbox, 2026-10-25.

**Blocked by:** none

**Status:** done. Shown whenever the browser holds sound back (its AudioContext is suspended), on every visit, and only then: a browser that allows sound from the start switches it on a moment after the page opens, so the label fades in after 0.4 s and is never seen there. It sits over the keys and lets presses through, so it takes no room.

PRD story 11 says sound starts with the first key press, click or drag, "with no button to press first, and a quiet notice only if the browser still holds sound back". An invitation is not a button, but it is a notice shown before anything was refused, so the story changes with it.

- [x] Owner's call (2026-10-25): every visit, whenever the browser holds sound back, by the piano
- [x] The invitation shown while the audio is waiting, never once it runs; the blocked notice unchanged
- [x] Phone and laptop wording; it takes no room the layout needs (no shift when it goes)
- [x] PRD story 11 updated
