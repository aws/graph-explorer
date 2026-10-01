import { createArray } from "@shared/utils/testing";
import { describe, expect, test } from "vitest";

import { createRandomSchema } from "@/utils/testing";

import type { SchemaStorageModel } from "../StateProvider";

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
