# 39: Multi-touch on the piano

**What to build:** On a touch screen each finger on the piano plays its own Note, as each key of the computer keyboard does, so a chord can be played with several Voices. Today the piano follows one pointer ([Piano.tsx](../../src/ui/Piano.tsx)): a second finger takes the first one's place, and a finger sliding across the keys plays one Note after another. That slide stays, finger by finger. On one Voice the newest finger sounds, as the newest key does (ADR-0005). From the inbox, 2026-10-25.

**Blocked by:** none

**Status:** done, tried by the owner on a real phone (2026-10-26): chords play. The piano keeps a Note per pointer (`Piano.tsx`); two fingers on one key are two holders of one Note, which the Note input already counted for the computer keyboard, the piano and MIDI at once.

- [x] Every pointer on the piano is a Note of its own: down plays, up or cancel releases, sliding moves that finger's Note only
- [x] Two fingers on the same key: one Note, released when the last finger leaves it
- [x] With Voices above 1 a chord sounds and the piano lights each key (the pitch marker's dot on each, issue 21); on 1 Voice, the newest finger's Note
- [x] e2e with touch emulated: two and three fingers, slides, releasing in any order (Chromium's touch input, so Chromium only, as the other touch tests)
- [x] Tried on a real phone (the owner, 2026-10-26)
