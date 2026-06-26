import { describe, expect, test } from "vitest";

import {
  createFileEnvelope,
  parseFileEnvelope,
  type FileEnvelope,
} from "./fileEnvelope";

describe("createFileEnvelope", () => {
  test("stamps metadata with kind, version, and payload", () => {
    const data = { vertices: {}, edges: {} };
    const envelope = createFileEnvelope("styling-export", "1.0", data);

    expect(envelope.meta.kind).toBe("styling-export");
    expect(envelope.meta.version).toBe("1.0");
    expect(envelope.meta.source).toBe("Graph Explorer");
    expect(envelope.meta.sourceVersion).toBe(__GRAPH_EXP_VERSION__);
    expect(envelope.meta.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(envelope.data).toBe(data);
  });
});

describe("parseFileEnvelope", () => {
  test("parses a valid envelope and returns meta + data", () => {
    const envelope: FileEnvelope<{ foo: string }> = createFileEnvelope(
      "styling-export",
      "1.0",
      { foo: "bar" },
    );
    const json = JSON.stringify(envelope);
    const blob = new Blob([json], { type: "application/json" });

    return expect(parseFileEnvelope(blob)).resolves.toStrictEqual({
      meta: envelope.meta,
      data: { foo: "bar" },
    });
  });

  test("preserves unknown meta fields (forward-compat)", () => {
    const envelope = {
      meta: {
        kind: "styling-export",
        version: "2.0",
        timestamp: "2026-06-24T00:00:00.000Z",
        source: "Graph Explorer",
        sourceVersion: "9.9.9",
        exportedBy: "future-field",
      },
      data: { hello: "world" },
    };
    const blob = new Blob([JSON.stringify(envelope)], {
      type: "application/json",
    });

    return expect(parseFileEnvelope(blob)).resolves.toStrictEqual({
      meta: envelope.meta,
      data: { hello: "world" },
    });
  });

  test("throws for invalid JSON", () => {
    const blob = new Blob(["not json"], { type: "application/json" });
    return expect(parseFileEnvelope(blob)).rejects.toThrow(
      "File is not valid JSON",
    );
  });

  test("throws when meta is missing", () => {
    const blob = new Blob([JSON.stringify({ data: {} })], {
      type: "application/json",
    });
    return expect(parseFileEnvelope(blob)).rejects.toThrow(
      "envelope structure",
    );
  });

  test("throws when meta.kind is missing", () => {
    const blob = new Blob(
      [
        JSON.stringify({
          meta: {
            version: "1.0",
            timestamp: "x",
            source: "x",
            sourceVersion: "x",
          },
          data: {},
        }),
      ],
      { type: "application/json" },
    );
    return expect(parseFileEnvelope(blob)).rejects.toThrow(
      "envelope structure",
    );
  });

  test("throws when data is missing", () => {
    const blob = new Blob(
      [
        JSON.stringify({
          meta: {
            kind: "styling-export",
            version: "1.0",
            timestamp: "x",
            source: "x",
            sourceVersion: "x",
          },
        }),
      ],
      { type: "application/json" },
    );
    return expect(parseFileEnvelope(blob)).rejects.toThrow(
      "envelope structure",
    );
  });

  test("parses unknown version on a best-effort basis (forward-compat)", async () => {
    const blob = new Blob(
      [
        JSON.stringify({
          meta: {
            kind: "styling-export",
            version: "99.0",
            timestamp: "x",
            source: "x",
            sourceVersion: "x",
          },
          data: { vertices: {}, edges: {} },
        }),
      ],
      { type: "application/json" },
    );
    const result = await parseFileEnvelope(blob);
    expect(result.meta.version).toBe("99.0");
    expect(result.data).toStrictEqual({ vertices: {}, edges: {} });
  });
});
