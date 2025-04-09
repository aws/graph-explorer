import { getLimit } from "./getLimit";

describe("getLimit", () => {
  it("should return empty string if no offset", () => {
    const result = getLimit();
    expect(result).toEqual("");
  });

  it("should return empty string if no limit", () => {
    const result = getLimit(undefined);
    expect(result).toEqual("");
  });

  it("should return empty string if limit is 0", () => {
    const result = getLimit(0);
    expect(result).toEqual("");
  });

  it("should return limit", () => {
    const result = getLimit(10);
    expect(result).toEqual("LIMIT 10");
  });

  it("should return limit with no offset when zero", () => {
    const result = getLimit(10, 0);
    expect(result).toEqual("LIMIT 10");
  });

  it("should return limit with offset", () => {
    const result = getLimit(10, 5);
    expect(result).toEqual("LIMIT 10 OFFSET 5");
  });

  it("should return offset only when limit is zero", () => {
    const result = getLimit(0, 5);
    expect(result).toEqual("OFFSET 5");
  });
});
