# Viewers and the audio engine live outside React

**Status:** accepted · **Date:** 2026-10-21 · **Decided by:** Claude, accepted by the owner

React renders only the controls and layout. The audio engine and the Viewer renderers are plain TypeScript modules: one `requestAnimationFrame` loop reads every Tap's analyser and draws onto canvases that React mounts once and never re-renders. Viewers redraw at 60 fps from data that changes every frame, and routing that through React state would cost re-renders for no benefit. A future reader shouldn't "fix" this by turning Viewers into stateful React components.
