import { describe, expect, it } from "vitest";

import { ICON_BOX, ICON_RATIO, insetBox } from "./iconGeometry";

describe("iconGeometry", () => {
  // ICON_BOX and ICON_RATIO are the single source of truth for how much of the
  // icon's square box the artwork occupies. The canvas (useBackgroundImageMap)
  // and the style preview (VertexSymbol) both import them rather than
  // declaring their own copy — this pins the values themselves, so a future
  // edit to one file cannot silently drift from the other without also
  // changing this test.
  it("insets the icon to 60% of a box that is 4x a canvas node (24 units)", () => {
    expect(ICON_RATIO).toBe(0.6);
    expect(ICON_BOX).toBe(96);
    expect(ICON_BOX / 24).toBe(4);
  });

  // Both consumers computed this inline before it moved here; pinning the
  // formula itself is what keeps a future edit from drifting between them.
  it("centers a box at the given ratio, equally offset on both axes", () => {
    expect(insetBox(100, 0.6)).toStrictEqual({ size: 60, offset: 20 });
    // 96 * 0.6 is not exact in floating point; assert the real computed
    // value rather than the mathematically rounded one.
    const { size, offset } = insetBox(ICON_BOX, ICON_RATIO);
    expect(size).toBeCloseTo(57.6);
    expect(offset).toBeCloseTo(19.2);
  });
});
