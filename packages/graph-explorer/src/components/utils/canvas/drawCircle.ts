import applyStyle, { type ApplyStyleOptions } from "./applyStyle";
import type { Coordinates } from "./types";

export type DrawCircleOptions = ApplyStyleOptions & {
  radius?: number;
};

const drawCircle = (
  context: CanvasRenderingContext2D,
  coordinates: Coordinates,
  options: DrawCircleOptions = {}
) => {
  context.save();
  const { x, y } = coordinates;
  const { radius = 0, ...style } = options;

  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2, true);
  context.closePath();

  applyStyle(context, style);

  context.restore();
};

export default drawCircle;
