/**
 * @vitest-environment jsdom
 */

import { beforeEach, describe, expect, test } from "vite-plus/test";

import { mockVirtualizedLayout } from "./mockVirtualizedLayout";

beforeEach(mockVirtualizedLayout);

describe("mockVirtualizedLayout", () => {
  test.each(["offsetHeight", "clientHeight"] as const)(
    "%s falls back to a non-zero viewport",
    prop => {
      expect(document.createElement("div")[prop]).toBe(300);
    },
  );

  test.each(["offsetWidth", "clientWidth"] as const)(
    "%s falls back to a non-zero viewport",
    prop => {
      expect(document.createElement("div")[prop]).toBe(300);
    },
  );

  test.each(["offsetHeight", "clientHeight"] as const)(
    "%s reads the inline height",
    prop => {
      const element = document.createElement("div");
      element.style.height = "720px";
      expect(element[prop]).toBe(720);
    },
  );

  test.each(["offsetWidth", "clientWidth"] as const)(
    "%s reads the inline width",
    prop => {
      const element = document.createElement("div");
      element.style.width = "120px";
      expect(element[prop]).toBe(120);
    },
  );
});
