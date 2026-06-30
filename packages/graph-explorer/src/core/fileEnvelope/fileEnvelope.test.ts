import { describe, expect, test } from "vitest";

import {
  createFileEnvelope,
  type EnvelopeExpectation,
  type FileEnvelope,
  parseFileEnvelope,
} from "./fileEnvelope";

const stylingExpectation: EnvelopeExpectation = {
  kind: "styling-export",
  supportedVersion: 1,
};

function blobOf(value: unknown): Blob {
  return new Blob([JSON.stringify(value)], { type: "application/json" });
}

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
    const blob = blobOf(envelope);

    return expect(
      parseFileEnvelope(blob, stylingExpectation),
    ).resolves.toStrictEqual({
      meta: envelope.meta,
      data: { foo: "bar" },
    });
  });

  test("strips unknown meta fields", () => {
    const envelope = {
      meta: {
        kind: "styling-export",
        version: "1.0",
        timestamp: "2026-06-24T00:00:00.000Z",
        source: "Graph Explorer",
        sourceVersion: "9.9.9",
        exportedBy: "future-field",
      },
      data: { hello: "world" },
    };
    const { exportedBy: _exportedBy, ...expectedMeta } = envelope.meta;

    return expect(
      parseFileEnvelope(blobOf(envelope), stylingExpectation),
    ).resolves.toStrictEqual({
      meta: expectedMeta,
      data: { hello: "world" },
    });
  });

  test("throws for invalid JSON", () => {
    const blob = new Blob(["not json"], { type: "application/json" });
    return expect(parseFileEnvelope(blob, stylingExpectation)).rejects.toThrow(
      "File is not valid JSON",
    );
  });

  test("throws when meta is missing", () => {
    return expect(
      parseFileEnvelope(blobOf({ data: {} }), stylingExpectation),
    ).rejects.toThrow("envelope structure");
  });

  test("throws when meta.kind is missing", () => {
    const blob = blobOf({
      meta: { version: "1.0", timestamp: "x", source: "x", sourceVersion: "x" },
      data: {},
    });
    return expect(parseFileEnvelope(blob, stylingExpectation)).rejects.toThrow(
      "envelope structure",
    );
  });

  test("throws when data is missing", () => {
    const blob = blobOf({
      meta: {
        kind: "styling-export",
        version: "1.0",
        timestamp: "x",
        source: "x",
        sourceVersion: "x",
      },
    });
    return expect(parseFileEnvelope(blob, stylingExpectation)).rejects.toThrow(
      "envelope structure",
    );
  });

  test("rejects a file whose kind does not match the expectation", () => {
    const blob = blobOf({
      meta: {
        kind: "graph-export",
        version: "1.0",
        timestamp: "x",
        source: "x",
        sourceVersion: "x",
      },
      data: {},
    });
    return expect(parseFileEnvelope(blob, stylingExpectation)).rejects.toThrow(
      /Expected a "styling-export" file.*got "graph-export"/,
    );
  });

  test("tolerates the legacy decimal version string form", async () => {
    const blob = blobOf({
      meta: {
        kind: "styling-export",
        version: "1.0",
        timestamp: "x",
        source: "x",
        sourceVersion: "x",
      },
      data: { vertices: {}, edges: {} },
    });
    const result = await parseFileEnvelope(blob, stylingExpectation);
    expect(result.meta.version).toBe("1.0");
  });

  test("rejects a newer version as too new", () => {
    const blob = blobOf({
      meta: {
        kind: "styling-export",
        version: "2.0",
        timestamp: "x",
        source: "x",
        sourceVersion: "x",
      },
      data: { vertices: {}, edges: {} },
    });
    return expect(parseFileEnvelope(blob, stylingExpectation)).rejects.toThrow(
      /newer version of Graph Explorer/,
    );
  });

  test("rejects an unparseable version string", () => {
    const blob = blobOf({
      meta: {
        kind: "styling-export",
        version: "not-a-version",
        timestamp: "x",
        source: "x",
        sourceVersion: "x",
      },
      data: { vertices: {}, edges: {} },
    });
    return expect(parseFileEnvelope(blob, stylingExpectation)).rejects.toThrow(
      /unrecognized version/,
    );
  });
});
