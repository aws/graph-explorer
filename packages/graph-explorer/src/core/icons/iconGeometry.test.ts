import { describe, expect, it } from "vitest";

import { encodeSvg, ICON_BOX, ICON_RATIO } from "./iconGeometry";

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

  it("percent-encodes svg markup as a data uri", () => {
    expect(encodeSvg("<svg>&</svg>")).toBe(
      "data:image/svg+xml;utf8," + encodeURIComponent("<svg>&</svg>"),
    );
  });
});
