# The page's stores are built once, and building them starts the sound

**Status:** accepted · **Date:** 2026-10-28 · **Decided by:** the owner (the code review of issues 73 to 79)

Amends [ADR-0013](./0013-the-patch-lives-outside-react.md)'s consequence "building it has no side effect" (ADR-0013 is frozen, ADR-0010).

Building the Patch store does have effects: it chooses the start (a Share link's Patch, else the Last session, else Init), hands it to the engine and the Note input, and schedules the first autosave of the Last session. Building the Viewer settings store (issue 77) hands the engine the Amp Tap's source. What keeps React's StrictMode from doing any of it twice is that both stores are built once per page, beside the audio session, never in a component.

## Consequences

- A store is made in the audio session, never in a component's initialiser.
- Clearing the Share link from the address stays outside the stores, a step after the page has started: a second build must still find the link.
