import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { beforeEach, describe, expect, test } from "vitest";

import { findPackageFiles, setReleaseVersion } from "./releaseVersion.ts";

const repoRoot = join(import.meta.dirname, "..");

const rootJson = `{
  "name": "root",
  "version": "1.0.0",
  "private": true,
  "packageManager": "pnpm@12.8.1"
}
`;

// Version not first, a nested "version" key, and tab indentation, to prove
// only the top-level value changes and the layout survives.
const appJson = `{
\t"name": "app",
\t"engines": { "version": "9.9.9" },
\t"version": "1.0.0",
\t"scripts": {}
}
`;

const libJson = `{"name":"lib","version":"1.0.0"}
`;

let rootDir: string;

function write(path: string, text: string) {
  const fullPath = join(rootDir, path);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, text);
}

function read(path: string) {
  return readFileSync(join(rootDir, path), "utf8");
}

beforeEach(() => {
  rootDir = mkdtempSync(join(tmpdir(), "release-version-"));
  write("package.json", rootJson);
  write("packages/app/package.json", appJson);
  write("packages/lib/package.json", libJson);
  write("packages/app/node_modules/dep/package.json", libJson);
});

describe("setReleaseVersion", () => {
  test("sets the version in the root and every workspace package", () => {
    const updated = setReleaseVersion(rootDir, "2.3.4");

    expect(updated).toStrictEqual([
      "package.json",
      "packages/app/package.json",
      "packages/lib/package.json",
    ]);
    expect(read("package.json")).toBe(rootJson.replace("1.0.0", "2.3.4"));
    expect(read("packages/app/package.json")).toBe(
      appJson.replace('"version": "1.0.0"', '"version": "2.3.4"'),
    );
    expect(read("packages/lib/package.json")).toBe(
      libJson.replace("1.0.0", "2.3.4"),
    );
    expect(read("packages/app/node_modules/dep/package.json")).toBe(libJson);
  });

  test("changes the version key, not a value that reads version", () => {
    const json = `{ "name": "version", "private": true, "version": "1.0.0" }\n`;
    write("packages/lib/package.json", json);

    setReleaseVersion(rootDir, "2.3.4");

    expect(read("packages/lib/package.json")).toBe(
      json.replace("1.0.0", "2.3.4"),
    );
  });

  test.each([
    "",
    "3.4",
    "3.4.0.1",
    "v3.4.0",
    "3.4.0-beta.1",
    "3.4.0+build",
    "03.4.0",
    " 3.4.0",
  ])("rejects %j and changes no file", version => {
    expect(() => setReleaseVersion(rootDir, version)).toThrow(
      `Expected a version like 1.2.3, got ${JSON.stringify(version)}`,
    );
    expect(read("package.json")).toBe(rootJson);
    expect(read("packages/app/package.json")).toBe(appJson);
    expect(read("packages/lib/package.json")).toBe(libJson);
  });

  test("rejects a package.json with no top-level version and changes no file", () => {
    write("packages/lib/package.json", `{ "name": "lib" }\n`);

    expect(() => setReleaseVersion(rootDir, "2.3.4")).toThrow(
      "packages/lib/package.json has no top-level version",
    );
    expect(read("package.json")).toBe(rootJson);
    expect(read("packages/app/package.json")).toBe(appJson);
  });
});

describe("this repository", () => {
  const trackedPackageFiles = execFileSync(
    "git",
    ["ls-files", "package.json", "**/package.json"],
    { cwd: repoRoot, encoding: "utf8" },
  )
    .split("\n")
    .filter(Boolean)
    .sort();

  test("the script finds every tracked package.json", () => {
    expect(findPackageFiles(repoRoot)).toStrictEqual(trackedPackageFiles);
  });

  test("every package.json has the same version", () => {
    const versions = trackedPackageFiles.map(path => {
      const json = JSON.parse(readFileSync(join(repoRoot, path), "utf8"));
      return [path, json.version];
    });
    const rootVersion = JSON.parse(
      readFileSync(join(repoRoot, "package.json"), "utf8"),
    ).version;

    expect(versions).toStrictEqual(
      trackedPackageFiles.map(path => [path, rootVersion]),
    );
  });
});
