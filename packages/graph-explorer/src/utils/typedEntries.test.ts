import { describe, expect, test } from "vitest";

import { typedEntries } from "./typedEntries";

describe("typedEntries", () => {
  test("returns the same pairs as Object.entries", () => {
    const obj = { a: 1, b: 2 };
    expect(typedEntries(obj)).toStrictEqual([
      ["a", 1],
      ["b", 2],
    ]);
  });

  test("returns an empty array for an empty object", () => {
    expect(typedEntries({})).toStrictEqual([]);
  });
});
