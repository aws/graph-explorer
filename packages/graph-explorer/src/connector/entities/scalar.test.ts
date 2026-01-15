import {
  createRandomBoolean,
  createRandomDouble,
  createRandomInteger,
} from "@shared/utils/testing";

import { LABELS } from "@/utils";

import {
  createResultScalar,
  createTypedValue,
  getDisplayValueForScalar,
  type ResultScalar,
} from "./scalar";

describe("scalar", () => {
  describe("createScalar", () => {
    it("should create a null scalar", () => {
      const result = createResultScalar({ value: null });

      expect(result).toEqual({
        entityType: "scalar",
        value: null,
      } satisfies ResultScalar);
    });

    it("should create a string scalar", () => {
      const result = createResultScalar({ value: "hello world" });

      expect(result).toEqual({
        entityType: "scalar",
        value: "hello world",
      } satisfies ResultScalar);
    });

    it("should create a string scalar from empty string", () => {
      const result = createResultScalar({ value: "" });

      expect(result).toEqual({
        entityType: "scalar",
        value: "",
      } satisfies ResultScalar);
    });

    it("should create a number scalar from integer", () => {
      const value = createRandomInteger();
      const result = createResultScalar({ value });

      expect(result).toEqual({
        entityType: "scalar",
        value: value,
      } satisfies ResultScalar);
    });

    it("should create a number scalar from double", () => {
      const value = createRandomDouble();
      const result = createResultScalar({ value });

      expect(result).toEqual({
        entityType: "scalar",
        value: value,
      } satisfies ResultScalar);
    });

    it("should create a number scalar from zero", () => {
      const result = createResultScalar({ value: 0 });

      expect(result).toEqual({
        entityType: "scalar",
        value: 0,
      } satisfies ResultScalar);
    });

    it("should create a number scalar from negative number", () => {
      const result = createResultScalar({ value: -100 });

      expect(result).toEqual({
        entityType: "scalar",
        value: -100,
      } satisfies ResultScalar);
    });

    it("should create a boolean scalar", () => {
      const value = createRandomBoolean();
      const result = createResultScalar({ value });

      expect(result).toEqual({
        entityType: "scalar",
        value,
      } satisfies ResultScalar);
    });

    it("should create a date scalar", () => {
      const date = new Date("2023-12-25T10:30:00Z");
      const result = createResultScalar({ value: date });

      expect(result).toEqual({
        entityType: "scalar",
        value: date,
      } satisfies ResultScalar);
    });
  });

  describe("createTypedValue", () => {
    it("should return type 'null'", () => {
      expect(createTypedValue(null)).toEqual({
        type: "null",
        value: null,
      });
    });

    it("should return type 'string'", () => {
      expect(createTypedValue("hello world")).toEqual({
        type: "string",
        value: "hello world",
      });
    });

    it("should return type 'number' for integer", () => {
      const value = createRandomInteger();
      expect(createTypedValue(value)).toEqual({
        type: "number",
        value: value,
      });
    });

    it("should return type 'number' for double", () => {
      const value = createRandomDouble();
      expect(createTypedValue(value)).toEqual({
        type: "number",
        value: value,
      });
    });

    it("should return type 'boolean'", () => {
      const value = createRandomBoolean();
      expect(createTypedValue(value)).toEqual({
        type: "boolean",
        value,
      });
    });

    it("should return type 'date'", () => {
      const date = new Date("2023-12-25T10:30:00Z");
      expect(createTypedValue(date)).toEqual({
        type: "date",
        value: date,
      });
    });
  });

  describe("getDisplayValueForScalar", () => {
    it("should return null for null scalar", () => {
      const result = getDisplayValueForScalar(null);
      expect(result).toBe(LABELS.MISSING_VALUE);
    });

    it("should return string for string scalar", () => {
      const result = getDisplayValueForScalar("hello world");
      expect(result).toBe("hello world");
    });

    it("should return EMPTY_VALUE for empty string scalar", () => {
      const result = getDisplayValueForScalar("   ");
      expect(result).toBe(LABELS.EMPTY_VALUE);
    });

    it("should return number formatted", () => {
      // Large integers
      expect(getDisplayValueForScalar(123456)).toBe("123,456");
      expect(getDisplayValueForScalar(1234567)).toBe("1,234,567");
      expect(getDisplayValueForScalar(12345678)).toBe("12,345,678");
      expect(getDisplayValueForScalar(123456789)).toBe("123,456,789");
      expect(getDisplayValueForScalar(1234567890)).toBe("1.235E9");
      expect(getDisplayValueForScalar(12345678901)).toBe("1.235E10");
      expect(getDisplayValueForScalar(123456789012)).toBe("1.235E11");

      // Small floats
      expect(getDisplayValueForScalar(0.123456789)).toBe("0.1235");
      expect(getDisplayValueForScalar(0.0123456789)).toBe("0.0123");
      expect(getDisplayValueForScalar(0.00123456789)).toBe("0.0012");
      expect(getDisplayValueForScalar(0.000123456789)).toBe("1.235E-4");
      expect(getDisplayValueForScalar(0.0000123456789)).toBe("1.235E-5");
      expect(getDisplayValueForScalar(0.00000123456789)).toBe("1.235E-6");
      expect(getDisplayValueForScalar(0.000000123456789)).toBe("1.235E-7");
      expect(getDisplayValueForScalar(0.0000000123456789)).toBe("1.235E-8");
      expect(getDisplayValueForScalar(0.00000000123456789)).toBe("1.235E-9");

      // Large floats
      expect(getDisplayValueForScalar(123456.123456789)).toBe("123,456.1235");
      expect(getDisplayValueForScalar(1234567.0123456789)).toBe(
        "1,234,567.0123",
      );
      // eslint-disable-next-line no-loss-of-precision
      expect(getDisplayValueForScalar(12345678.00123456789)).toBe(
        "12,345,678.0012",
      );
      // eslint-disable-next-line no-loss-of-precision
      expect(getDisplayValueForScalar(123456789.000123456789)).toBe(
        "123,456,789.0001",
      );
      // eslint-disable-next-line no-loss-of-precision
      expect(getDisplayValueForScalar(1234567890.0000123456789)).toBe(
        "1.235E9",
      );
      // eslint-disable-next-line no-loss-of-precision
      expect(getDisplayValueForScalar(12345678901.00000123456789)).toBe(
        "1.235E10",
      );
      // eslint-disable-next-line no-loss-of-precision
      expect(getDisplayValueForScalar(123456789012.000000123456789)).toBe(
        "1.235E11",
      );
      // eslint-disable-next-line no-loss-of-precision
      expect(getDisplayValueForScalar(1234567890123.0000000123456789)).toBe(
        "1.235E12",
      );
    });

    it("should return number for double scalar", () => {
      const result = getDisplayValueForScalar(123.45);
      expect(result).toBe("123.45");
    });

    it("should truncate to 4 fraction digits", () => {
      const result = getDisplayValueForScalar(1.123456789);
      expect(result).toBe("1.1235");
    });

    it("should use scientific notation for very small numbers", () => {
      const result = getDisplayValueForScalar(0.0001);
      expect(result).toBe("1E-4");
    });

    it("should use scientific notation for very large numbers", () => {
      const result = getDisplayValueForScalar(1e10);
      expect(result).toBe("1E10");
    });

    it("should use standard notation at the small threshold boundary", () => {
      const result = getDisplayValueForScalar(0.001);
      expect(result).toBe("0.001");
    });

    it("should use standard notation at the large threshold boundary", () => {
      const result = getDisplayValueForScalar(1e9);
      expect(result).toBe("1,000,000,000");
    });

    it("should use scientific notation for negative very small numbers", () => {
      const result = getDisplayValueForScalar(-0.00001);
      expect(result).toBe("-1E-5");
    });

    it("should use scientific notation for negative very large numbers", () => {
      const result = getDisplayValueForScalar(-1e11);
      expect(result).toBe("-1E11");
    });

    it("should format zero without scientific notation", () => {
      expect(getDisplayValueForScalar(0)).toBe("0");
      expect(getDisplayValueForScalar(0.0)).toBe("0");
      expect(getDisplayValueForScalar(parseFloat("0.00"))).toBe("0");
    });

    it("should return boolean for boolean scalar", () => {
      const result = getDisplayValueForScalar(true);
      expect(result).toBe("true");
    });

    it("should return date for date scalar", () => {
      const result = getDisplayValueForScalar(new Date("2023-12-25T10:30:00Z"));
      expect(result).toBe("Dec 25 2023, 10:30 AM");
    });
  });
});
