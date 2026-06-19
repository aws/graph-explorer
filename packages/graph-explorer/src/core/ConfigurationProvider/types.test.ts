import { createArray } from "@shared/utils/testing";
import { describe, expect, test } from "vitest";

import {
  createRandomRawConfiguration,
  createRandomSchema,
} from "@/utils/testing";

import type { SchemaStorageModel } from "../StateProvider";
import type { RawConfiguration } from "./types";

import { deserializeData, serializeData } from "../StateProvider/serializeData";

describe("Schema", () => {
  test("serialization round-trip preserves schema data", () => {
    const schema = createRandomSchema();

    const serialized = serializeData(schema);
    const deserialized = deserializeData(serialized) as SchemaStorageModel;

    expect(deserialized).toStrictEqual(schema);
  });

  test("serialization round-trip preserves array of schemas", () => {
    const schemas = createArray(5, createRandomSchema);

    const serialized = serializeData(schemas);
    const deserialized = deserializeData(serialized) as SchemaStorageModel[];

    expect(deserialized).toStrictEqual(schemas);
  });

  test("serialization round-trip preserves schema with lastUpdate date", () => {
    const schema = createRandomSchema();
    schema.lastUpdate = new Date("2025-06-15T10:30:00.000Z");

    const serialized = serializeData(schema);
    const deserialized = deserializeData(serialized) as SchemaStorageModel;

    expect(deserialized.lastUpdate).toBeInstanceOf(Date);
    expect(deserialized.lastUpdate).toStrictEqual(schema.lastUpdate);
  });
});

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
