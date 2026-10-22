/** An in-memory stand-in for localStorage. */
export function memoryStorage(initial: Record<string, string> = {}) {
  const data: Record<string, string> = { ...initial };
  return {
    getItem: (k: string) => data[k] ?? null,
    setItem: (k: string, v: string) => void (data[k] = v),
    data,
  };
}

/** Storage that refuses everything, as in some private-browsing modes. */
export const brokenStorage = {
  getItem: (): string | null => {
    throw new Error('denied');
  },
  setItem: () => {
    throw new Error('denied');
  },
};
