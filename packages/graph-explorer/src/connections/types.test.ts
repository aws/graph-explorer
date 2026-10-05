import { createArray } from "@shared/utils/testing";
import { describe, expect, test } from "vitest";

import type { SchemaStorageModel } from "@/core/StateProvider";

import {
  deserializeData,
  serializeData,
} from "@/core/StateProvider/serializeData";
import {
  createRandomSavedConnection,
  createRandomSchema,
} from "@/utils/testing";

import type { SavedConnection } from "./types";

describe("SavedConnection", () => {
  test("serialization round-trip preserves configuration data", () => {
    const config = createRandomSavedConnection();

    const serialized = serializeData(config);
    const deserialized = deserializeData(serialized) as SavedConnection;

    expect(deserialized).toStrictEqual(config);
  });

  test("serialization round-trip preserves array of configurations", () => {
    const configs = createArray(5, createRandomSavedConnection);

    const serialized = serializeData(configs);
    const deserialized = deserializeData(serialized) as SavedConnection[];

    expect(deserialized).toStrictEqual(configs);
  });
});

/**
 * BACKWARD COMPATIBILITY — PERSISTED DATA
 *
 * `SavedConnection` is persisted to IndexedDB via localforage. Older versions
 * embedded the schema directly on the stored config (`SavedConnection.schema`).
 * That field has been removed — the schema now lives only in `schemaAtom` — but
 * previously persisted configs may still carry it. This verifies that
 * serialization round-trips such a legacy config losslessly, including reviving
 * the embedded schema's `lastUpdate` back into a `Date`.
 *
 * DO NOT delete or weaken this test without confirming that legacy persisted
 * configs carrying an embedded schema are no longer a concern.
 */
describe("backward compatibility: legacy embedded schema on stored configuration", () => {
  test("serialization round-trip preserves a configuration carrying a legacy schema", () => {
    // Use `as` to simulate the legacy shape that TypeScript no longer allows.
    const legacyConfig = {
      ...createRandomSavedConnection(),
      schema: createRandomSchema(),
    } as SavedConnection & { schema: SchemaStorageModel };

    const serialized = serializeData(legacyConfig);
    const deserialized = deserializeData(serialized) as typeof legacyConfig;

    expect(deserialized).toStrictEqual(legacyConfig);
    expect(deserialized.schema.lastUpdate).toBeInstanceOf(Date);
  });
});
