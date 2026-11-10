import { describe, expect, test } from "vite-plus/test";

import { digitStringSchema } from "./digitStringSchema";

describe("digitStringSchema", () => {
  test.each([
    ["0", 0],
    ["7", 7],
    ["007", 7],
    ["1000", 1000],
  ])("reads %s as %d", (input, expected) => {
    expect(digitStringSchema.parse(input)).toBe(expected);
  });

  test.each(["", "-5", "2.5", "1e3", " 5", "abc", "５"])(
    "rejects %j",
    input => {
      expect(digitStringSchema.safeParse(input).success).toBe(false);
    },
  );

  test("rejects a value that is not a string", () => {
    expect(digitStringSchema.safeParse(5).success).toBe(false);
  });
});
