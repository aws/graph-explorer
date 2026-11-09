import { describe, expect, test } from "vite-plus/test";

import { neighborLimitError, neighborLimitSchema } from "./neighborLimit";

describe("neighborLimitSchema", () => {
  test("accepts a whole number greater than 0", () => {
    expect(neighborLimitSchema.safeParse(5)).toStrictEqual({
      success: true,
      data: 5,
    });
  });

  test.each([0, -3, 1.5, NaN, Infinity, undefined])("refuses %s", value => {
    expect(neighborLimitSchema.safeParse(value).success).toBe(false);
  });
});

describe("neighborLimitError", () => {
  test("is undefined for a valid limit", () => {
    expect(neighborLimitError(1)).toBeUndefined();
  });

  test.each([0, -3, 1.5, NaN, undefined])(
    "asks for a whole number greater than 0 when the limit is %s",
    value => {
      expect(neighborLimitError(value)).toBe(
        "Enter a whole number greater than 0",
      );
    },
  );
});
