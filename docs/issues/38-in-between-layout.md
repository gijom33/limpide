# 38: A layout in between: the sections 2 × 2

**What to build:** Between the phone layout (up to 600 px, one section under another with the section strip) and the laptop's three stages side by side, a third layout: the four sections in a 2 × 2 grid, Oscillators and Filter on top, Amp and LFO & Envelopes under them. A foldable phone opened flat (a Samsung Galaxy Z Fold's inner screen is about 700 to 900 px wide) got one stage under another, each a screen wide, so the Oscillators filled the screen alone. From the inbox, 2026-10-25: a friend's foldable Samsung.

**Blocked by:** none

**Status:** built, to try on the friend's phone. From 601 to 860 px the sections sit 2 × 2: the chain is two columns, LFO & Envelopes in the Amp's row (it lives inside the chain since issue 43; before, `main` was the grid and the chain let its stages into it with `display: contents`), and each row's Viewers line up through the stages' subgrid. Below, a phone's layout; above, three stages across, unchanged.

- [x] Find the widths where three stages no longer leave the Viewers their floor, and where two do: the new layout's range, measured rather than guessed. From 601 to 860 px the stages were one under another, a Viewer up to 810 × 260 and the Oscillators alone on a foldable's screen; from 861 px three across, at the Viewers' floor (248 × 78) but the whole instrument on screen. The range is therefore 601 to 860; three across keeps 861 and up, where a laptop window or a tablet on its side fits without scrolling
- [x] Sections 2 × 2 in that range, each stage's Viewers at their floor or wider; the playing row and the piano as on a laptop
- [x] Portrait and landscape on a foldable's inner screen (about 700 × 840 and 840 × 700), and a small tablet (768 × 1024)
- [x] The design principles' audit (contrast, targets) at the new size: a foldable size (690 × 830) in `e2e/designPrinciples.spec.ts`, with the laptop's controls and so the laptop's two target waivers; `e2e/inBetweenLayout.spec.ts` for the layout at five sizes
- [ ] Tried on the friend's phone, its model and width noted here

## Found while building

- **The LFOs overhung by 14 px from 601 px up**, so the page scrolled sideways at 601 even before this issue: the compact windows' rule gives the Timeline two columns, leaving the LFOs (247 px each at least) a 200 px one. In the 2 × 2 layout the Timeline keeps one column, as on a phone.
- **Touch targets:** a foldable is a touch screen, but from 601 px up the controls are the laptop's, below 44 pt (selector options 22 px, the piano's black keys 12 px). Whether the in-between layout should get the phone's targets is left for the try on the real phone.
