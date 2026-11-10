import { describe, expect, test } from "vite-plus/test";

import {
  positiveWholeNumberError,
  positiveWholeNumberSchema,
} from "./positiveWholeNumber";

describe("positiveWholeNumberSchema", () => {
  test("accepts a whole number greater than 0", () => {
    expect(positiveWholeNumberSchema.safeParse(5)).toStrictEqual({
      success: true,
      data: 5,
    });
  });

  test.each([0, -3, 1.5, NaN, Infinity, undefined])("refuses %s", value => {
    expect(positiveWholeNumberSchema.safeParse(value).success).toBe(false);
  });
});

describe("positiveWholeNumberError", () => {
  test("is undefined for a valid value", () => {
    expect(positiveWholeNumberError(1)).toBeUndefined();
  });

  test.each([0, -3, 1.5, NaN, undefined])(
    "asks for a whole number greater than 0 when the value is %s",
    value => {
      expect(positiveWholeNumberError(value)).toBe(
        "Enter a whole number greater than 0",
      );
    },
  );
});
