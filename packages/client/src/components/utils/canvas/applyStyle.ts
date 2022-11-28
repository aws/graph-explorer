import getLineDash from "./getLineDash";

export type ApplyStyleOptions = {
  borderColor?: string;
  borderWidth?: number;
  backgroundColor?: string;
  borderShape?: "solid" | "dashed" | "dotted";
};

const applyStyle = (
  context: CanvasRenderingContext2D,
  options: ApplyStyleOptions = {}
) => {
  const {
    backgroundColor = "",
    borderColor = "",
    borderWidth = 0,
    borderShape = "solid",
  } = options;

  if (backgroundColor) {
    context.fillStyle = backgroundColor;
    context.fill();
  }

  if (borderWidth) {
    context.strokeStyle = borderColor;
    context.lineWidth = borderWidth;
    context.setLineDash(getLineDash(borderShape));
    context.stroke();
    context.setLineDash([]);
  }
};

export default applyStyle;
