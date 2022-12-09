import applyStyle, { ApplyStyleOptions } from "./applyStyle";
import { BoundingBox } from "./types";

export type DrawRectangleOptions = ApplyStyleOptions & {
  borderRadius?: number;
};

const drawRectangle = (
  context: CanvasRenderingContext2D,
  boundingBox: BoundingBox,
  options: DrawRectangleOptions = {}
) => {
  context.save();
  const { x, y, width: w, height: h } = boundingBox;
  const { borderRadius = 0, ...style } = options;

  let actualRadius = borderRadius;
  if (w < 2 * borderRadius) {
    actualRadius = w / 2;
  }
  if (h < 2 * borderRadius) {
    actualRadius = h / 2;
  }

  context.beginPath();
  context.moveTo(x + actualRadius, y);
  context.arcTo(x + w, y, x + w, y + h, actualRadius);
  context.arcTo(x + w, y + h, x, y + h, actualRadius);
  context.arcTo(x, y + h, x, y, actualRadius);
  context.arcTo(x, y, x + w, y, actualRadius);
  context.closePath();

  applyStyle(context, style);

  context.restore();
};

export default drawRectangle;
