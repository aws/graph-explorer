import {
  appDefaultEdgeStyle,
  appDefaultVertexStyle,
  createEdgeType,
  createVertexType,
  type EdgeStyle,
  type VertexStyle,
} from "@/core";
import { identityTransform, type TextTransformer } from "@/hooks";
import { LABELS } from "@/utils";

import { edgePreviewLabel, vertexPreviewLabel } from "./previewLabels";

/** Stands in for the SPARQL prefix transform: strips a namespace prefix. */
const prefixing: TextTransformer = text => text.replace("http://x/", "x:");

function edgeStyle(overrides?: Partial<EdgeStyle>): EdgeStyle {
  return {
    ...appDefaultEdgeStyle,
    type: createEdgeType("route"),
    ...overrides,
  };
}

function vertexStyle(overrides?: Partial<VertexStyle>): VertexStyle {
  return {
    ...appDefaultVertexStyle,
    type: createVertexType("Airport"),
    ...overrides,
  };
}

describe("edgePreviewLabel", () => {
  it("resolves the reserved types attribute to the type name", () => {
    expect(
      edgePreviewLabel(
        edgeStyle({ displayNameAttribute: "types" }),
        identityTransform,
      ),
    ).toBe("route");
  });

  it("resolves the reserved types attribute to the display type override", () => {
    expect(
      edgePreviewLabel(
        edgeStyle({ displayNameAttribute: "types", displayLabel: "Flight" }),
        identityTransform,
      ),
    ).toBe("Flight");
  });

  it("renders the id as a placeholder", () => {
    expect(
      edgePreviewLabel(
        edgeStyle({ displayNameAttribute: "~id" }),
        identityTransform,
      ),
    ).toBe("<id>");
  });

  it("names a data attribute as a placeholder", () => {
    expect(
      edgePreviewLabel(
        edgeStyle({ displayNameAttribute: "dist" }),
        identityTransform,
      ),
    ).toBe("<dist>");
  });

  it("transforms an attribute-name placeholder and the type", () => {
    expect(
      edgePreviewLabel(
        edgeStyle({
          type: createEdgeType("http://x/route"),
          displayNameAttribute: "http://x/dist",
        }),
        prefixing,
      ),
    ).toBe("<x:dist>");
  });
});

describe("vertexPreviewLabel", () => {
  it("uses the type name for both lines when the name derives from the id", () => {
    expect(
      vertexPreviewLabel(
        vertexStyle({ displayNameAttribute: "~id" }),
        identityTransform,
      ),
    ).toStrictEqual({ type: "Airport", name: "<id>" });
  });

  it("uses the display type override for the type line", () => {
    expect(
      vertexPreviewLabel(
        vertexStyle({ displayNameAttribute: "code", displayLabel: "Airfield" }),
        identityTransform,
      ),
    ).toStrictEqual({ type: "Airfield", name: "<code>" });
  });

  it("resolves the reserved types attribute to the type name", () => {
    expect(
      vertexPreviewLabel(
        vertexStyle({ displayNameAttribute: "types" }),
        identityTransform,
      ),
    ).toStrictEqual({ type: "Airport", name: "Airport" });
  });

  it("prefixes the type and attribute placeholder via the transform", () => {
    expect(
      vertexPreviewLabel(
        vertexStyle({
          type: createVertexType("http://x/Airport"),
          displayNameAttribute: "http://x/code",
        }),
        prefixing,
      ),
    ).toStrictEqual({ type: "x:Airport", name: "<x:code>" });
  });

  it("falls back to the missing-type label for an empty display label and type", () => {
    expect(
      vertexPreviewLabel(
        vertexStyle({
          type: createVertexType(""),
          displayLabel: "",
          displayNameAttribute: "~id",
        }),
        identityTransform,
      ),
    ).toStrictEqual({ type: LABELS.MISSING_TYPE, name: "<id>" });
  });
});
