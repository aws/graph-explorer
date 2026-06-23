import localForage from "localforage";

import { createEdgeType, createVertexType } from "@/core/entities";

import type {
  EdgePreferencesStorageModel,
  LegacyUserStylingStorageModel,
  VertexPreferencesStorageModel,
} from "./userPreferences";

import { migrateUserStylingIfNeeded } from "./migrateUserStyling";

/**
 * BACKWARD COMPATIBILITY — PERSISTED DATA
 *
 * Older versions stored all styling under a single `"user-styling"` key as a
 * `LegacyUserStylingStorageModel` object: `{ vertices: VertexPreferencesStorageModel[], edges:
 * EdgePreferencesStorageModel[] }`. Styling is now stored as two type-keyed maps
 * under `"vertex-styles"` and `"edge-styles"`. This migration converts the old
 * shape to the new one on startup.
 *
 * The old `"user-styling"` key is intentionally left untouched as a rollback
 * escape hatch; deleting it is a separate follow-up.
 *
 * DO NOT delete or weaken these tests without confirming that all persisted data
 * has been migrated or that the old shape is no longer in the wild.
 */
describe("migrateUserStylingIfNeeded", () => {
  it("converts old user-styling arrays into type-keyed maps", async () => {
    const vertexStyle: VertexPreferencesStorageModel = {
      type: createVertexType("Person"),
      color: "#ff0000",
    };
    const edgeStyle: EdgePreferencesStorageModel = {
      type: createEdgeType("knows"),
      lineColor: "#00ff00",
    };
    await localForage.setItem<LegacyUserStylingStorageModel>("user-styling", {
      vertices: [vertexStyle],
      edges: [edgeStyle],
    });

    await migrateUserStylingIfNeeded();

    expect(await localForage.getItem("vertex-styles")).toStrictEqual(
      new Map([[vertexStyle.type, vertexStyle]]),
    );
    expect(await localForage.getItem("edge-styles")).toStrictEqual(
      new Map([[edgeStyle.type, edgeStyle]]),
    );
  });

  it("leaves the old user-styling key untouched as a rollback escape hatch", async () => {
    const old: LegacyUserStylingStorageModel = {
      vertices: [{ type: createVertexType("Person") }],
      edges: [{ type: createEdgeType("knows") }],
    };
    await localForage.setItem<LegacyUserStylingStorageModel>(
      "user-styling",
      old,
    );

    await migrateUserStylingIfNeeded();

    expect(await localForage.getItem("user-styling")).toStrictEqual(old);
  });

  it("does nothing for a fresh user with no stored styling", async () => {
    await migrateUserStylingIfNeeded();

    expect(await localForage.getItem("vertex-styles")).toBeNull();
    expect(await localForage.getItem("edge-styles")).toBeNull();
  });

  it("is a no-op when both new keys already exist", async () => {
    const existingVertexStyles = new Map([
      [createVertexType("Existing"), { type: createVertexType("Existing") }],
    ]);
    const existingEdgeStyles = new Map([
      [createEdgeType("has"), { type: createEdgeType("has") }],
    ]);
    await localForage.setItem("vertex-styles", existingVertexStyles);
    await localForage.setItem("edge-styles", existingEdgeStyles);
    await localForage.setItem<LegacyUserStylingStorageModel>("user-styling", {
      vertices: [{ type: createVertexType("Person") }],
      edges: [{ type: createEdgeType("knows") }],
    });

    await migrateUserStylingIfNeeded();

    // Both pre-existing migrated maps are preserved, not overwritten from the old key.
    expect(await localForage.getItem("vertex-styles")).toStrictEqual(
      existingVertexStyles,
    );
    expect(await localForage.getItem("edge-styles")).toStrictEqual(
      existingEdgeStyles,
    );
  });

  it("completes a partial write when only vertex-styles exists", async () => {
    const vertexStyle: VertexPreferencesStorageModel = {
      type: createVertexType("Person"),
      color: "#ff0000",
    };
    const edgeStyle: EdgePreferencesStorageModel = {
      type: createEdgeType("knows"),
      lineColor: "#00ff00",
    };
    // Simulate a crash after vertex-styles was written but before edge-styles was written.
    await localForage.setItem<LegacyUserStylingStorageModel>("user-styling", {
      vertices: [vertexStyle],
      edges: [edgeStyle],
    });
    await localForage.setItem(
      "vertex-styles",
      new Map([[vertexStyle.type, vertexStyle]]),
    );

    await migrateUserStylingIfNeeded();

    // edge-styles is recovered from user-styling.
    expect(await localForage.getItem("edge-styles")).toStrictEqual(
      new Map([[edgeStyle.type, edgeStyle]]),
    );
    // vertex-styles is preserved, not overwritten from the legacy key.
    expect(await localForage.getItem("vertex-styles")).toStrictEqual(
      new Map([[vertexStyle.type, vertexStyle]]),
    );
  });

  it("completes a partial write when only edge-styles exists", async () => {
    const vertexStyle: VertexPreferencesStorageModel = {
      type: createVertexType("Person"),
      color: "#ff0000",
    };
    const edgeStyle: EdgePreferencesStorageModel = {
      type: createEdgeType("knows"),
      lineColor: "#00ff00",
    };
    // Simulate a crash after edge-styles was written but before vertex-styles was written.
    await localForage.setItem<LegacyUserStylingStorageModel>("user-styling", {
      vertices: [vertexStyle],
      edges: [edgeStyle],
    });
    await localForage.setItem(
      "edge-styles",
      new Map([[edgeStyle.type, edgeStyle]]),
    );

    await migrateUserStylingIfNeeded();

    // vertex-styles is recovered from user-styling.
    expect(await localForage.getItem("vertex-styles")).toStrictEqual(
      new Map([[vertexStyle.type, vertexStyle]]),
    );
    // edge-styles is preserved, not overwritten from the legacy key.
    expect(await localForage.getItem("edge-styles")).toStrictEqual(
      new Map([[edgeStyle.type, edgeStyle]]),
    );
  });

  it("preserves a surviving key that was edited after the first migration", async () => {
    // The legacy snapshot is never updated post-migration, so a key that
    // survives a partial loss may hold newer edits the snapshot doesn't know
    // about. Recovery must fill the missing key without clobbering the edited one.
    const legacyVertexStyle: VertexPreferencesStorageModel = {
      type: createVertexType("Person"),
      color: "#ff0000",
    };
    const edgeStyle: EdgePreferencesStorageModel = {
      type: createEdgeType("knows"),
      lineColor: "#00ff00",
    };
    await localForage.setItem<LegacyUserStylingStorageModel>("user-styling", {
      vertices: [legacyVertexStyle],
      edges: [edgeStyle],
    });
    // vertex-styles has diverged from the legacy snapshot (user changed the color),
    // and edge-styles was lost (e.g. single-key eviction).
    const editedVertexStyles = new Map([
      [legacyVertexStyle.type, { ...legacyVertexStyle, color: "#0000ff" }],
    ]);
    await localForage.setItem("vertex-styles", editedVertexStyles);

    await migrateUserStylingIfNeeded();

    // The edited vertex-styles must survive, not revert to the legacy color.
    expect(await localForage.getItem("vertex-styles")).toStrictEqual(
      editedVertexStyles,
    );
    // edge-styles is recovered from the legacy key.
    expect(await localForage.getItem("edge-styles")).toStrictEqual(
      new Map([[edgeStyle.type, edgeStyle]]),
    );
  });

  it("collapses duplicate types to the last entry", async () => {
    const first: VertexPreferencesStorageModel = {
      type: createVertexType("Person"),
      color: "#111111",
    };
    const second: VertexPreferencesStorageModel = {
      type: createVertexType("Person"),
      color: "#222222",
    };
    await localForage.setItem<LegacyUserStylingStorageModel>("user-styling", {
      vertices: [first, second],
    });

    await migrateUserStylingIfNeeded();

    expect(await localForage.getItem("vertex-styles")).toStrictEqual(
      new Map([[first.type, second]]),
    );
  });
});
