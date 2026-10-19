import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

import { logger } from "@/utils";

import { dropUnusableColors } from "./dropUnusableColors";

type Entry = { color?: string; borderColor?: string; shape?: string };
const FIELDS = ["color", "borderColor"] as const;

describe("dropUnusableColors", () => {
  beforeEach(() => {
    vi.spyOn(logger, "warn").mockImplementation(() => {});
  });

  it("returns null when every color is usable", () => {
    const entry: Entry = { color: "#FF0000", borderColor: "red" };

    expect(dropUnusableColors(entry, FIELDS, "Person")).toBeNull();
  });

  it("returns null when no color is set", () => {
    const entry: Entry = { shape: "star" };

    expect(dropUnusableColors(entry, FIELDS, "Person")).toBeNull();
  });

  it("drops a blank color without a warning", () => {
    const result = dropUnusableColors(
      { color: "  ", shape: "star" },
      FIELDS,
      "P",
    );

    expect(result).toStrictEqual({ shape: "star" });
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it("drops a value that is not a color and warns with the start of it", () => {
    const value = `url(http://other.example/${"x".repeat(200)})`;

    const result = dropUnusableColors(
      { color: value, shape: "star" },
      FIELDS,
      "Person",
    );

    expect(result).toStrictEqual({ shape: "star" });
    expect(logger.warn).toBeCalledWith(
      `Unsupported color "${value.slice(0, 100)}" in color for "Person", using the default`,
    );
  });

  it("keeps the usable colors beside a dropped one", () => {
    const result = dropUnusableColors(
      { color: "var(--x)", borderColor: "#00FF00" },
      FIELDS,
      "Person",
    );

    expect(result).toStrictEqual({ borderColor: "#00FF00" });
  });

  it("does not mutate the entry it is given", () => {
    const entry: Entry = { color: "var(--x)" };

    dropUnusableColors(entry, FIELDS, "Person");

    expect(entry).toStrictEqual({ color: "var(--x)" });
  });
});
