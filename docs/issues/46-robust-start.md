# 46: A robust start in every browser

**What to build:** Three ways the page fails a visitor before they play, found by [review 9](../reviews/2026-10-26/9-ts-react-webaudio.md). From the inbox, 2026-10-26.

**Blocked by:** none

**Status:** to do. **Before the LinkedIn post:** yes

- [ ] **Firefox:** check whether a Note sounds. `cancelAndHoldAtTime` (`synthEngine.ts:217`, `:395`, `:400`) may be missing there; if it is, fall back (cancel the scheduled values and set the current value) so Notes sound. Tried by the owner in Firefox, or with Playwright's Firefox installed
- [ ] **Storage refused:** with `localStorage` throwing (a privacy setting, some in-app browsers), the page renders nothing: `src/main.tsx:7` and `src/ui/App.tsx:534`, `:536` read it outside `safeStorage()` (`App.tsx:116`). Every read and write through it, and an error boundary that shows a message rather than a blank page. An e2e test with storage throwing
- [ ] **MIDI permission at load:** desktop Chrome asks 0.7 s after load, before anything is touched (`App.tsx:500`). Ask when the MIDI panel opens (or MIDI Learn starts); at load, connect only if permission is already granted (`navigator.permissions.query({ name: 'midi' })`). The MIDI icon's states stay truthful
- [ ] A failing draw no longer stops the render loop for good (one Viewer's error caught, the others keep drawing)
