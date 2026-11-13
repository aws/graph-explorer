import fs from "fs";
import path from "path";
import { describe, expect, test, vi } from "vite-plus/test";

import {
  certificateDir,
  clientRoot,
  configJsonPath,
  containerStartMarkerPath,
  isDirectory,
  isMissingFileError,
  proxyServerRoot,
  repoRoot,
} from "./paths.ts";

test("clientRoot is points to graph-explorer", () => {
  expect(clientRoot).toMatch("/packages/graph-explorer");
});

test("proxyServerRoot points to graph-explorer-proxy-server", () => {
  expect(proxyServerRoot).toMatch("/packages/graph-explorer-proxy-server");
});

test("configJsonPath is config.json at the repository root, where the image keeps it", () => {
  expect(configJsonPath).toBe(path.join(repoRoot, "config.json"));
});

test("keeps the container start marker outside cert-info, which may be a volume", () => {
  expect(
    path.relative(certificateDir, containerStartMarkerPath).startsWith(".."),
  ).toBe(true);
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

describe("isMissingFileError", () => {
  test("is true for the error reading a path that doesn't exist", () => {
    let error: unknown;
    try {
      fs.readFileSync("/does/not/exist");
    } catch (caught) {
      error = caught;
    }

    expect(isMissingFileError(error)).toBe(true);
  });

  test("is false for any other error", () => {
    let error: unknown;
    try {
      fs.readFileSync(proxyServerRoot);
    } catch (caught) {
      error = caught;
    }

    expect(isMissingFileError(error)).toBe(false);
    expect(isMissingFileError(new Error("ENOENT"))).toBe(false);
    expect(isMissingFileError("ENOENT")).toBe(false);
  });
});
