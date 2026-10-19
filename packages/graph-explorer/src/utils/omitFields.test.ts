import { describe, expect, it } from "vite-plus/test";

import { omitFields } from "./omitFields";

type Entry = { a?: string; b?: number; c?: boolean };

describe("omitFields", () => {
  it("returns a copy without the given fields", () => {
    const entry: Entry = { a: "x", b: 1, c: true };

    expect(omitFields(entry, ["a", "c"])).toStrictEqual({ b: 1 });
  });

  it("returns the entry itself when given no fields", () => {
    const entry: Entry = { a: "x" };

    expect(omitFields(entry, [])).toBe(entry);
  });

  it("does not mutate the entry it is given", () => {
    const entry: Entry = { a: "x", b: 1 };

    omitFields(entry, ["a"]);

    expect(entry).toStrictEqual({ a: "x", b: 1 });
  });
});
