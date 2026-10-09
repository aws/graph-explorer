import { describe, expect, it } from "vitest";

import { browserslistBuildTarget, toBuildTarget } from "./buildTarget";

describe("toBuildTarget", () => {
  it("keeps the oldest version of each browser", () => {
    expect(
      toBuildTarget(["firefox 125", "firefox 124", "chrome 124", "chrome 123"]),
    ).toStrictEqual(["firefox124", "chrome123"]);
  });

  it("compares minor versions numerically", () => {
    expect(toBuildTarget(["safari 17.10", "safari 17.4"])).toStrictEqual([
      "safari17.4",
    ]);
  });

  it("uses the lower bound of a version range", () => {
    expect(toBuildTarget(["ios_saf 17.6-17.7", "ios_saf 18.0"])).toStrictEqual([
      "ios17.6",
    ]);
  });

  it("renames ios_saf to ios", () => {
    expect(toBuildTarget(["ios_saf 17.4"])).toStrictEqual(["ios17.4"]);
  });

  it("throws for a browser Vite has no target for", () => {
    expect(() => toBuildTarget(["op_mini all"])).toThrow(
      new Error('No Vite build target for browser "op_mini"'),
    );
  });
});

describe("browserslistBuildTarget", () => {
  it("builds for the browsers in .browserslistrc", () => {
    expect(browserslistBuildTarget()).toStrictEqual([
      "chrome123",
      "edge123",
      "firefox124",
      "ios17.4",
      "safari17.4",
    ]);
  });
});
