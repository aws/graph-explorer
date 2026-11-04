import { describe, expect, it } from "vite-plus/test";

import formatDate from "./formatDate";

describe("formatDate", () => {
  it("formats with the default pattern", () => {
    expect(formatDate(new Date("2024-03-05T14:07:00Z"))).toBe(
      "Mar 05 2024, 2:07 PM",
    );
  });

  it("formats with a custom pattern", () => {
    expect(
      formatDate(new Date("2024-03-05T14:07:00Z"), "yyyy-MM-dd HH:mm"),
    ).toBe("2024-03-05 14:07");
  });
});
