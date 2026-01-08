import { describe, expect, test } from "vitest";
import type { RawConfiguration } from "./types";
import { serializeData, deserializeData } from "../StateProvider/serializeData";
import {
  createRandomRawConfiguration,
  createRandomSchema,
} from "@/utils/testing";
import { createArray } from "@shared/utils/testing";
import type { SchemaStorageModel } from "../StateProvider";

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

  test("serialization round-trip preserves configuration with schema", () => {
    const config = createRandomRawConfiguration();
    config.schema = createRandomSchema();

    const serialized = serializeData(config);
    const deserialized = deserializeData(serialized) as RawConfiguration;

    expect(deserialized).toStrictEqual(config);
    expect(deserialized.schema?.lastUpdate).toBeInstanceOf(Date);
  });
});
