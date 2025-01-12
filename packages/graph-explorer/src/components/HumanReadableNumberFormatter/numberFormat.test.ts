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
});
