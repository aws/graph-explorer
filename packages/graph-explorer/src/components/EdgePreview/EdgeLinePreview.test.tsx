// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";

import {
  appDefaultEdgeStyle,
  ARROW_STYLES,
  createEdgeType,
  type EdgeStyle,
} from "@/core";

import {
  type EdgeLineOrientation,
  EdgeLinePreview,
  rotatedBbox,
} from "./EdgeLinePreview";

function edgeStyle(overrides?: Partial<EdgeStyle>): EdgeStyle {
  return {
    ...appDefaultEdgeStyle,
    type: createEdgeType("KNOWS"),
    ...overrides,
  };
}

const ORIENTATIONS: EdgeLineOrientation[] = ["horizontal", "vertical"];

describe("EdgeLinePreview", () => {
  // Every source/target arrow combination, in both orientations, must produce
  // finite geometry — a NaN/Infinity would surface as an invalid viewBox.
  it.each(ORIENTATIONS)("renders every arrow pair when %s", orientation => {
    for (const sourceArrowStyle of ARROW_STYLES) {
      for (const targetArrowStyle of ARROW_STYLES) {
        const { container } = render(
          <EdgeLinePreview
            edgeStyle={edgeStyle({ sourceArrowStyle, targetArrowStyle })}
            orientation={orientation}
          />,
        );
        for (const svg of container.querySelectorAll("svg")) {
          expect(svg.getAttribute("viewBox")).not.toMatch(/NaN|Infinity/);
        }
      }
    }
  });

  it.each(ORIENTATIONS)("renders the label overlay when %s", orientation => {
    render(
      <EdgeLinePreview
        edgeStyle={edgeStyle()}
        orientation={orientation}
        label="knows"
      />,
    );
    expect(screen.getByText("knows")).toBeInTheDocument();
  });
});

describe("rotatedBbox", () => {
  const box = { minX: 1, minY: 2, maxX: 5, maxY: 4 };

  it("is the identity at 0 degrees", () => {
    expect(rotatedBbox(box, 0)).toStrictEqual(box);
  });

  it("swaps and flips axes at 90 degrees", () => {
    // (x,y) -> (-y, x): x in [1,5], y in [2,4] -> X in [-4,-2], Y in [1,5]
    const rotated = rotatedBbox(box, 90);
    expect(rotated.minX).toBeCloseTo(-4);
    expect(rotated.maxX).toBeCloseTo(-2);
    expect(rotated.minY).toBeCloseTo(1);
    expect(rotated.maxY).toBeCloseTo(5);
  });

  it("negates both axes at 180 degrees", () => {
    const rotated = rotatedBbox(box, 180);
    expect(rotated.minX).toBeCloseTo(-5);
    expect(rotated.maxX).toBeCloseTo(-1);
    expect(rotated.minY).toBeCloseTo(-4);
    expect(rotated.maxY).toBeCloseTo(-2);
  });

  it("swaps and flips axes at -90 degrees", () => {
    // (x,y) -> (y, -x): x in [1,5], y in [2,4] -> X in [2,4], Y in [-5,-1]
    const rotated = rotatedBbox(box, -90);
    expect(rotated.minX).toBeCloseTo(2);
    expect(rotated.maxX).toBeCloseTo(4);
    expect(rotated.minY).toBeCloseTo(-5);
    expect(rotated.maxY).toBeCloseTo(-1);
  });
});
