export type Coordinates = {
  x: number;
  y: number;
};

export type BoundingBox = Coordinates & {
  width: number;
  height: number;
};

export type AutoBoundingBox = Coordinates & {
  width: number | "auto";
  height: number | "auto";
};
