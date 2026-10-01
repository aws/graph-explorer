import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { isWellFormedString } from "./isWellFormedString";

describe("isWellFormedString", () => {
  it("returns true for well-formed strings", () => {
    expect(isWellFormedString("hello")).toBe(true);
    expect(isWellFormedString("café")).toBe(true);
    expect(isWellFormedString("emoji 🚀")).toBe(true);
  });

  it("returns false for a lone high surrogate", () => {
    expect(isWellFormedString("\uD800")).toBe(false);
  });

  it("returns false for a lone low surrogate", () => {
    expect(isWellFormedString("\uDC00")).toBe(false);
  });

  it("returns false for an unpaired surrogate in a larger string", () => {
    expect(isWellFormedString("hello \uD800 world")).toBe(false);
  });

  it("returns false for a high surrogate at the end of the string", () => {
    expect(isWellFormedString("a\uD800")).toBe(false);
  });

  it("returns false for a surrogate pair in reverse order", () => {
    expect(isWellFormedString("\uDC00\uD800")).toBe(false);
  });

  it("returns false for two adjacent high surrogates", () => {
    expect(isWellFormedString("\uD800\uD800\uDC00")).toBe(false);
  });

  it("returns true for a valid surrogate pair", () => {
    expect(isWellFormedString("\uD83D\uDE80")).toBe(true);
  });

  it("returns true for an empty string", () => {
    expect(isWellFormedString("")).toBe(true);
  });

  it("agrees with encodeURIComponent, which throws on unpaired surrogates", () => {
    const codeUnit = fc.oneof(
      fc.integer({ min: 0xd800, max: 0xdfff }),
      fc.integer({ min: 0, max: 0xffff }),
    );
    fc.assert(
      fc.property(fc.array(codeUnit, { maxLength: 8 }), codes => {
        const value = String.fromCharCode(...codes);
        expect(isWellFormedString(value)).toBe(encodes(value));
      }),
    );
  });
});

function encodes(value: string): boolean {
  try {
    encodeURIComponent(value);
    return true;
  } catch {
    return false;
  }
}
