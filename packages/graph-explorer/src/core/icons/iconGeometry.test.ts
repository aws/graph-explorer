import { describe, expect, it } from "vitest";

import { ICON_BOX, ICON_INSET } from "./iconGeometry";

describe("iconGeometry", () => {
  it("centers the icon within the box, equally offset on both axes", () => {
    expect(ICON_INSET.size).toBeCloseTo(57.6);
    expect(ICON_INSET.offset).toBeCloseTo(19.2);
    expect(ICON_INSET.offset * 2 + ICON_INSET.size).toBeCloseTo(ICON_BOX);
  });
});
