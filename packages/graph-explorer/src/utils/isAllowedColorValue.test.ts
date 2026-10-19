import { describe, expect, it } from "vite-plus/test";

import { isAllowedColorValue } from "./isAllowedColorValue";

describe("isAllowedColorValue", () => {
  // The color picker writes hex, and exported or hand-written files may carry
  // any form the `color` library reads, so these must all keep loading.
  it.each([
    "#128EE5",
    "#fff",
    "#12345678",
    "rgb(1, 2, 3)",
    "rgba(0, 0, 0, 0.5)",
    "rgb(1 2 3 / 50%)",
    "hsl(10, 20%, 30%)",
    "red",
    "RED",
    "transparent",
    "  #128EE5  ",
  ])("accepts %s", value => {
    expect(isAllowedColorValue(value)).toBe(true);
  });

  // A color is a value, never a reference or a declaration list.
  it.each([
    "url(http://other.example/x.svg#p)",
    "var(--accent)",
    "currentColor",
    "red; display: none",
    "not a color",
    "",
    "   ",
  ])("rejects %j", value => {
    expect(isAllowedColorValue(value)).toBe(false);
  });

  // encodeURIComponent throws on a lone surrogate during style computation.
  it("rejects a lone surrogate", () => {
    expect(isAllowedColorValue("\uD800")).toBe(false);
    expect(isAllowedColorValue("#fff\uD800")).toBe(false);
  });
});
