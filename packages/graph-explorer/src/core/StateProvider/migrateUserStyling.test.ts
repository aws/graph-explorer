import localForage from "localforage";

import { createEdgeType, createVertexType } from "@/core/entities";

import type {
  EdgePreferencesStorageModel,
  UserStyling,
  VertexPreferencesStorageModel,
} from "./userPreferences";

import { migrateUserStylingIfNeeded } from "./migrateUserStyling";

/**
 * BACKWARD COMPATIBILITY — PERSISTED DATA
 *
 * Older versions stored all styling under a single `"user-styling"` key as a
 * `UserStyling` object: `{ vertices: VertexPreferencesStorageModel[], edges:
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
    await localForage.setItem<UserStyling>("user-styling", {
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
    const old: UserStyling = {
      vertices: [{ type: createVertexType("Person") }],
      edges: [{ type: createEdgeType("knows") }],
    };
    await localForage.setItem<UserStyling>("user-styling", old);

    await migrateUserStylingIfNeeded();

    expect(await localForage.getItem("user-styling")).toStrictEqual(old);
  });

  it("does nothing for a fresh user with no stored styling", async () => {
    await migrateUserStylingIfNeeded();

    expect(await localForage.getItem("vertex-styles")).toBeNull();
    expect(await localForage.getItem("edge-styles")).toBeNull();
  });

  it("is a no-op when the new keys already exist", async () => {
    const existingVertexStyles = new Map([
      [createVertexType("Existing"), { type: createVertexType("Existing") }],
    ]);
    await localForage.setItem("vertex-styles", existingVertexStyles);
    await localForage.setItem<UserStyling>("user-styling", {
      vertices: [{ type: createVertexType("Person") }],
    });

    await migrateUserStylingIfNeeded();

    // The pre-existing migrated data is preserved, not overwritten from the old key.
    expect(await localForage.getItem("vertex-styles")).toStrictEqual(
      existingVertexStyles,
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
    await localForage.setItem<UserStyling>("user-styling", {
      vertices: [first, second],
    });

    await migrateUserStylingIfNeeded();

    expect(await localForage.getItem("vertex-styles")).toStrictEqual(
      new Map([[first.type, second]]),
    );
  });
});
