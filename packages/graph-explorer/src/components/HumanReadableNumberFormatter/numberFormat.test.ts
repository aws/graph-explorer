import { toHumanString } from "./numberFormat";

describe("numberFormat", () => {
  it("should format numbers", () => {
    expect(toHumanString(1000)).toBe("1k");
    expect(toHumanString(123)).toBe("123");
    expect(toHumanString(1234)).toBe("1.23k");
    expect(toHumanString(12345)).toBe("12.35k");
    expect(toHumanString(12345, 0)).toBe("12k");
    expect(toHumanString(12345, 3)).toBe("12.345k");
    expect(toHumanString(12345, 8)).toBe("12.345k");
  });

  it("should format numbers with decimals", () => {
    expect(toHumanString(12.345)).toBe("12.35");
    expect(toHumanString(123.45)).toBe("123.45");
    expect(toHumanString(12.345, 3)).toBe("12.345");
    expect(toHumanString(123.45, 3)).toBe("123.45");
  });

  it("should format negative numbers", () => {
    expect(toHumanString(-1000)).toBe("-1k");
    expect(toHumanString(-123)).toBe("-123");
    expect(toHumanString(-1234)).toBe("-1.23k");
    expect(toHumanString(-12345)).toBe("-12.35k");
    expect(toHumanString(-12345, 0)).toBe("-12k");
    expect(toHumanString(-12345, 3)).toBe("-12.345k");
    expect(toHumanString(-12345, 8)).toBe("-12.345k");
  });

  it("should format negative numbers with decimals", () => {
    expect(toHumanString(-12.345)).toBe("-12.35");
    expect(toHumanString(-123.45)).toBe("-123.45");
    expect(toHumanString(-12.345, 3)).toBe("-12.345");
    expect(toHumanString(-123.45, 3)).toBe("-123.45");
  });
});
