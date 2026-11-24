import {
  createRandomBoolean,
  createRandomDouble,
  createRandomInteger,
  createRandomName,
} from "@shared/utils/testing";
import { describe, expect, it } from "vite-plus/test";

import {
  createGDate,
  createGDouble,
  createGInt32,
  createGVertexProperty,
} from "@/utils/testing";

import parseProperty from "./parseProperty";

describe("parseProperty", () => {
  it("should parse a string value", () => {
    const value = createRandomName("value");
    const actual = parseProperty(createGVertexProperty("value", value));

    expect(actual).toBe(value);
  });

  it("should parse a number value", () => {
    const value = createRandomInteger();
    const actual = parseProperty(
      createGVertexProperty("value", createGInt32(value)),
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
      createGVertexProperty("value", createGDouble(value)),
    );

    expect(actual).toBe(value);
  });

  it("should parse a date value", () => {
    const value = new Date();
    const actual = parseProperty(
      createGVertexProperty("value", createGDate(value)),
    );

    expect(actual).toEqual(value);
  });

  it("should keep the raw value of a date out of the Date range", () => {
    const value = 8.64e15 + 1;
    const actual = parseProperty(
      createGVertexProperty("value", { "@type": "g:Date", "@value": value }),
    );

    expect(actual).toBe(value);
  });
});
