import { createArray } from "@shared/utils/testing";
import { describe, expect, test } from "vitest";

import type { SchemaStorageModel } from "@/core/StateProvider";

import {
  deserializeData,
  serializeData,
} from "@/core/StateProvider/serializeData";
import {
  createRandomRawConfiguration,
  createRandomSchema,
} from "@/utils/testing";

import type { RawConfiguration } from "./types";

describe("RawConfiguration", () => {
  test("serialization round-trip preserves configuration data", () => {
    const config = createRandomRawConfiguration();

    const serialized = serializeData(config);
    const deserialized = deserializeData(serialized) as RawConfiguration;

    expect(deserialized).toStrictEqual(config);
  });

  test("serialization round-trip preserves array of configurations", () => {
    const configs = createArray(5, createRandomRawConfiguration);

    const serialized = serializeData(configs);
    const deserialized = deserializeData(serialized) as RawConfiguration[];

    expect(deserialized).toStrictEqual(configs);
  });
});

/**
 * BACKWARD COMPATIBILITY — PERSISTED DATA
 *
 * `RawConfiguration` is persisted to IndexedDB via localforage. Older versions
 * embedded the schema directly on the stored config (`RawConfiguration.schema`).
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
      ...createRandomRawConfiguration(),
      schema: createRandomSchema(),
    } as RawConfiguration & { schema: SchemaStorageModel };

    const serialized = serializeData(legacyConfig);
    const deserialized = deserializeData(serialized) as typeof legacyConfig;

    expect(deserialized).toStrictEqual(legacyConfig);
    expect(deserialized.schema.lastUpdate).toBeInstanceOf(Date);
  });
});
