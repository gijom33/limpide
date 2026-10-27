/** The build that is running, set by Vite (`vite.config.ts`): shown in the About splash. */
declare const __BUILD__: {
  version: string;
  commit: string;
  date: string;
  /** Visits are counted (the published site only): About says so, and how. */
  counted: boolean;
};
