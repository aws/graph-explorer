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

  it("returns true for a valid surrogate pair", () => {
    expect(isWellFormedString("\uD83D\uDE80")).toBe(true);
  });

  it("returns true for an empty string", () => {
    expect(isWellFormedString("")).toBe(true);
  });
});
