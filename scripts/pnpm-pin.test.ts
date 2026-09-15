import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, test, vi } from "vitest";

import {
  findLockedIntegrity,
  integrityToHex,
  main,
  parsePin,
  readPinField,
} from "./pnpm-pin.ts";

vi.mock("node:child_process");
vi.mock("node:fs");

// The real pnpm@12.4.2 pin, so the fixtures stay recognisable.
const VERSION = "12.4.2";
const HASH =
  "08adc6613180275c7c9edada39dcf08c9c61ad4e7eaf330a4f3461f102b0f907423454d117f98e72d47fef0616070644d7bffc973a6a57f5090a6d7c368b07c9";
const INTEGRITY =
  "sha512-CK3GYTGAJ1x8ntraOdzwjJxhrU5+rzMKTzRh8QKw+QdCNFTRF/mOctR/7wYWBwZE17/8lzpqV/UJCm18NosHyQ==";

function lockfileWith(version: string, integrity: string): string {
  return [
    "lockfileVersion: '9.0'",
    "",
    "packages:",
    "",
    `  pnpm@${version}:`,
    `    resolution: {integrity: ${integrity}}`,
    "    engines: {node: '>=18.*'}",
    "",
  ].join("\n");
}

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
    ["a non-hex character", `pnpm@${VERSION}+sha512.${"z".repeat(128)}`],
    ["base64 rather than hex", `pnpm@${VERSION}+${INTEGRITY}`],
    ["sha1 rather than sha512", `pnpm@${VERSION}+sha1.${HASH}`],
    ["a different package manager", `yarn@4.0.0+sha512.${HASH}`],
    ["a version range", `pnpm@^12.4.2+sha512.${HASH}`],
    ["a partial version", `pnpm@12.4+sha512.${HASH}`],
    ["trailing content", `pnpm@${VERSION}+sha512.${HASH} `],
  ])("rejects %s", ([, value]) => {
    expect(() => parsePin(value)).toThrow(/expected "pnpm@<x\.y\.z>/);
  });
});

describe("readPinField", () => {
  test("reads the field without assuming the rest of the manifest", () => {
    expect(readPinField('{"name":"x","packageManager":"pnpm@1.2.3"}')).toBe(
      "pnpm@1.2.3",
    );
  });

  test("returns undefined when the field is absent", () => {
    expect(readPinField('{"name":"x"}')).toBeUndefined();
  });

  test("rejects a manifest that is not a JSON object", () => {
    expect(() => readPinField('"not an object"')).toThrow(
      /does not contain a JSON object/,
    );
  });
});

describe("integrityToHex", () => {
  test("converts a base64 integrity to hex", () => {
    expect(integrityToHex(INTEGRITY)).toBe(HASH);
  });

  test("accepts a value with no sha512- prefix", () => {
    expect(integrityToHex(INTEGRITY.replace("sha512-", ""))).toBe(HASH);
  });

  test.for([
    ["an empty value", "  \n"],
    ["a truncated integrity", INTEGRITY.slice(0, 20)],
    ["junk", "not-an-integrity-at-all"],
  ])("rejects %s rather than decoding it to a short hash", ([, value]) => {
    expect(() => integrityToHex(value)).toThrow(/is not a sha512 integrity/);
  });
});

describe("findLockedIntegrity", () => {
  test("finds the integrity recorded for the pinned version", () => {
    expect(findLockedIntegrity(lockfileWith(VERSION, INTEGRITY), VERSION)).toBe(
      INTEGRITY,
    );
  });

  test("does not match a different version that shares a prefix", () => {
    expect(() =>
      findLockedIntegrity(lockfileWith("12.4.20", INTEGRITY), VERSION),
    ).toThrow(/records no integrity for pnpm@12\.4\.2/);
  });

  test("treats dots as literals rather than wildcards", () => {
    expect(() =>
      findLockedIntegrity(lockfileWith("12X4X2", INTEGRITY), VERSION),
    ).toThrow(/records no integrity for pnpm@12\.4\.2/);
  });

  test("points at corepack use when the lockfile has no entry", () => {
    expect(() =>
      findLockedIntegrity(lockfileWith("12.0.0", INTEGRITY), VERSION),
    ).toThrow(/Run "corepack use pnpm@12\.4\.2"/);
  });
});

describe("main", () => {
  /** Stubs the two file reads and the one `pnpm` invocation main makes. */
  function stubEnvironment({
    packageManager = `pnpm@${VERSION}+sha512.${HASH}`,
    lockedVersion = VERSION,
    lockedIntegrity = INTEGRITY,
    running = VERSION,
  }: {
    packageManager?: unknown;
    lockedVersion?: string;
    lockedIntegrity?: string;
    running?: string;
  } = {}) {
    vi.mocked(readFileSync).mockImplementation(path => {
      const name = String(path);
      if (name.endsWith("package.json")) {
        return JSON.stringify({ packageManager });
      }
      if (name.endsWith("pnpm-lock.yaml")) {
        return lockfileWith(lockedVersion, lockedIntegrity);
      }
      throw new Error(`unexpected read: ${name}`);
    });
    vi.mocked(execFileSync).mockImplementation((_file, args) => {
      const argv = (args as string[]).join(" ");
      if (argv === "--version") {
        return `${running}\n`;
      }
      throw new Error(`unexpected pnpm invocation: ${argv}`);
    });
  }

  beforeEach(() => {
    vi.mocked(readFileSync).mockReset();
    vi.mocked(execFileSync).mockReset();
  });

  test("passes when the pin, the lockfile, and the running version agree", () => {
    stubEnvironment();
    const log = vi.spyOn(console, "log").mockImplementation(() => {});

    expect(() => main()).not.toThrow();

    expect(log).toHaveBeenCalledWith(
      `packageManager and pnpm-lock.yaml agree on pnpm@${VERSION}, and pnpm ${VERSION} is running.`,
    );
  });

  test("never contacts the registry", () => {
    stubEnvironment();
    vi.spyOn(console, "log").mockImplementation(() => {});

    main();

    const invocations = vi
      .mocked(execFileSync)
      .mock.calls.map(([, args]) => (args as string[]).join(" "));
    expect(invocations).toStrictEqual(["--version"]);
  });

  test("runs pnpm in the repo rather than the caller's directory", () => {
    stubEnvironment();
    vi.spyOn(console, "log").mockImplementation(() => {});

    main();

    const [, , options] = vi.mocked(execFileSync).mock.calls[0];
    expect(options).toMatchObject({ cwd: expect.any(String) });
    expect(String((options as { cwd: string }).cwd)).not.toBe("");
  });

  test("reports both hashes and how to regenerate when the lockfile disagrees", () => {
    const otherHash = "a".repeat(128);
    stubEnvironment({
      lockedIntegrity: `sha512-${Buffer.from(otherHash, "hex").toString("base64")}`,
    });

    expect(() => main()).toThrow(
      `packageManager and pnpm-lock.yaml disagree on the pnpm@${VERSION} hash.\n` +
        `  packageManager: sha512.${HASH}\n` +
        `  pnpm-lock.yaml: sha512.${otherHash}\n` +
        `Regenerate the pin with "corepack use pnpm@${VERSION}" rather than editing it by hand.`,
    );
  });

  test("names the lockfile, not the pin, when the lockfile has no such entry", () => {
    stubEnvironment({ lockedVersion: "12.0.0" });

    expect(() => main()).toThrow(/records no integrity for pnpm@12\.4\.2/);
  });

  test("names both versions and a remedy when the running pnpm is not the pinned one", () => {
    stubEnvironment({ running: "11.9.0" });

    expect(() => main()).toThrow(
      /packageManager pins pnpm@12\.4\.2 but pnpm 11\.9\.0 is running\.[\s\S]*from pnpm 11 onwards/,
    );
  });

  test("does not read the lockfile when the pin itself is malformed", () => {
    stubEnvironment({ packageManager: `pnpm@${VERSION}` });

    expect(() => main()).toThrow(/expected "pnpm@<x\.y\.z>/);
    expect(execFileSync).not.toHaveBeenCalled();
  });
});
