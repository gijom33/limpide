# 24: About centred, and a welcome

**What to build:** About becomes a centred modal with a dimmed backdrop at every screen size, opened by an ⓘ button at every width (with the word "About" from 1200 px up) and by the logo. A brand-new browser (no Last session, no saved Patches) sees it once as a welcome: **Play the Demo** (which also starts the audio) and **Explore**. Opened from a Share link, it says someone shared a sound and its button plays the Demo phrase with that Patch.

**Blocked by:** none

**Status:** done. About was pinned to the top on laptop windows by a page rule for main's children; it now centres itself. The one-row header's word breakpoints moved up to make room for ⓘ, and from 861 to 919 px Hold shows its icon.

- [x] About centred vertically and horizontally at 375×812, 1000×800 and 1440×900
- [x] ⓘ button at every width; label from 1200 px up
- [x] Welcome shown once, only for a brand-new browser; remembered after it closes, however it closes
- [x] Share link variant plays the Demo phrase with the shared Patch
- [x] Play the Demo unlocks audio (story 11 still holds: no button is required to start sound)
- [x] e2e: first visit shows the welcome; a second visit doesn't; a Share link shows the shared variant; About is centred
