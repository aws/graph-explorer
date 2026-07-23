// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";

import { appDefaultEdgeStyle, createEdgeType, type EdgeStyle } from "@/core";

import { EdgePreview } from "./EdgePreview";

function edgeStyle(overrides?: Partial<EdgeStyle>): EdgeStyle {
  return {
    ...appDefaultEdgeStyle,
    type: createEdgeType("route"),
    ...overrides,
  };
}

describe("EdgePreview", () => {
  it("labels the edge with its resolved type by default", () => {
    render(<EdgePreview edgeStyle={edgeStyle({ displayLabel: "Flight" })} />);

    expect(screen.getByText("Flight")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Flight edge preview" }),
    ).toBeInTheDocument();
  });

  it("labels a data-attribute name as a placeholder", () => {
    render(
      <EdgePreview edgeStyle={edgeStyle({ displayNameAttribute: "dist" })} />,
    );

    expect(screen.getByText("<dist>")).toBeInTheDocument();
  });

  it("leaves the type untransformed by default", () => {
    render(
      <EdgePreview
        edgeStyle={edgeStyle({ type: createEdgeType("http://x/route") })}
      />,
    );

    expect(screen.getByText("http://x/route")).toBeInTheDocument();
  });

  it("applies a provided transform to the label", () => {
    render(
      <EdgePreview
        edgeStyle={edgeStyle({ type: createEdgeType("http://x/route") })}
        transform={text => text.replace("http://x/", "x:")}
      />,
    );

    expect(screen.getByText("x:route")).toBeInTheDocument();
  });
});
