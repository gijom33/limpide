# 37: One width for every curve

**What to build:** Every Viewer's main curve drawn at the same width, so the plots read as one set. Today they differ: the LFO plot's line is 2 px, the Timeline's 1.5 and 1.75, the Scope's trace 1.5, the Spectrum's outline 1.5 and its Response Curve 1.25. The LFO plot is the heaviest and the Scope's trace looks thin beside the rest. Reference lines (grids, the Ideal, the Snapshot) stay at 1 px. From the inbox, 2026-10-25.

**Blocked by:** none

**Status:** not started.

- [ ] One width for the main curves, kept in one place: the LFO plot thinner than now, the Scope's trace a little thicker
- [ ] Every Viewer uses it: Scope, Spectrum (outline and Response Curve), Timeline, LFO plots
- [ ] Still at least 3:1 against the background in both themes (design principles, WCAG 1.4.11)
