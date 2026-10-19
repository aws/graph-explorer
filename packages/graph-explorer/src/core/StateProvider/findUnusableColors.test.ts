import { describe, expect, it } from "vite-plus/test";

import { findUnusableColors } from "./findUnusableColors";

type Entry = { color?: string; borderColor?: string; shape?: string };
const FIELDS = ["color", "borderColor"] as const;

describe("findUnusableColors", () => {
  it("finds nothing when every color is usable", () => {
    const entry: Entry = { color: "#FF0000", borderColor: "red" };

    expect(findUnusableColors(entry, FIELDS)).toStrictEqual([]);
  });

  it("finds nothing when no color is set", () => {
    const entry: Entry = { shape: "star" };

    expect(findUnusableColors(entry, FIELDS)).toStrictEqual([]);
  });

  it("finds a blank color", () => {
    const entry: Entry = { color: "  ", shape: "star" };

    expect(findUnusableColors(entry, FIELDS)).toStrictEqual([
      { field: "color", value: "  " },
    ]);
  });

  it("finds a padded color, since it is stored as written", () => {
    const entry: Entry = { color: " #fff " };

    expect(findUnusableColors(entry, FIELDS)).toStrictEqual([
      { field: "color", value: " #fff " },
    ]);
  });

  it("finds only the unusable colors beside usable ones", () => {
    const entry: Entry = { color: "var(--x)", borderColor: "#00FF00" };

    expect(findUnusableColors(entry, FIELDS)).toStrictEqual([
      { field: "color", value: "var(--x)" },
    ]);
  });

  it("requires every color field of the entry to be listed", () => {
    const entry: Entry = { color: "var(--x)", borderColor: "var(--x)" };

    // @ts-expect-error borderColor is a color field and is missing
    const result = findUnusableColors(entry, ["color"] as const);

    expect(result).toStrictEqual([{ field: "color", value: "var(--x)" }]);
  });
});
