# The Patch lives in a store outside React, and the engine hears each change first

**Status:** accepted · **Date:** 2026-10-28 · **Decided by:** the owner (grilling of [issue 73](../issues/73-patch-store.md))

Extends [ADR-0002](./0002-viewers-and-engine-live-outside-react.md).

The Patch being played is kept in one store per page, outside React. Every change, whoever makes it (a hand, a Controller, the Demo, a Tutorial, a load), goes through the store, which hands the new Patch to the engine and the Note input synchronously, then tells its subscribers, React among them through `useSyncExternalStore`. Each change is reported with who made it, so a rule about who turned what (the Demo's "turned by hand") listens rather than being written into by every caller.

The Patch is read between renders: a Controller's Pickup reads it, the Demo turns knobs on the beat, a Controller's pads step Presets faster than React renders, and the rings and the Pitch marker read it every frame. Kept as React state, it needed a reference mirrored beside it and an effect to reach the engine, and each writer kept the three in step by hand.

## Considered Options

- **React state, a mirrored reference, and an effect that applies the Patch** (what it was): the engine heard most changes a render late and the Demo's twice, and the invariant lived in three hooks.
- **A store that React writes and the engine subscribes to like any other listener:** simpler, but the order in which the engine and React hear a change would depend on who subscribed first.

## Consequences

- A future reader should not move the Patch back into React state; a component reads it from the store.
- The store is made once per page beside the audio session, because React's StrictMode builds first state twice; building it has no side effect.
- The engine keeps its guard against two Patches at the same instant: a knob drag can now send two inside one audio render quantum.
