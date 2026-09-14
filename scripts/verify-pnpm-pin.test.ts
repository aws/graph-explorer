import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { integrityToHex, main, parsePin } from "./verify-pnpm-pin.ts";

vi.mock("node:child_process");
vi.mock("node:fs");

// The real pnpm@12.4.1 pin, so the fixtures stay recognisable.
const VERSION = "12.4.1";
const HASH =
  "2e81e399d73fe8390dab25e06aa788ab7a5908248d2f5a370f82b481147a6a7a367bf8048f9a6fdb6460f21a66f0542dedb8b94ca2c8723596741920b1656d4c";
const INTEGRITY =
  "sha512-LoHjmdc/6DkNqyXgaqeIq3pZCCSNL1o3D4K0gRR6ano2e/gEj5pv22Rg8hpm8FQt7bi5TKLIcjWWdBkgsWVtTA==";

describe("parsePin", () => {
  test("splits a valid pin into version and hash", () => {
    expect(parsePin(`pnpm@${VERSION}+sha512.${HASH}`)).toEqual({
      version: VERSION,
      hash: HASH,
    });
  });

  test.for([
    ["missing packageManager", undefined],
    ["a non-string packageManager", 12.4],
  ])("rejects %s", ([, value]) => {
    expect(() => parsePin(value)).toThrow(/no packageManager string/);
  });

  test.for([
    ["no hash at all", `pnpm@${VERSION}`],
    [
      "a hash that is too short",
      `pnpm@${VERSION}+sha512.${HASH.slice(0, 127)}`,
    ],
    ["a hash that is too long", `pnpm@${VERSION}+sha512.${HASH}a`],
    [
      "a non-hex character in the hash",
      `pnpm@${VERSION}+sha512.${"z".repeat(128)}`,
    ],
    ["base64 rather than hex", `pnpm@${VERSION}+${INTEGRITY}`],
    ["sha1 rather than sha512", `pnpm@${VERSION}+sha1.${HASH}`],
    ["a different package manager", `yarn@4.0.0+sha512.${HASH}`],
    [
      "a version range rather than an exact version",
      `pnpm@^12.4.1+sha512.${HASH}`,
    ],
    ["a partial version", `pnpm@12.4+sha512.${HASH}`],
    ["trailing content", `pnpm@${VERSION}+sha512.${HASH} `],
  ])("rejects %s", ([, value]) => {
    expect(() => parsePin(value)).toThrow(/expected "pnpm@<x\.y\.z>/);
  });
});

describe("integrityToHex", () => {
  test("converts the registry's base64 integrity to the pin's hex form", () => {
    expect(integrityToHex(INTEGRITY)).toBe(HASH);
  });

  test("tolerates the quotes and newline that pnpm view emits", () => {
    expect(integrityToHex(`"${INTEGRITY}"\n`)).toBe(HASH);
  });

  test("accepts a value with no sha512- prefix", () => {
    expect(integrityToHex(INTEGRITY.replace("sha512-", ""))).toBe(HASH);
  });

  test("rejects an empty value rather than returning an empty hash", () => {
    expect(() => integrityToHex("  \n")).toThrow(/empty dist\.integrity/);
  });
});

describe("main", () => {
  /** Stubs the manifest read and the two `pnpm` invocations main shells out to. */
  function stubEnvironment({
    packageManager = `pnpm@${VERSION}+sha512.${HASH}`,
    integrity = INTEGRITY,
    running = VERSION,
  }: {
    packageManager?: unknown;
    integrity?: string;
    running?: string;
  } = {}) {
    vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ packageManager }));
    vi.mocked(execFileSync).mockImplementation((_file, args) => {
      const argv = args as string[];
      return argv[0] === "view" ? `${integrity}\n` : `${running}\n`;
    });
  }

  beforeEach(() => {
    vi.mocked(readFileSync).mockReset();
    vi.mocked(execFileSync).mockReset();
  });

  test("passes when the pin, the registry, and the running version agree", () => {
    stubEnvironment();
    const log = vi.spyOn(console, "log").mockImplementation(() => {});

    expect(() => main()).not.toThrow();

    expect(log).toHaveBeenCalledWith(
      `pnpm@${VERSION} matches its pinned integrity hash and is the version running.`,
    );
    expect(execFileSync).toHaveBeenCalledWith(
      "pnpm",
      ["view", `pnpm@${VERSION}`, "dist.integrity"],
      { encoding: "utf8" },
    );
  });

  test("reports both hashes and how to regenerate when the registry disagrees", () => {
    const otherHash = "a".repeat(128);
    stubEnvironment({
      integrity: `sha512-${Buffer.from(otherHash, "hex").toString("base64")}`,
    });

    expect(() => main()).toThrow(
      `the hash does not match what the registry publishes for pnpm@${VERSION}.\n` +
        `  pinned:   sha512.${HASH}\n` +
        `  registry: sha512.${otherHash}\n` +
        `Regenerate the pin with "corepack use pnpm@${VERSION}" rather than editing it by hand.`,
    );
  });

  test("names both versions and a remedy when the running pnpm is not the pinned one", () => {
    stubEnvironment({ running: "11.9.0" });

    expect(() => main()).toThrow(
      /packageManager pins pnpm@12\.4\.1 but pnpm 11\.9\.0 is running\.[\s\S]*from pnpm 11 onwards/,
    );
  });

  test("does not consult the registry when the pin itself is malformed", () => {
    stubEnvironment({ packageManager: "pnpm@12.4.1" });

    expect(() => main()).toThrow(/expected "pnpm@<x\.y\.z>/);
    expect(execFileSync).not.toHaveBeenCalled();
  });

  test("rejects a manifest that is not a JSON object", () => {
    vi.mocked(readFileSync).mockReturnValue('"not an object"');

    expect(() => main()).toThrow(/does not contain a JSON object/);
  });
});
