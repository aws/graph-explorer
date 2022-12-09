import { BoundingBox } from "./types";

export type AddPaddingOptions = {
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
};

const addPadding = (
  boundingBox: BoundingBox,
  options: AddPaddingOptions = {}
): BoundingBox => {
  const { x, y, width, height } = boundingBox;
  const {
    paddingTop = 0,
    paddingRight = 0,
    paddingBottom = 0,
    paddingLeft = 0,
  } = options;
  return {
    x: x - paddingLeft,
    y,
    width: width + paddingLeft + paddingRight,
    height: height + paddingTop + paddingBottom,
  };
};

export default addPadding;
