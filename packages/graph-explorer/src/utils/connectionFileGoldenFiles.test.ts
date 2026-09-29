// @vitest-environment happy-dom
import * as fileSaver from "file-saver";
import { describe, expect, test, vi } from "vitest";

import type { ConfigurationContextProps } from "@/core";
import type { ConfigurationId } from "@/core/ConfigurationProvider";
import type { IriNamespace, RdfPrefix } from "@/utils/rdf";

import { createEdgeType, createVertexType } from "@/core";

import exportGolden from "./__fixtures__/connection-file-export-golden.txt?raw";
import legacyUrlDirect from "./__fixtures__/connection-file-legacy-url-direct.json?raw";
import legacyUrlProxy from "./__fixtures__/connection-file-legacy-url-proxy.json?raw";
import { parseConnectionFile } from "./parseConnectionFile";
import saveConfigurationToFile from "./saveConfigurationToFile";

/**
 * GOLDEN FILES — EXPORTED CONNECTION FILE
 *
 * Each fixture in `__fixtures__/` is an Exported Connection File as a shipped
 * build wrote it (or would accept on import), loaded with `?raw` so the test
 * sees the exact on-disk bytes.
 *
 * The import cases prove a current build still parses every historical shape,
 * including the pre-unified-proxy `url`/`proxyConnection` form and legacy
 * pass-through keys (`__inferred`, `dataType`). The export case compares the
 * writer's output byte-for-byte against `connection-file-export-golden.txt`,
 * so any change to the wire format — values, field order, or whitespace — is
 * caught here rather than shipping silently. That fixture is a `.txt` so the
 * formatter cannot reflow it and mask a real serialization change.
 *
 * DO NOT edit a fixture to make a test pass. A fixture is a historical
 * artifact; if a current build can no longer read one, that is a
 * backward-compatibility break to fix in the parser, not in the file. If the
 * export fixture no longer matches, the writer changed — decide whether that
 * change is intended and add a new fixture rather than mutating this one.
 */

vi.mock("file-saver", () => ({ saveAs: vi.fn() }));
const saveAsMock = vi.mocked(fileSaver.saveAs);

describe("golden Exported Connection Files import on the current build", () => {
  test("legacy url + proxyConnection shape with legacy pass-through keys", () => {
    const parsed = parseConnectionFile(JSON.parse(legacyUrlProxy));

    expect(parsed).not.toBeNull();
    const connection = parsed?.connection as Record<string, unknown>;
    expect(connection.url).toBe("https://proxy.example.com:443");
    expect(connection.graphDbUrl).toBe("https://neptune.example.com:8182");
    expect(connection.proxyConnection).toBe(true);
    expect(connection.awsAuthEnabled).toBe(true);
    expect(connection.awsRegion).toBe("us-west-2");
    expect(connection.serviceType).toBe("neptune-db");

    // Legacy pass-through keys survive parsing untouched.
    const vertex = parsed?.schema.vertices[0] as Record<string, unknown>;
    expect(vertex.color).toBe("#e66412");
    expect((vertex.attributes as Record<string, unknown>[])[0]).toStrictEqual({
      name: "code",
      dataType: "String",
    });
    const prefix = parsed?.schema.prefixes?.[0] as Record<string, unknown>;
    expect(prefix.__inferred).toBe(true);
    expect(prefix.__matches).toStrictEqual([
      "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
    ]);

    // An ISO lastUpdate string is coerced to a Date.
    expect(parsed?.schema.lastUpdate).toBeInstanceOf(Date);
    expect(parsed?.schema.lastUpdate?.toISOString()).toBe(
      "2024-01-01T12:30:00.000Z",
    );
  });

  test("legacy direct connection with only url and no graphDbUrl", () => {
    const parsed = parseConnectionFile(JSON.parse(legacyUrlDirect));

    expect(parsed).not.toBeNull();
    const connection = parsed?.connection as Record<string, unknown>;
    expect(connection.url).toBe("https://neptune.example.com:8182");
    expect(connection.graphDbUrl).toBeUndefined();
    expect(connection.proxyConnection).toBe(false);
    expect(connection.queryEngine).toBe("sparql");
  });
});

describe("golden Exported Connection File export is stable", () => {
  test("saveConfigurationToFile writes the pinned shape for a fixed input", async () => {
    saveConfigurationToFile(fixedExportInput());

    const [blob] = saveAsMock.mock.calls[0];
    const text = await (blob as Blob).text();

    // A byte-for-byte compare against the captured bytes. The fixture is a
    // `.txt` so the formatter leaves it alone, letting this pin the writer's
    // exact serialization — values, field order, and whitespace.
    expect(text).toBe(exportGolden);
  });
});

/**
 * A fully specified, deterministic input for the export golden. Every field is
 * pinned so the serialized output is stable across runs.
 */
function fixedExportInput(): ConfigurationContextProps {
  return {
    id: "33333333-3333-4333-8333-333333333333" as ConfigurationId,
    displayLabel: "Golden Neptune",
    connection: {
      graphDbUrl: "https://neptune.example.com:8182",
      queryEngine: "gremlin",
      proxyConnection: true,
      awsAuthEnabled: true,
      awsRegion: "us-west-2",
      serviceType: "neptune-db",
    },
    schema: {
      vertices: [
        {
          type: createVertexType("airport"),
          displayLabel: "Airport",
          attributes: [{ name: "code", dataType: "String" }],
        },
      ],
      edges: [
        {
          type: createEdgeType("route"),
          attributes: [{ name: "dist", dataType: "Int" }],
        },
      ],
      prefixes: [
        {
          prefix: "rdf" as RdfPrefix,
          uri: "http://www.w3.org/1999/02/22-rdf-syntax-ns#" as IriNamespace,
        },
      ],
      lastUpdate: new Date("2024-01-01T12:30:00.000Z"),
    },
    totalVertices: 1,
    vertexTypes: [createVertexType("airport")],
    totalEdges: 1,
    edgeTypes: [createEdgeType("route")],
  };
}
