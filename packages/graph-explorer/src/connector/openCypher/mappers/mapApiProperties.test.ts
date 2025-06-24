import {
  createRandomBoolean,
  createRandomDate,
  createRandomDouble,
  createRandomInteger,
  createRandomName,
} from "@shared/utils/testing";
import { mapApiProperties } from "./mapApiProperties";

describe("mapApiProperties", () => {
  it("should map string value", () => {
    const value = createRandomName();
    const actual = mapApiProperties({ value });
    expect(actual).toEqual({ value });
  });

  it("should map integer value", () => {
    const value = createRandomInteger();
    const actual = mapApiProperties({ value });
    expect(actual).toEqual({ value });
  });

  it("should map double value", () => {
    const value = createRandomDouble();
    const actual = mapApiProperties({ value });
    expect(actual).toEqual({ value });
  });

  it("should map boolean value", () => {
    const value = createRandomBoolean();
    const actual = mapApiProperties({ value });
    expect(actual).toEqual({ value });
  });

  it("should map date value", () => {
    const value = createRandomDate();
    const actual = mapApiProperties({ value: value.toISOString() });
    expect(actual).toEqual({ value: value.toISOString() });
  });
});
