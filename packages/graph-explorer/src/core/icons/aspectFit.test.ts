import { describe, expect, it } from "vitest";

import { fitAspectRatio } from "./aspectFit";

describe("fitAspectRatio", () => {
  it("caps the wider axis at base and shrinks the shorter one proportionally", () => {
    expect(fitAspectRatio(400, 100, 24)).toEqual([24, 6]);
  });

  it("caps the taller axis at base and shrinks the shorter one proportionally", () => {
    expect(fitAspectRatio(100, 400, 24)).toEqual([6, 24]);
  });

  it("returns the base for both axes when already square", () => {
    expect(fitAspectRatio(100, 100, 24)).toEqual([24, 24]);
  });
});
