import { vi } from "vitest";

import type { AutoBoundingBox } from "./types";

import drawBoxWithAdornment from "./drawBoxWithAdornment";

/** A stub 2D context measuring text at a fixed width per character. */
function createFakeContext() {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    arcTo: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    setLineDash: vi.fn(),
    fillText: vi.fn(),
    measureText: (text: string) => ({ width: text.length * 6 }),
    font: "",
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
    textAlign: "",
    textBaseline: "",
  } as unknown as CanvasRenderingContext2D;
}

const boundingBox: AutoBoundingBox = {
  x: 0,
  y: 0,
  width: "auto",
  height: "auto",
};

describe("drawBoxWithAdornment", () => {
  it("draws the full text without truncation when no maxWidth is given", () => {
    const context = createFakeContext();
    const longText = "a-very-long-vertex-display-name-value";

    drawBoxWithAdornment(context, boundingBox, { text: longText });

    expect(context.fillText).toHaveBeenCalledWith(
      longText,
      expect.any(Number),
      expect.any(Number),
    );
  });

  it("truncates the text with an ellipsis once it exceeds maxWidth", () => {
    const context = createFakeContext();
    const longText = "a-very-long-vertex-display-name-value";

    drawBoxWithAdornment(context, boundingBox, {
      text: longText,
      maxWidth: 20,
    });

    expect(context.fillText).toHaveBeenCalledWith(
      expect.stringMatching(/\.\.\.$/),
      expect.any(Number),
      expect.any(Number),
    );
    expect(context.fillText).not.toHaveBeenCalledWith(
      longText,
      expect.any(Number),
      expect.any(Number),
    );
  });
});
