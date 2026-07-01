import { describe, expect, test } from "vitest";

import { createVertexType, createEdgeType } from "@/core/entities";
import { FileEnvelopeError } from "@/core/fileEnvelope";

import {
  parseStylingPayload,
  parseStylingPayloadForVersion,
  StylingParseError,
} from "./stylingParser";

/** Parses, asserting failure, and returns the thrown issues for inspection. */
function parseExpectingIssues(rawData: unknown) {
  try {
    parseStylingPayload(rawData);
  } catch (error) {
    if (error instanceof StylingParseError) {
      return error.issues;
    }
    throw error;
  }
  throw new Error("Expected parseStylingPayload to throw");
}

describe("style enum validation", () => {
  const SHAPES = [
    "rectangle",
    "roundrectangle",
    "ellipse",
    "triangle",
    "pentagon",
    "hexagon",
    "heptagon",
    "octagon",
    "star",
    "barrel",
    "diamond",
    "vee",
    "rhomboid",
    "tag",
    "round-rectangle",
    "round-triangle",
    "round-diamond",
    "round-pentagon",
    "round-hexagon",
    "round-heptagon",
    "round-octagon",
    "round-tag",
    "cut-rectangle",
    "concave-hexagon",
  ];
  const LINE_STYLES = ["solid", "dashed", "dotted"];
  const ARROW_STYLES = [
    "triangle",
    "triangle-tee",
    "circle-triangle",
    "triangle-cross",
    "triangle-backcurve",
    "tee",
    "vee",
    "square",
    "circle",
    "diamond",
    "none",
  ];

  test.each(SHAPES)("accepts shape %s", shape => {
    const result = parseStylingPayload({
      vertices: { A: { shape } },
      edges: {},
    });
    expect(result.vertexStyles.get(createVertexType("A"))!.shape).toBe(shape);
  });

  test("rejects an unknown shape, listing the valid options", () => {
    const issues = parseExpectingIssues({
      vertices: { A: { shape: "blob" } },
      edges: {},
    });
    expect(issues[0]).toMatchObject({ scope: "entry", field: "shape" });
    // Zod's default enum message enumerates the accepted values, which is more
    // useful to the user than a generic "not a valid option".
    expect(issues[0].message).toContain("ellipse");
  });

  test.each(LINE_STYLES)("accepts border line style %s", borderStyle => {
    const result = parseStylingPayload({
      vertices: { A: { borderStyle } },
      edges: {},
    });
    expect(result.vertexStyles.get(createVertexType("A"))!.borderStyle).toBe(
      borderStyle,
    );
  });

  test.each(ARROW_STYLES)("accepts arrow style %s", sourceArrowStyle => {
    const result = parseStylingPayload({
      vertices: {},
      edges: { A: { sourceArrowStyle } },
    });
    expect(result.edgeStyles.get(createEdgeType("A"))!.sourceArrowStyle).toBe(
      sourceArrowStyle,
    );
  });

  test("rejects an unknown arrow style", () => {
    const issues = parseExpectingIssues({
      vertices: {},
      edges: { A: { sourceArrowStyle: "swoosh" } },
    });
    expect(issues[0]).toMatchObject({
      scope: "entry",
      field: "sourceArrowStyle",
    });
  });
});

describe("parseStylingPayload", () => {
  test("throws a general issue for non-object input", () => {
    for (const input of [null, "string", 42, undefined]) {
      const issues = parseExpectingIssues(input);
      expect(issues[0].scope).toBe("general");
    }
  });

  test("throws when vertices/edges keys are missing", () => {
    expect(parseExpectingIssues({})[0].scope).toBe("general");
    expect(parseExpectingIssues({ vertices: {} })[0].scope).toBe("general");
    expect(parseExpectingIssues({ edges: {} })[0].scope).toBe("general");
  });

  test("throws a general issue when vertices is not an object", () => {
    const issues = parseExpectingIssues({ vertices: [], edges: {} });
    expect(issues[0]).toMatchObject({ scope: "general", location: "vertices" });
  });

  test("throws a general issue when edges is not an object", () => {
    const issues = parseExpectingIssues({ vertices: {}, edges: [] });
    expect(issues[0]).toMatchObject({ scope: "general", location: "edges" });
  });

  test("treats a non-object entry as a malformed entry issue", () => {
    const issues = parseExpectingIssues({
      vertices: { A: 42 },
      edges: {},
    });
    expect(issues[0]).toStrictEqual({
      scope: "entry",
      entityType: "vertex",
      typeName: "A",
      field: "(entry)",
      value: 42,
      // Zod's default type message names both the expected and received types.
      message: expect.stringContaining("received number"),
    });
  });

  test("parses empty vertices and edges", () => {
    const result = parseStylingPayload({ vertices: {}, edges: {} });
    expect(result).toStrictEqual({
      vertexStyles: new Map(),
      edgeStyles: new Map(),
    });
  });

  test("parses valid vertex entry with all fields", () => {
    const result = parseStylingPayload({
      vertices: {
        Person: {
          color: "#ff0000",
          displayLabel: "Human",
          icon: "lucide:user",
          iconImageType: "image/svg+xml",
          displayNameAttribute: "name",
          longDisplayNameAttribute: "fullName",
          shape: "ellipse",
          backgroundOpacity: 0.5,
          borderWidth: 2,
          borderColor: "#000000",
          borderStyle: "dashed",
        },
      },
      edges: {},
    });

    expect(result.vertexStyles.size).toBe(1);
    const personStyle = result.vertexStyles.get(createVertexType("Person"));
    expect(personStyle).toStrictEqual({
      type: createVertexType("Person"),
      color: "#ff0000",
      displayLabel: "Human",
      iconUrl: "lucide:user",
      iconImageType: "image/svg+xml",
      displayNameAttribute: "name",
      longDisplayNameAttribute: "fullName",
      shape: "ellipse",
      backgroundOpacity: 0.5,
      borderWidth: 2,
      borderColor: "#000000",
      borderStyle: "dashed",
    });
  });

  test("renames icon field to iconUrl at the storage-model seam", () => {
    const result = parseStylingPayload({
      vertices: { Airport: { icon: "data:image/png;base64,iVBOR" } },
      edges: {},
    });

    const style = result.vertexStyles.get(createVertexType("Airport"));
    expect(style!.iconUrl).toBe("data:image/png;base64,iVBOR");
    expect("icon" in style!).toBe(false);
  });

  test("ignores iconUrl as it is not a file field, preventing allowlist bypass", () => {
    // The file format uses `icon`; `iconUrl` is the internal storage name. A
    // file supplying `iconUrl` directly (e.g. a remote URL to dodge the icon
    // allowlist) is stripped silently and never reaches storage.
    const result = parseStylingPayload({
      vertices: { Airport: { iconUrl: "http://evil.example/x.svg" } },
      edges: {},
    });

    expect(result.vertexStyles.has(createVertexType("Airport"))).toBe(false);
  });

  test("parses valid edge entry with all fields", () => {
    const result = parseStylingPayload({
      vertices: {},
      edges: {
        knows: {
          displayLabel: "Knows",
          displayNameAttribute: "since",
          labelColor: "#333333",
          labelBackgroundOpacity: 0.8,
          labelBorderColor: "#444444",
          labelBorderStyle: "solid",
          labelBorderWidth: 1,
          lineColor: "#555555",
          lineThickness: 3,
          lineStyle: "dotted",
          sourceArrowStyle: "none",
          targetArrowStyle: "vee",
        },
      },
    });

    expect(result.edgeStyles.size).toBe(1);
    const knowsStyle = result.edgeStyles.get(createEdgeType("knows"));
    expect(knowsStyle).toStrictEqual({
      type: createEdgeType("knows"),
      displayLabel: "Knows",
      displayNameAttribute: "since",
      labelColor: "#333333",
      labelBackgroundOpacity: 0.8,
      labelBorderColor: "#444444",
      labelBorderStyle: "solid",
      labelBorderWidth: 1,
      lineColor: "#555555",
      lineThickness: 3,
      lineStyle: "dotted",
      sourceArrowStyle: "none",
      targetArrowStyle: "vee",
    });
  });

  test("rejects the whole file when any known field is invalid", () => {
    // Atomic validation: one bad field rejects the entire import, reported as
    // an entry issue. Nothing is persisted.
    const issues = parseExpectingIssues({
      vertices: {
        Airport: {
          color: "#ff0000",
          shape: "invalid-shape",
          backgroundOpacity: "not-a-number",
        },
      },
      edges: {},
    });

    expect(issues).toContainEqual({
      scope: "entry",
      entityType: "vertex",
      typeName: "Airport",
      field: expect.any(String),
      value: expect.anything(),
      message: expect.any(String),
    });
  });

  test("ignores unknown fields without reporting them", () => {
    const result = parseStylingPayload({
      vertices: {
        Person: { colour: "#ff0000", colr: "blue", color: "#00ff00" },
      },
      edges: {},
    });

    // Known `color` survives; the misspelled `colour`/`colr` are stripped.
    expect(result.vertexStyles.get(createVertexType("Person"))).toStrictEqual({
      type: createVertexType("Person"),
      color: "#00ff00",
    });
  });

  test("imports a same-version file from a newer build, ignoring its new fields", () => {
    // Forward compat: additive changes ship as new optional fields without
    // bumping the version, so an older build sees the same version with extra
    // keys it does not know. It keeps what it recognizes and ignores the rest.
    const result = parseStylingPayload({
      vertices: {
        Person: { color: "#abc", glow: true, animationMs: 300 },
      },
      edges: {},
    });

    expect(result.vertexStyles.get(createVertexType("Person"))).toStrictEqual({
      type: createVertexType("Person"),
      color: "#abc",
    });
  });

  test("drops entries with no recognized fields", () => {
    const result = parseStylingPayload({
      vertices: {
        Ghost: { bogus: "value" },
      },
      edges: {},
    });

    expect(result.vertexStyles.has(createVertexType("Ghost"))).toBe(false);
  });

  describe("icon allowlist", () => {
    test("accepts lucide: prefix with valid name", () => {
      const result = parseStylingPayload({
        vertices: { A: { icon: "lucide:arrow-right" } },
        edges: {},
      });
      expect(result.vertexStyles.get(createVertexType("A"))!.iconUrl).toBe(
        "lucide:arrow-right",
      );
    });

    test("accepts data:image/ URIs", () => {
      const dataUri = "data:image/svg+xml;base64,PHN2Zz4=";
      const result = parseStylingPayload({
        vertices: { A: { icon: dataUri } },
        edges: {},
      });
      expect(result.vertexStyles.get(createVertexType("A"))!.iconUrl).toBe(
        dataUri,
      );
    });

    test("rejects http:// URLs (no outbound requests from imports)", () => {
      const issues = parseExpectingIssues({
        vertices: { A: { icon: "http://example.com/icon.png" } },
        edges: {},
      });
      expect(issues[0]).toMatchObject({ scope: "entry", field: "icon" });
    });

    test("rejects https:// URLs (no outbound requests from imports)", () => {
      const issues = parseExpectingIssues({
        vertices: { A: { icon: "https://cdn.example.com/icon.svg" } },
        edges: {},
      });
      expect(issues[0]).toMatchObject({ scope: "entry", field: "icon" });
    });

    test("rejects bare icon names", () => {
      const issues = parseExpectingIssues({
        vertices: { A: { icon: "user" } },
        edges: {},
      });
      expect(issues[0]).toStrictEqual({
        scope: "entry",
        entityType: "vertex",
        typeName: "A",
        field: "icon",
        value: "user",
        message: expect.stringContaining("allowlist"),
      });
    });

    test("reports the rejected value", () => {
      const issues = parseExpectingIssues({
        vertices: { A: { icon: "https://evil.example/x.svg" } },
        edges: {},
      });
      expect(issues[0].value).toBe("https://evil.example/x.svg");
    });

    test("rejects javascript: protocol", () => {
      const issues = parseExpectingIssues({
        vertices: { A: { icon: "javascript:alert(1)" } },
        edges: {},
      });
      expect(issues[0]).toMatchObject({ scope: "entry", field: "icon" });
    });

    test("rejects lucide: with invalid characters", () => {
      const issues = parseExpectingIssues({
        vertices: { A: { icon: "lucide:<script>" } },
        edges: {},
      });
      expect(issues[0]).toMatchObject({ scope: "entry", field: "icon" });
    });
  });

  describe("iconImageType", () => {
    // Mirrors storage's loose `string`: the upload seam fills it from the
    // browser's `file.type`, which can be any `image/*` the OS reports, so any
    // string is preserved rather than rejected against a fixed list. It is not a
    // security boundary — see the styling-file-format ADR.
    test.each([
      "image/svg+xml",
      "image/png",
      "image/bmp",
      "image/avif",
      "image/x-icon",
    ])("preserves the stored MIME type %s", mime => {
      const result = parseStylingPayload({
        vertices: { A: { iconImageType: mime } },
        edges: {},
      });
      expect(
        result.vertexStyles.get(createVertexType("A"))!.iconImageType,
      ).toBe(mime);
    });
  });

  test("reports every invalid entry across types in one rejection", () => {
    const issues = parseExpectingIssues({
      vertices: {
        Person: { color: "#aaa", shape: "star" },
        Airport: { color: 123, shape: "ellipse" },
      },
      edges: {
        route: { lineColor: "#bbb", lineStyle: "nope" },
      },
    });

    expect(issues).toStrictEqual([
      {
        scope: "entry",
        entityType: "vertex",
        typeName: "Airport",
        field: "color",
        value: 123,
        message: expect.any(String),
      },
      {
        scope: "entry",
        entityType: "edge",
        typeName: "route",
        field: "lineStyle",
        value: "nope",
        message: expect.any(String),
      },
    ]);
  });

  describe("prototype pollution resistance", () => {
    test("__proto__ as a type name is safely dropped by zod record parsing", () => {
      // Zod's record parser creates null-prototype objects, stripping __proto__
      // keys. This is the desired security behavior: even if a malicious file
      // contains __proto__ as a type name, it never reaches our entry parser.
      const input = JSON.parse(
        '{"vertices":{"__proto__":{"color":"#fff"}},"edges":{}}',
      );
      const result = parseStylingPayload(input);

      expect(result.vertexStyles.has(createVertexType("__proto__"))).toBe(
        false,
      );
      // Confirm no actual prototype pollution
      const plain = {} as Record<string, unknown>;
      expect(plain["color"]).toBeUndefined();
    });

    test("__proto__ as a field name is safely dropped by zod record parsing", () => {
      // Same mechanism: zod strips __proto__ from the inner record too.
      // The valid color field still survives.
      const input = JSON.parse(
        '{"vertices":{"A":{"__proto__":"malicious","color":"#000"}},"edges":{}}',
      );
      const result = parseStylingPayload(input);

      expect(result.vertexStyles.get(createVertexType("A"))!.color).toBe(
        "#000",
      );
    });

    test("constructor as a field name is ignored as an unknown field", () => {
      const result = parseStylingPayload({
        vertices: {},
        edges: { A: { constructor: "malicious" } },
      });

      // `constructor` is not a known field, so it is stripped; the entry has no
      // recognized fields and is dropped without rejecting the file.
      expect(result.edgeStyles.has(createEdgeType("A"))).toBe(false);
    });
  });
});

describe("parseStylingPayloadForVersion", () => {
  test("dispatches generation 1 to the current parser", () => {
    const result = parseStylingPayloadForVersion(1, {
      vertices: { A: { color: "#000" } },
      edges: {},
    });

    expect(result.vertexStyles.get(createVertexType("A"))!.color).toBe("#000");
  });

  test("throws loudly for a generation with no parser", () => {
    expect(() =>
      parseStylingPayloadForVersion(2, { vertices: {}, edges: {} }),
    ).toThrow(FileEnvelopeError);
  });
});
