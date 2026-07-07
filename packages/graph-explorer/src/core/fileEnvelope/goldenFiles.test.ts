// @vitest-environment happy-dom
import { describe, expect, test } from "vitest";

import { createEdgeType, createVertexType } from "@/core/entities";
import { parseStylingFile } from "@/core/styling";
import { parseExportedGraph } from "@/modules/GraphViewer/exportedGraph";

import graphExportDecimalString from "./__fixtures__/graph-export-v1-decimal-string.json?raw";
import stylingExportInteger from "./__fixtures__/styling-export-v1-integer.json?raw";

/**
 * GOLDEN FILES — REAL EXPORTED FORMATS
 *
 * Each fixture in `__fixtures__/` is a byte-for-byte file as a shipped build
 * wrote it, loaded here with `?raw` so the test imports the exact on-disk bytes
 * (not a re-serialized object). The version integer in `fileEnvelope.ts` means
 * nothing on its own; these are what actually prove a current build still
 * imports every generation we have ever written — including graph-export's
 * `"1.0"` decimal-string encoding, the wire form it still writes today.
 *
 * DO NOT edit a fixture to make a test pass. A fixture is a historical artifact;
 * if a current build can no longer read it, that is a backward-compatibility
 * break to fix in the parser (add a migration / version case), not in the file.
 * When a new generation ships, ADD a fixture — never mutate an existing one.
 */

function asFile(contents: string, name: string): File {
  return new File([contents], name, { type: "application/json" });
}

describe("golden styling-export files import on the current build", () => {
  test("styling-export-v1-integer.json", async () => {
    const parsed = await parseStylingFile(
      asFile(stylingExportInteger, "styling-export-v1-integer.json"),
    );

    expect(parsed.vertexStyles.get(createVertexType("airport"))).toStrictEqual({
      type: createVertexType("airport"),
      displayNameAttribute: "code",
      iconUrl: "lucide:anchor",
      iconImageType: "image/svg+xml",
      color: "#e66412",
    });
    expect(parsed.vertexStyles.get(createVertexType("country"))).toStrictEqual({
      type: createVertexType("country"),
      color: "#e612b8",
    });
    expect(parsed.edgeStyles.get(createEdgeType("route"))).toStrictEqual({
      type: createEdgeType("route"),
      lineThickness: 1,
      labelColor: "#eef4ff",
      labelBackgroundOpacity: 1,
      lineColor: "#0c4a6e",
    });
  });
});

describe("golden graph-export files import on the current build", () => {
  test("graph-export-v1-decimal-string.json", async () => {
    const parsed = await parseExportedGraph(
      asFile(graphExportDecimalString, "graph-export-v1-decimal-string.json"),
    );

    expect(parsed.connection).toStrictEqual({
      dbUrl: "https://example.cluster-abc.us-west-2.neptune.amazonaws.com:8182",
      queryEngine: "gremlin",
    });
    expect(parsed.vertices).toStrictEqual(new Set(["1", "2", 3]));
    expect(parsed.edges).toStrictEqual(new Set(["10", "11"]));
  });
});
