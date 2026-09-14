import { describe, expect, test } from "vitest";

import { integrityToHex, parsePin } from "./verify-pnpm-pin.ts";

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
