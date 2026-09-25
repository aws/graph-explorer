import { describe, expect, test } from "vitest";

import type { SchemaStorageModel } from "@/core";

import {
  createRandomEdgeConnection,
  createRandomSchema,
} from "@/utils/testing";

import { edgeConnectionNotice } from "./edgeConnectionNotice";

function schemaWith(
  overrides: Partial<SchemaStorageModel> = {},
): SchemaStorageModel {
  return { ...createRandomSchema(), ...overrides };
}

describe("edgeConnectionNotice", () => {
  test("is failed with the error when a query error is present", () => {
    const error = new Error("boom");
    const schema = schemaWith({ edgeConnections: undefined });

    expect(edgeConnectionNotice(schema, error)).toStrictEqual({
      kind: "failed",
      error,
    });
  });

  test("is failed with a null error when the persisted failure flag is set but no error object exists", () => {
    const schema = schemaWith({
      edgeConnections: undefined,
      lastEdgeConnectionSyncFail: true,
    });

    expect(edgeConnectionNotice(schema, null)).toStrictEqual({
      kind: "failed",
      error: null,
    });
  });

  test("is failed even when partial connections exist from exploring after a failure", () => {
    const schema = schemaWith({
      lastEdgeConnectionSyncFail: true,
    });

    expect(edgeConnectionNotice(schema, null)).toStrictEqual({
      kind: "failed",
      error: null,
    });
  });

  test("is not-discovered when edgeConnections is undefined and there is no failure flag or error", () => {
    const schema = schemaWith({
      edgeConnections: undefined,
      lastEdgeConnectionSyncFail: false,
    });

    expect(edgeConnectionNotice(schema, null)).toStrictEqual({
      kind: "not-discovered",
    });
  });

  test("is null when edgeConnections is an empty array", () => {
    const schema = schemaWith({
      edgeConnections: [],
      lastEdgeConnectionSyncFail: false,
    });

    expect(edgeConnectionNotice(schema, null)).toBeNull();
  });

  test("is null when edgeConnections is populated", () => {
    const schema = schemaWith({
      edgeConnections: [createRandomEdgeConnection()],
      lastEdgeConnectionSyncFail: false,
    });

    expect(edgeConnectionNotice(schema, null)).toBeNull();
  });
});
