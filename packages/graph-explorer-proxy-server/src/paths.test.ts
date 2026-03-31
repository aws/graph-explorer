import fs from "fs";
import path from "path";
import { vi } from "vitest";

import { clientRoot, isDirectory, proxyServerRoot } from "./paths.js";

test("clientRoot is points to graph-explorer", () => {
  expect(clientRoot).toMatch("/packages/graph-explorer");
});

test("proxyServerRoot points to graph-explorer-proxy-server", () => {
  expect(proxyServerRoot).toMatch("/packages/graph-explorer-proxy-server");
});

describe("isDirectory", () => {
  test("returns true for a directory", () => {
    expect(isDirectory(proxyServerRoot)).toBe(true);
  });

  test("returns false for a file", () => {
    expect(isDirectory(path.join(proxyServerRoot, "package.json"))).toBe(false);
  });

  test("returns false for a non-existent path", () => {
    expect(isDirectory("/does/not/exist")).toBe(false);
  });

  test("rethrows unexpected errors", () => {
    vi.spyOn(fs, "statSync").mockImplementation(() => {
      throw new Error("unexpected");
    });
    expect(() => isDirectory("/any/path")).toThrow("unexpected");
    vi.restoreAllMocks();
  });
});
