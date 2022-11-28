import { BoundingBox } from "./types";

export type AdjustAnchorOptions = {
  anchor?: "left" | "center" | "right";
};

const adjustAnchor = (
  boundingBox: BoundingBox,
  options: AdjustAnchorOptions = {}
): BoundingBox => {
  const { x, width } = boundingBox;
  const { anchor = "left" } = options;

  let actualX = x;

  if (anchor === "center") {
    actualX = x - width / 2;
  }

  if (anchor === "right") {
    actualX = x - width;
  }

  return {
    ...boundingBox,
    x: actualX,
  };
};

export default adjustAnchor;
