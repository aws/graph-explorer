import { describe, expect, it } from "vite-plus/test";

import { toNumberFragment } from "./queryFragment";
import { UnrepresentableNumberError } from "./queryValueError";

describe("toNumberFragment", () => {
  // `%s` rather than `%j`, which renders NaN and the infinities as `null`.
  it.each([
    [0, "0"],
    [25, "25"],
    [-5, "-5"],
    [1.5, "1.5"],
    [-1.5, "-1.5"],
    [0.000001, "0.000001"],
    [Number.MAX_SAFE_INTEGER, "9007199254740991"],
    // Large enough to lose precision, but still written out in full.
    [1e20, "100000000000000000000"],
  ])("should emit %s as %s", (value, text) => {
    expect(toNumberFragment(value)).toBe(text);
  });

  it.each([NaN, Infinity, -Infinity, 1e21, -1e21, 1e-7, Number.MIN_VALUE])(
    "should reject %s, which has no plain-decimal form",
    value => {
      expect(() => toNumberFragment(value)).toThrow(
        new UnrepresentableNumberError(value),
      );
    },
  );

  // The value is checked as emitted text, whatever its runtime type.
  it.each(["0x10", "1e3", " 5 ", "abc", "10 extra", "007"])(
    "should reject the runtime string %o",
    value => {
      expect(() => toNumberFragment(value as unknown as number)).toThrow(
        new UnrepresentableNumberError(value as unknown as number),
      );
    },
  );

  it("should emit a digits-only runtime string", () => {
    expect(toNumberFragment("10" as unknown as number)).toBe("10");
  });
});
