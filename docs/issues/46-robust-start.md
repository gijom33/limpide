# 46: A robust start in every browser

**What to build:** Three ways the page fails a visitor before they play, found by [review 9](../reviews/2026-10-26/9-ts-react-webaudio.md). From the inbox, 2026-10-26.

**Blocked by:** none

**Status:** done (2026-10-26). **Before the LinkedIn post:** yes

- [x] **Firefox:** every hold goes through `holdAt`, which falls back to cancelling what is scheduled and setting the current value where `cancelAndHoldAtTime` is missing. An engine test removes it in Chromium: before, the first Note threw ("not a function") and nothing sounded; now a Note sounds, releases, and the next one glides to pitch
- [x] Tried in a real Firefox by the owner (2026-10-26): "It works well on Firefox". On 1.8.1, the live site, so Firefox has `cancelAndHoldAtTime` today, or the fallback wasn't needed; the fallback stays for those that don't
- [x] **Storage refused:** with `localStorage` throwing (a privacy setting, some in-app browsers), the page renders nothing: `src/main.tsx:7` and `src/ui/App.tsx:534`, `:536` read it outside `safeStorage()` (`App.tsx:116`). Every read and write through it, and an error boundary that shows a message rather than a blank page. An e2e test with storage throwing. Done: `src/app/storage.ts` (`safeStorage`, every read and write guarded) used by `main.tsx` and `App`; `StartFailure` shows a message and a Reload button if rendering fails; `e2e/robustStart.spec.ts` opens and plays with storage refused
- [x] **MIDI permission at load:** desktop Chrome asks 0.7 s after load, before anything is touched (`App.tsx:500`). Ask when the MIDI panel opens (or MIDI Learn starts); at load, connect only if permission is already granted (`navigator.permissions.query({ name: 'midi' })`). The MIDI icon's states stay truthful. Done: asked when the MIDI panel opens; at load, connected if the browser already allowed it, shown as unavailable if it refused. The e2e stand-in Controllers are allowed ones (`midiPermission` in `e2e/fakeMidi.ts`); `e2e/robustStart.spec.ts` checks nothing is asked at load
- [x] A failing draw no longer stops the render loop for good: one Viewer's error is reported once, the others keep drawing (`renderLoop.test.ts`)
