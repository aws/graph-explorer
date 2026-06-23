import { afterEach, beforeEach, vi } from "vitest";

/**
 * The user-styling migration runs in a top-level `await` in `storageAtoms.ts`,
 * before React mounts. A failure must not crash the module (which would leave
 * every atom undefined); instead it is reported through the shared
 * persistence-status store so the "Changes not saved" indicator surfaces it
 * alongside every other write failure.
 *
 * These tests drive that module-load catch by mocking the migration to throw,
 * then importing `storageAtoms` and asserting the singleton store recorded the
 * failure. `vi.resetModules` gives each case a fresh module graph so the
 * singleton and the mock do not bleed across tests.
 */
describe("storageAtoms user-styling migration failure", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.doUnmock("./migrateUserStyling");
  });

  it("reports a migration failure to the persistence-status store", async () => {
    const error = new DOMException("Migration boom", "InvalidStateError");
    vi.doMock("./migrateUserStyling", () => ({
      migrateUserStylingIfNeeded: () => Promise.reject(error),
    }));

    // Importing the module triggers the top-level migration + catch.
    await import("./storageAtoms");
    const { persistenceStatusStore } = await import("./persistence");

    const snapshot = persistenceStatusStore.getSnapshot();
    expect(snapshot.status).toBe("failed");
    expect(snapshot.failures).toHaveLength(1);
    expect(snapshot.failures[0]).toMatchObject({
      key: "user-styling-migration",
      // InvalidStateError is not a known terminal error, so it classifies as retryable.
      reason: "retryable",
      attemptCount: 1,
      details: { name: "InvalidStateError", message: "Migration boom" },
    });
  });

  it("classifies a quota failure as terminal", async () => {
    vi.doMock("./migrateUserStyling", () => ({
      migrateUserStylingIfNeeded: () =>
        Promise.reject(new DOMException("Out of space", "QuotaExceededError")),
    }));

    await import("./storageAtoms");
    const { persistenceStatusStore } = await import("./persistence");

    expect(persistenceStatusStore.getSnapshot().failures[0]?.reason).toBe(
      "terminal-quota",
    );
  });

  it("leaves the store idle when the migration succeeds", async () => {
    vi.doMock("./migrateUserStyling", () => ({
      migrateUserStylingIfNeeded: () => Promise.resolve(),
    }));

    await import("./storageAtoms");
    const { persistenceStatusStore } = await import("./persistence");

    expect(persistenceStatusStore.getSnapshot().status).toBe("idle");
  });
});
