/**
 * Holds a value derived from live state (the Note's frequency, the Response Curve…) while the Viewers are
 * frozen, so everything drawn over a frozen frame still belongs to that frame.
 */
export function createFreezeLatch<T>() {
  let held: { value: T } | undefined;
  return (frozen: boolean, live: () => T): T => {
    if (!frozen || !held) held = { value: live() };
    return held.value;
  };
}
