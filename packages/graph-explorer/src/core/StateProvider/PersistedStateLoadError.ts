/** The app's saved state could not be read from browser storage at startup. */
export class PersistedStateLoadError extends Error {
  constructor(cause: unknown) {
    super("Could not load the saved app state", { cause });
    this.name = "PersistedStateLoadError";
  }
}
