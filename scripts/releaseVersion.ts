/**
 * Sets the release version in the root package.json and in every workspace
 * package's package.json.
 *
 * Usage: pnpm release:version 1.2.3
 */
import { globSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const plainVersion = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const keySeparator = /\s*:/y;

/** The root package.json and each `packages/*` package.json, relative to `rootDir`, sorted. */
export function findPackageFiles(rootDir: string): string[] {
  return [
    "package.json",
    ...globSync("packages/*/package.json", { cwd: rootDir }).sort(),
  ];
}

/**
 * Sets `version` in every file `findPackageFiles` returns, changing only the
 * version's text. Writes nothing unless every file can be updated.
 *
 * @returns the updated files, relative to `rootDir`
 */
export function setReleaseVersion(rootDir: string, version: string): string[] {
  if (!plainVersion.test(version)) {
    throw new Error(
      `Expected a version like 1.2.3, got ${JSON.stringify(version)}`,
    );
  }

  const files = findPackageFiles(rootDir);
  const updates = files.map(path => {
    const text = readFileSync(join(rootDir, path), "utf8");
    if (typeof JSON.parse(text).version !== "string") {
      throw new Error(`${path} has no top-level version`);
    }
    const range = findTopLevelVersion(text);
    return {
      path,
      text: `${text.slice(0, range.start)}"${version}"${text.slice(range.end)}`,
    };
  });

  for (const { path, text } of updates) {
    writeFileSync(join(rootDir, path), text);
  }
  return files;
}

type TextRange = { start: number; end: number };

/**
 * Finds the string value of the root object's `version` key, quotes included.
 * Expects valid JSON whose root object has a string `version`.
 */
function findTopLevelVersion(json: string): TextRange {
  let depth = 0;
  let index = 0;
  while (index < json.length) {
    const char = json[index];
    if (char === '"') {
      const end = endOfString(json, index);
      keySeparator.lastIndex = end;
      const isKey = keySeparator.test(json);
      if (depth === 1 && isKey && json.slice(index, end) === '"version"') {
        const valueStart = json.indexOf('"', end);
        return { start: valueStart, end: endOfString(json, valueStart) };
      }
      index = end;
      continue;
    }
    if (char === "{" || char === "[") depth++;
    if (char === "}" || char === "]") depth--;
    index++;
  }
  throw new Error("No top-level version");
}

/** The index just past the closing quote of the string starting at `start`. */
function endOfString(json: string, start: number): number {
  let index = start + 1;
  while (json[index] !== '"') {
    index += json[index] === "\\" ? 2 : 1;
  }
  return index + 1;
}

if (import.meta.main) {
  const rootDir = join(import.meta.dirname, "..");
  const updated = setReleaseVersion(rootDir, process.argv[2] ?? "");
  for (const path of updated) {
    process.stdout.write(`${path}\n`);
  }
}
