import {
  createGDate,
  createGDouble,
  createGInt32,
  createGVertexProperty,
} from "@/utils/testing";
import parseProperty from "./parseProperty";
import {
  createRandomBoolean,
  createRandomDouble,
  createRandomInteger,
  createRandomName,
} from "@shared/utils/testing";

describe("parseProperty", () => {
  it("should parse a string value", () => {
    const value = createRandomName("value");
    const actual = parseProperty(createGVertexProperty("value", value));

    expect(actual).toBe(value);
  });

  it("should parse a number value", () => {
    const value = createRandomInteger();
    const actual = parseProperty(
      createGVertexProperty("value", createGInt32(value))
    );

    expect(actual).toBe(value);
  });

  it("should parse a boolean value", () => {
    const value = createRandomBoolean();
    const actual = parseProperty(createGVertexProperty("value", value));

    expect(actual).toBe(value);
  });

  it("should parse a double value", () => {
    const value = createRandomDouble();
    const actual = parseProperty(
      createGVertexProperty("value", createGDouble(value))
    );

    expect(actual).toBe(value);
  });

  it("should parse a date value", () => {
    const value = new Date();
    const actual = parseProperty(
      createGVertexProperty("value", createGDate(value))
    );

    expect(actual).toEqual(value);
  });
});
