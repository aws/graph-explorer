const getLineDash = (
  shape: "solid" | "dashed" | "dotted" = "solid"
): number[] => {
  if (shape === "dotted") {
    return [1, 2];
  }

  if (shape === "dashed") {
    return [5, 5];
  }

  return [];
};

export default getLineDash;
