// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";

import { appDefaultNodeLabelStyle, type LabelVisualStyle } from "@/core";

import { LabelPreview } from "./LabelPreview";

function labelStyle(overrides?: Partial<LabelVisualStyle>): LabelVisualStyle {
  return { ...appDefaultNodeLabelStyle, ...overrides };
}

function renderLabel(style: LabelVisualStyle, scale = 2) {
  render(
    <LabelPreview labelStyle={style} scale={scale}>
      label
    </LabelPreview>,
  );
  return screen.getByText("label");
}

describe("LabelPreview", () => {
  describe("text color follows label darkness for contrast", () => {
    it("uses white text on a dark label color", () => {
      const el = renderLabel(labelStyle({ labelColor: "#1d2531" }));
      expect(el.style.color).toBe("#ffffff");
    });

    it("uses black text on a light label color", () => {
      const el = renderLabel(labelStyle({ labelColor: "#f0f0f0" }));
      expect(el.style.color).toBe("#000000");
    });
  });

  describe("border is applied only when width is positive", () => {
    it("omits border styling at width 0", () => {
      const el = renderLabel(labelStyle({ labelBorderWidth: 0 }));
      expect(el.style.borderWidth).toBe("");
      expect(el.style.borderStyle).toBe("");
      expect(el.style.borderColor).toBe("");
    });

    it("applies border styling at a positive width", () => {
      const el = renderLabel(
        labelStyle({
          labelBorderWidth: 1,
          labelBorderStyle: "dashed",
          labelBorderColor: "#ff0000",
        }),
        2,
      );
      // width scales by the render scale (1 * 2)
      expect(el.style.borderWidth).toBe("2px");
      expect(el.style.borderStyle).toBe("dashed");
      expect(el.style.borderColor).toBe("#ff0000");
    });
  });

  it("scales font size, padding, and radius by the render scale", () => {
    const el = renderLabel(labelStyle(), 2);
    // constants are 7 / 2 / 2 model units, multiplied by the scale
    expect(el.style.fontSize).toBe("14px");
    expect(el.style.padding).toBe("4px");
    expect(el.style.borderRadius).toBe("4px");
  });
});
