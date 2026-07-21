// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";

import { appDefaultEdgeStyle, createEdgeType, type EdgeStyle } from "@/core";

import { EdgePreview } from "./EdgePreview";

function edgeStyle(overrides?: Partial<EdgeStyle>): EdgeStyle {
  return {
    ...appDefaultEdgeStyle,
    type: createEdgeType("KNOWS"),
    ...overrides,
  };
}

describe("EdgePreview", () => {
  it("renders the provided label rather than deriving one from the edge type", () => {
    render(
      <EdgePreview
        edgeStyle={edgeStyle({ type: createEdgeType("http://x/knows") })}
        label="skos:broadMatch"
      />,
    );

    expect(screen.getByText("skos:broadMatch")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "skos:broadMatch edge preview" }),
    ).toBeInTheDocument();
  });
});
