# 37: One width for every curve

**What to build:** Every Viewer's main curve drawn at the same width, so the plots read as one set. Today they differ: the LFO plot's line is 2 px, the Timeline's 1.5 and 1.75, the Scope's trace 1.5, the Spectrum's outline 1.5 and its Response Curve 1.25. The LFO plot is the heaviest and the Scope's trace looks thin beside the rest. Reference lines (grids, the Ideal, the Snapshot) stay at 1 px. From the inbox, 2026-10-25.

**Blocked by:** none

**Status:** done. 1.75 px, the `--curve-w` token in styles.css, which the canvases read as they read the theme's colours; the LFO plot's line no longer scales with the plot. One exception, kept on purpose: the Spectrum's outline stays 1.5 device pixels, so Harmonic spikes three device pixels apart keep a dark gap between them.

- [x] One width for the main curves, kept in one place: the LFO plot thinner than now, the Scope's trace a little thicker
- [x] Every Viewer uses it: Scope, the Spectrum's Response Curve (its outline excepted, above), Timeline, LFO plots
- [x] Still at least 3:1 against the background in both themes (design principles, WCAG 1.4.11)
