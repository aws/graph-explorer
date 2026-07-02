import localForage from "localforage";
import { afterEach, vi } from "vitest";

import { createEdgeType, createVertexType } from "@/core/entities";
import { logger } from "@/utils";

import type {
  EdgeStyleStorage,
  LegacyUserStylingStorage,
  VertexStyleStorage,
} from "./graphStyles";

import {
  migrateUserStylingIfNeeded,
  runUserStylingMigration,
} from "./migrateUserStyling";
import { persistenceStatusStore } from "./persistence";

/**
 * BACKWARD COMPATIBILITY — PERSISTED DATA
 *
 * Older versions stored all styling under a single `"user-styling"` key as a
 * `LegacyUserStylingStorage` object: `{ vertices: VertexStyleStorage[], edges:
 * EdgeStyleStorage[] }`. Styling is now stored as two type-keyed maps
 * under `"user-vertex-styles"` and `"user-edge-styles"` — the user-defined layer of the
 * planned `<layer>-<entity>-styles` set. This migration converts the old shape
 * to the new one on startup.
 *
 * The old `"user-styling"` key is intentionally left untouched as a rollback
 * escape hatch; deleting it is a separate follow-up.
 *
 * DO NOT delete or weaken these tests without confirming that all persisted data
 * has been migrated or that the old shape is no longer in the wild.
 */
describe("migrateUserStylingIfNeeded", () => {
  it("converts old user-styling arrays into type-keyed maps", async () => {
    const vertexStyle: VertexStyleStorage = {
      type: createVertexType("Person"),
      color: "#ff0000",
    };
    const edgeStyle: EdgeStyleStorage = {
      type: createEdgeType("knows"),
      lineColor: "#00ff00",
    };
    await localForage.setItem<LegacyUserStylingStorage>("user-styling", {
      vertices: [vertexStyle],
      edges: [edgeStyle],
    });

    await migrateUserStylingIfNeeded();

    expect(await localForage.getItem("user-vertex-styles")).toStrictEqual(
      new Map([[vertexStyle.type, vertexStyle]]),
    );
    expect(await localForage.getItem("user-edge-styles")).toStrictEqual(
      new Map([[edgeStyle.type, edgeStyle]]),
    );
  });

  it("leaves the old user-styling key untouched as a rollback escape hatch", async () => {
    const old: LegacyUserStylingStorage = {
      vertices: [{ type: createVertexType("Person") }],
      edges: [{ type: createEdgeType("knows") }],
    };
    await localForage.setItem<LegacyUserStylingStorage>("user-styling", old);

    await migrateUserStylingIfNeeded();

    expect(await localForage.getItem("user-styling")).toStrictEqual(old);
  });

  it("does nothing for a fresh user with no stored styling", async () => {
    await migrateUserStylingIfNeeded();

    expect(await localForage.getItem("user-vertex-styles")).toBeNull();
    expect(await localForage.getItem("user-edge-styles")).toBeNull();
  });

  it("is a no-op when both new keys already exist", async () => {
    const existingVertexStyles = new Map([
      [createVertexType("Existing"), { type: createVertexType("Existing") }],
    ]);
    const existingEdgeStyles = new Map([
      [createEdgeType("has"), { type: createEdgeType("has") }],
    ]);
    await localForage.setItem("user-vertex-styles", existingVertexStyles);
    await localForage.setItem("user-edge-styles", existingEdgeStyles);
    await localForage.setItem<LegacyUserStylingStorage>("user-styling", {
      vertices: [{ type: createVertexType("Person") }],
      edges: [{ type: createEdgeType("knows") }],
    });

    await migrateUserStylingIfNeeded();

    // Both pre-existing migrated maps are preserved, not overwritten from the old key.
    expect(await localForage.getItem("user-vertex-styles")).toStrictEqual(
      existingVertexStyles,
    );
    expect(await localForage.getItem("user-edge-styles")).toStrictEqual(
      existingEdgeStyles,
    );
  });

  it("completes a partial write when only vertex-styles exists", async () => {
    const vertexStyle: VertexStyleStorage = {
      type: createVertexType("Person"),
      color: "#ff0000",
    };
    const edgeStyle: EdgeStyleStorage = {
      type: createEdgeType("knows"),
      lineColor: "#00ff00",
    };
    // Simulate a crash after vertex-styles was written but before edge-styles was written.
    await localForage.setItem<LegacyUserStylingStorage>("user-styling", {
      vertices: [vertexStyle],
      edges: [edgeStyle],
    });
    await localForage.setItem(
      "user-vertex-styles",
      new Map([[vertexStyle.type, vertexStyle]]),
    );

    await migrateUserStylingIfNeeded();

    // edge-styles is recovered from user-styling.
    expect(await localForage.getItem("user-edge-styles")).toStrictEqual(
      new Map([[edgeStyle.type, edgeStyle]]),
    );
    // vertex-styles is preserved, not overwritten from the legacy key.
    expect(await localForage.getItem("user-vertex-styles")).toStrictEqual(
      new Map([[vertexStyle.type, vertexStyle]]),
    );
  });

  it("completes a partial write when only edge-styles exists", async () => {
    const vertexStyle: VertexStyleStorage = {
      type: createVertexType("Person"),
      color: "#ff0000",
    };
    const edgeStyle: EdgeStyleStorage = {
      type: createEdgeType("knows"),
      lineColor: "#00ff00",
    };
    // Simulate a crash after edge-styles was written but before vertex-styles was written.
    await localForage.setItem<LegacyUserStylingStorage>("user-styling", {
      vertices: [vertexStyle],
      edges: [edgeStyle],
    });
    await localForage.setItem(
      "user-edge-styles",
      new Map([[edgeStyle.type, edgeStyle]]),
    );

    await migrateUserStylingIfNeeded();

    // vertex-styles is recovered from user-styling.
    expect(await localForage.getItem("user-vertex-styles")).toStrictEqual(
      new Map([[vertexStyle.type, vertexStyle]]),
    );
    // edge-styles is preserved, not overwritten from the legacy key.
    expect(await localForage.getItem("user-edge-styles")).toStrictEqual(
      new Map([[edgeStyle.type, edgeStyle]]),
    );
  });

  it("preserves a surviving key that was edited after the first migration", async () => {
    // The legacy snapshot is never updated post-migration, so a key that
    // survives a partial loss may hold newer edits the snapshot doesn't know
    // about. Recovery must fill the missing key without clobbering the edited one.
    const legacyVertexStyle: VertexStyleStorage = {
      type: createVertexType("Person"),
      color: "#ff0000",
    };
    const edgeStyle: EdgeStyleStorage = {
      type: createEdgeType("knows"),
      lineColor: "#00ff00",
    };
    await localForage.setItem<LegacyUserStylingStorage>("user-styling", {
      vertices: [legacyVertexStyle],
      edges: [edgeStyle],
    });
    // vertex-styles has diverged from the legacy snapshot (user changed the color),
    // and edge-styles was lost (e.g. single-key eviction).
    const editedVertexStyles = new Map([
      [legacyVertexStyle.type, { ...legacyVertexStyle, color: "#0000ff" }],
    ]);
    await localForage.setItem("user-vertex-styles", editedVertexStyles);

    await migrateUserStylingIfNeeded();

    // The edited vertex-styles must survive, not revert to the legacy color.
    expect(await localForage.getItem("user-vertex-styles")).toStrictEqual(
      editedVertexStyles,
    );
    // edge-styles is recovered from the legacy key.
    expect(await localForage.getItem("user-edge-styles")).toStrictEqual(
      new Map([[edgeStyle.type, edgeStyle]]),
    );
  });

  it("collapses duplicate types to the last entry", async () => {
    const first: VertexStyleStorage = {
      type: createVertexType("Person"),
      color: "#111111",
    };
    const second: VertexStyleStorage = {
      type: createVertexType("Person"),
      color: "#222222",
    };
    await localForage.setItem<LegacyUserStylingStorage>("user-styling", {
      vertices: [first, second],
    });

    await migrateUserStylingIfNeeded();

    expect(await localForage.getItem("user-vertex-styles")).toStrictEqual(
      new Map([[first.type, second]]),
    );
  });

  it("logs each storage key it migrates", async () => {
    await localForage.setItem<LegacyUserStylingStorage>("user-styling", {
      vertices: [{ type: createVertexType("Person") }],
      edges: [{ type: createEdgeType("knows") }],
    });

    await migrateUserStylingIfNeeded();

    expect(logger.debug).toHaveBeenCalledWith(
      expect.stringContaining(`"user-vertex-styles"`),
    );
    expect(logger.debug).toHaveBeenCalledWith(
      expect.stringContaining(`"user-edge-styles"`),
    );
  });

  it("only logs the key it actually migrates during partial-write recovery", async () => {
    const edgeStyle: EdgeStyleStorage = {
      type: createEdgeType("knows"),
      lineColor: "#00ff00",
    };
    await localForage.setItem<LegacyUserStylingStorage>("user-styling", {
      vertices: [{ type: createVertexType("Person") }],
      edges: [edgeStyle],
    });
    // vertex-styles already migrated; only edge-styles is missing.
    await localForage.setItem(
      "user-vertex-styles",
      new Map([
        [createVertexType("Person"), { type: createVertexType("Person") }],
      ]),
    );

    await migrateUserStylingIfNeeded();

    expect(logger.debug).toHaveBeenCalledWith(
      expect.stringContaining(`"user-edge-styles"`),
    );
    expect(logger.debug).not.toHaveBeenCalledWith(
      expect.stringContaining(`"user-vertex-styles"`),
    );
  });
});

/**
 * `runUserStylingMigration` wraps the migration so it never throws into its
 * caller (the top-level `await` in `storageAtoms.ts`). A failure is reported
 * through the shared persistence-status store — the same channel as every other
 * IndexedDB write failure — so the "Changes not saved" indicator surfaces it.
 */
describe("runUserStylingMigration", () => {
  afterEach(() => {
    persistenceStatusStore.reset();
    vi.restoreAllMocks();
  });

  it("reports a migration failure to the persistence-status store", async () => {
    const error = new DOMException("Migration boom", "InvalidStateError");
    vi.spyOn(localForage, "getItem").mockRejectedValue(error);

    await expect(runUserStylingMigration()).resolves.toBeUndefined();

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
    vi.spyOn(localForage, "getItem").mockRejectedValue(
      new DOMException("Out of space", "QuotaExceededError"),
    );

    await runUserStylingMigration();

    expect(persistenceStatusStore.getSnapshot().failures[0]?.reason).toBe(
      "terminal-quota",
    );
  });

  it("leaves the store idle when the migration succeeds", async () => {
    await runUserStylingMigration();

    expect(persistenceStatusStore.getSnapshot().status).toBe("idle");
  });
});
