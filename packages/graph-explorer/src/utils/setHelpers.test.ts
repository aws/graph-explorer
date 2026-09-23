import { setDifference, setIsSubsetOf, setUnion } from "./setHelpers";

describe("setDifference", () => {
  it("returns elements in the first set but not the second", () => {
    const a = new Set([1, 2, 3]);
    const b = new Set([2, 4]);
    expect(setDifference(a, b)).toEqual(new Set([1, 3]));
  });

  it("returns an empty set when every element is present in the second set", () => {
    const a = new Set([1, 2]);
    const b = new Set([1, 2, 3]);
    expect(setDifference(a, b)).toEqual(new Set());
  });

  it("does not mutate the input sets", () => {
    const a = new Set([1, 2]);
    const b = new Set([2]);
    setDifference(a, b);
    expect(a).toEqual(new Set([1, 2]));
    expect(b).toEqual(new Set([2]));
  });
});

describe("setUnion", () => {
  it("returns all elements from both sets", () => {
    const a = new Set([1, 2]);
    const b = new Set([2, 3]);
    expect(setUnion(a, b)).toEqual(new Set([1, 2, 3]));
  });

  it("does not mutate the input sets", () => {
    const a = new Set([1, 2]);
    const b = new Set([2, 3]);
    setUnion(a, b);
    expect(a).toEqual(new Set([1, 2]));
    expect(b).toEqual(new Set([2, 3]));
  });
});

describe("setIsSubsetOf", () => {
  it("returns true when every element of the first set is in the second", () => {
    const a = new Set([1, 2]);
    const b = new Set([1, 2, 3]);
    expect(setIsSubsetOf(a, b)).toBe(true);
  });

  it("returns false when an element is missing from the second set", () => {
    const a = new Set([1, 4]);
    const b = new Set([1, 2, 3]);
    expect(setIsSubsetOf(a, b)).toBe(false);
  });

  it("returns true for an empty set", () => {
    expect(setIsSubsetOf(new Set(), new Set([1, 2]))).toBe(true);
  });
});
