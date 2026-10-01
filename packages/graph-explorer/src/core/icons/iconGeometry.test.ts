import { describe, expect, it } from "vitest";

import { ICON_BOX, ICON_RATIO, insetBox } from "./iconGeometry";

describe("iconGeometry", () => {
  it("centers a box at the given ratio, equally offset on both axes", () => {
    expect(insetBox(100, 0.6)).toStrictEqual({ size: 60, offset: 20 });
    // 96 * 0.6 is not exact in floating point; assert the real computed
    // value rather than the mathematically rounded one.
    const { size, offset } = insetBox(ICON_BOX, ICON_RATIO);
    expect(size).toBeCloseTo(57.6);
    expect(offset).toBeCloseTo(19.2);
  });
});
