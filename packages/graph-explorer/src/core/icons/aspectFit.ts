/**
 * Scales a width/height pair to fit a `base`-sized box, preserving aspect
 * ratio: the longer axis becomes exactly `base`, the shorter one shrinks
 * proportionally. Returns raw numbers — each caller formats its own unit
 * (an absolute pixel size, a cytoscape percentage, ...).
 */
export function fitAspectRatio(
  width: number,
  height: number,
  base: number,
): [width: number, height: number] {
  const aspectRatio = width / height;
  return aspectRatio >= 1
    ? [base, base / aspectRatio]
    : [base * aspectRatio, base];
}
