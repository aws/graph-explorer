// @vitest-environment happy-dom
import { render } from "@testing-library/react";

import { ARROW_STYLES } from "@/core";

import { ArrowStyleIcon, type ArrowStyleIconProps } from "./ArrowStyleIcon";

function renderIcon(props: ArrowStyleIconProps) {
  const { container } = render(<ArrowStyleIcon {...props} />);
  const svg = container.querySelector("svg");
  if (!svg) {
    throw new Error("expected an svg element");
  }
  return svg;
}

describe("ArrowStyleIcon", () => {
  it.each(ARROW_STYLES)("renders %s with a shared viewBox", arrowStyle => {
    const svg = renderIcon({ arrowStyle });
    expect(svg.getAttribute("viewBox")).toBe(
      renderIcon({ arrowStyle: "triangle" }).getAttribute("viewBox"),
    );
  });

  it("always draws the edge shaft", () => {
    for (const arrowStyle of ARROW_STYLES) {
      const svg = renderIcon({ arrowStyle });
      expect(svg.querySelector("rect")).not.toBeNull();
    }
  });

  it("draws a head for every style except none", () => {
    for (const arrowStyle of ARROW_STYLES) {
      const svg = renderIcon({ arrowStyle });
      const hasHead = svg.querySelector("polygon, path, circle") !== null;
      expect(hasHead).toBe(arrowStyle !== "none");
    }
  });

  it("draws two head primitives for compound styles", () => {
    for (const arrowStyle of [
      "triangle-tee",
      "triangle-cross",
      "circle-triangle",
    ] as const) {
      const svg = renderIcon({ arrowStyle });
      expect(svg.querySelectorAll("polygon, path, circle")).toHaveLength(2);
    }
  });

  it("starts every shaft at the same left edge", () => {
    const lefts = ARROW_STYLES.map(arrowStyle =>
      renderIcon({ arrowStyle }).querySelector("rect")!.getAttribute("x"),
    );
    expect(new Set(lefts).size).toBe(1);
  });

  it("forwards svg attributes such as className", () => {
    const svg = renderIcon({ arrowStyle: "triangle", className: "rotate-180" });
    expect(svg.getAttribute("class")).toBe("rotate-180");
  });

  it("does not shift a tip-at-origin head like triangle", () => {
    // triangle's tip sits at the frame origin (bbox.maxX = 0), so its head
    // needs no shift to reach the shared right anchor.
    const svg = renderIcon({ arrowStyle: "triangle" });
    expect(svg.querySelector("g")!.getAttribute("transform")).toBe(
      "translate(0 0)",
    );
  });

  it("shifts a head that pokes past the origin like circle onto the anchor", () => {
    // circle straddles the origin (bbox.maxX > 0), so it is translated left by
    // that overshoot to land its trailing edge on the shared right anchor.
    const svg = renderIcon({ arrowStyle: "circle" });
    const transform = svg.querySelector("g")!.getAttribute("transform")!;
    const shift = Number(transform.match(/translate\(([-\d.]+) 0\)/)![1]);
    expect(shift).toBeLessThan(0);
  });
});
