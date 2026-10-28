# 67: Small fixes after the 1.12 reviews

**What to build:** The small lines the 1.12.0 and 1.12.1 code reviews sent to the inbox, triaged 2026-10-27.

**Blocked by:** none

**Status:** in progress. The ticks done (2026-10-27); the other three to build

- [x] **The Harmonic Markers' ticks after a reload:** they still draw over an empty Spectrum, while the Ideal rings hide. The owner wrote "ideal harmonic markers": should the ticks hide too? Decided by the owner (2026-10-27): yes. Ticks and labels show only while the trace shows a sound, as the Ideal rings (`src/viewers/spectrum.ts`; the count as `data-markers`, tested in `e2e/overlays.spec.ts`).
- [ ] **The Timeline key's tooltips by keyboard and screen reader:** its entries are reached by hover and long press only, are not focusable and have no description
- [ ] **A folded Demo card and its caption:** folding hides the caption, which is also what a screen reader hears change (aria-live); keep the live text announced while folded
- [ ] **The cards' phone breakpoint in one place:** 600 px is written in `cardPlacement.tsx` as well as the CSS; and the clamp uses `innerWidth`, so a card can slide under a scroll bar (use the document's client width)
