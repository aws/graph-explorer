import { describe, expect, test } from "vitest";

import { createVertexType, createEdgeType } from "@/core/entities";

import { parseStylingPayload } from "./stylingParser";

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
    expect(result.issues).toHaveLength(0);
  });

  test("rejects an unknown shape", () => {
    const result = parseStylingPayload({
      vertices: { A: { shape: "blob" } },
      edges: {},
    });
    expect(result.vertexStyles.has(createVertexType("A"))).toBe(false);
    expect(result.issues[0]).toMatchObject({ field: "shape" });
  });

  test.each(LINE_STYLES)("accepts border line style %s", borderStyle => {
    const result = parseStylingPayload({
      vertices: { A: { borderStyle } },
      edges: {},
    });
    expect(result.vertexStyles.get(createVertexType("A"))!.borderStyle).toBe(
      borderStyle,
    );
    expect(result.issues).toHaveLength(0);
  });

  test.each(ARROW_STYLES)("accepts arrow style %s", sourceArrowStyle => {
    const result = parseStylingPayload({
      vertices: {},
      edges: { A: { sourceArrowStyle } },
    });
    expect(result.edgeStyles.get(createEdgeType("A"))!.sourceArrowStyle).toBe(
      sourceArrowStyle,
    );
    expect(result.issues).toHaveLength(0);
  });

  test("rejects an unknown arrow style", () => {
    const result = parseStylingPayload({
      vertices: {},
      edges: { A: { sourceArrowStyle: "swoosh" } },
    });
    expect(result.edgeStyles.has(createEdgeType("A"))).toBe(false);
    expect(result.issues[0]).toMatchObject({ field: "sourceArrowStyle" });
  });
});

describe("parseStylingPayload", () => {
  test("throws for non-object input", () => {
    expect(() => parseStylingPayload(null)).toThrow();
    expect(() => parseStylingPayload("string")).toThrow();
    expect(() => parseStylingPayload(42)).toThrow();
    expect(() => parseStylingPayload(undefined)).toThrow();
  });

  test("throws when vertices/edges keys are missing", () => {
    expect(() => parseStylingPayload({})).toThrow();
    expect(() => parseStylingPayload({ vertices: {} })).toThrow();
    expect(() => parseStylingPayload({ edges: {} })).toThrow();
  });

  test("throws when vertices is not an object", () => {
    expect(() => parseStylingPayload({ vertices: [], edges: {} })).toThrow();
  });

  test("throws when edges is not an object", () => {
    expect(() => parseStylingPayload({ vertices: {}, edges: [] })).toThrow();
  });

  test("parses empty vertices and edges with no issues", () => {
    const result = parseStylingPayload({ vertices: {}, edges: {} });
    expect(result).toStrictEqual({
      vertexStyles: new Map(),
      edgeStyles: new Map(),
      issues: [],
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

    expect(result.issues).toStrictEqual([]);
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
    expect(result.issues).toStrictEqual([]);
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

    expect(result.issues).toStrictEqual([]);
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

  test("drops the whole entry when any known field is invalid", () => {
    // Whole-entry validation: one bad field rejects the entry rather than
    // leaving it half-styled. The good `color` is dropped along with it.
    const result = parseStylingPayload({
      vertices: {
        Airport: {
          color: "#ff0000",
          shape: "invalid-shape",
          backgroundOpacity: "not-a-number",
        },
      },
      edges: {},
    });

    expect(result.vertexStyles.has(createVertexType("Airport"))).toBe(false);
    expect(result.issues).toStrictEqual([
      {
        entityType: "vertex",
        typeName: "Airport",
        field: expect.any(String),
        message: expect.any(String),
      },
    ]);
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
    expect(result.issues).toStrictEqual([]);
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
    expect(result.issues).toStrictEqual([]);
  });

  test("drops entries with no recognized fields", () => {
    const result = parseStylingPayload({
      vertices: {
        Ghost: { bogus: "value" },
      },
      edges: {},
    });

    expect(result.vertexStyles.has(createVertexType("Ghost"))).toBe(false);
    expect(result.issues).toStrictEqual([]);
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
      expect(result.issues).toStrictEqual([]);
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
      const result = parseStylingPayload({
        vertices: { A: { icon: "http://example.com/icon.png" } },
        edges: {},
      });
      expect(result.vertexStyles.has(createVertexType("A"))).toBe(false);
      expect(result.issues[0].field).toBe("icon");
    });

    test("rejects https:// URLs (no outbound requests from imports)", () => {
      const result = parseStylingPayload({
        vertices: { A: { icon: "https://cdn.example.com/icon.svg" } },
        edges: {},
      });
      expect(result.vertexStyles.has(createVertexType("A"))).toBe(false);
      expect(result.issues[0].field).toBe("icon");
    });

    test("rejects bare icon names", () => {
      const result = parseStylingPayload({
        vertices: { A: { icon: "user" } },
        edges: {},
      });
      expect(result.vertexStyles.has(createVertexType("A"))).toBe(false);
      expect(result.issues[0]).toStrictEqual({
        entityType: "vertex",
        typeName: "A",
        field: "icon",
        message: expect.stringContaining("allowlist"),
      });
    });

    test("rejects javascript: protocol", () => {
      const result = parseStylingPayload({
        vertices: { A: { icon: "javascript:alert(1)" } },
        edges: {},
      });
      expect(result.vertexStyles.has(createVertexType("A"))).toBe(false);
      expect(result.issues[0].field).toBe("icon");
    });

    test("rejects lucide: with invalid characters", () => {
      const result = parseStylingPayload({
        vertices: { A: { icon: "lucide:<script>" } },
        edges: {},
      });
      expect(result.vertexStyles.has(createVertexType("A"))).toBe(false);
      expect(result.issues[0].field).toBe("icon");
    });
  });

  describe("iconImageType validation", () => {
    test("accepts known MIME types", () => {
      for (const mime of [
        "image/svg+xml",
        "image/png",
        "image/jpeg",
        "image/gif",
        "image/webp",
      ]) {
        const result = parseStylingPayload({
          vertices: { A: { iconImageType: mime } },
          edges: {},
        });
        expect(
          result.vertexStyles.get(createVertexType("A"))!.iconImageType,
        ).toBe(mime);
      }
    });

    test("drops unknown MIME types and reports issue", () => {
      const result = parseStylingPayload({
        vertices: { A: { iconImageType: "text/html" } },
        edges: {},
      });
      expect(result.vertexStyles.has(createVertexType("A"))).toBe(false);
      expect(result.issues[0]).toStrictEqual({
        entityType: "vertex",
        typeName: "A",
        field: "iconImageType",
        message: expect.any(String),
      });
    });
  });

  test("keeps valid entries and drops invalid ones across types", () => {
    const result = parseStylingPayload({
      vertices: {
        Person: { color: "#aaa", shape: "star" },
        Airport: { color: 123, shape: "ellipse" },
      },
      edges: {
        route: { lineColor: "#bbb", lineStyle: "nope" },
      },
    });

    // Valid entry kept in full.
    expect(result.vertexStyles.get(createVertexType("Person"))).toStrictEqual({
      type: createVertexType("Person"),
      color: "#aaa",
      shape: "star",
    });
    // Entries with any invalid field are dropped whole.
    expect(result.vertexStyles.has(createVertexType("Airport"))).toBe(false);
    expect(result.edgeStyles.has(createEdgeType("route"))).toBe(false);

    expect(result.issues).toStrictEqual([
      {
        entityType: "vertex",
        typeName: "Airport",
        field: expect.any(String),
        message: expect.any(String),
      },
      {
        entityType: "edge",
        typeName: "route",
        field: expect.any(String),
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
      expect(result.issues).toStrictEqual([]);
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
      // __proto__ never reaches our code — no issue reported for it
      expect(result.issues).toStrictEqual([]);
    });

    test("constructor as a field name is ignored as an unknown field", () => {
      const result = parseStylingPayload({
        vertices: {},
        edges: { A: { constructor: "malicious" } },
      });

      // `constructor` is not a known field, so it is stripped; the entry has no
      // recognized fields and is dropped without an issue.
      expect(result.edgeStyles.has(createEdgeType("A"))).toBe(false);
      expect(result.issues).toStrictEqual([]);
    });
  });
});
