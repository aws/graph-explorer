import {
  createRandomBoolean,
  createRandomDouble,
  createRandomInteger,
} from "@shared/utils/testing";
import {
  createScalar,
  createTypedValue,
  getDisplayValueForScalar,
  Scalar,
} from "./scalar";
import { MISSING_DISPLAY_VALUE } from "@/utils";

describe("scalar", () => {
  describe("createScalar", () => {
    it("should create a null scalar", () => {
      const result = createScalar({ value: null });

      expect(result).toEqual({
        entityType: "scalar",
        value: null,
      } satisfies Scalar);
    });

    it("should create a string scalar", () => {
      const result = createScalar({ value: "hello world" });

      expect(result).toEqual({
        entityType: "scalar",
        value: "hello world",
      } satisfies Scalar);
    });

    it("should create a string scalar from empty string", () => {
      const result = createScalar({ value: "" });

      expect(result).toEqual({
        entityType: "scalar",
        value: "",
      } satisfies Scalar);
    });

    it("should create a number scalar from integer", () => {
      const value = createRandomInteger();
      const result = createScalar({ value });

      expect(result).toEqual({
        entityType: "scalar",
        value: value,
      } satisfies Scalar);
    });

    it("should create a number scalar from double", () => {
      const value = createRandomDouble();
      const result = createScalar({ value });

      expect(result).toEqual({
        entityType: "scalar",
        value: value,
      } satisfies Scalar);
    });

    it("should create a number scalar from zero", () => {
      const result = createScalar({ value: 0 });

      expect(result).toEqual({
        entityType: "scalar",
        value: 0,
      } satisfies Scalar);
    });

    it("should create a number scalar from negative number", () => {
      const result = createScalar({ value: -100 });

      expect(result).toEqual({
        entityType: "scalar",
        value: -100,
      } satisfies Scalar);
    });

    it("should create a boolean scalar", () => {
      const value = createRandomBoolean();
      const result = createScalar({ value });

      expect(result).toEqual({
        entityType: "scalar",
        value,
      } satisfies Scalar);
    });

    it("should create a date scalar", () => {
      const date = new Date("2023-12-25T10:30:00Z");
      const result = createScalar({ value: date });

      expect(result).toEqual({
        entityType: "scalar",
        value: date,
      } satisfies Scalar);
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
      expect(result).toBe(MISSING_DISPLAY_VALUE);
    });

    it("should return string for string scalar", () => {
      const result = getDisplayValueForScalar("hello world");
      expect(result).toBe("hello world");
    });

    it("should return number for integer scalar", () => {
      const result = getDisplayValueForScalar(123456);
      expect(result).toBe("123,456");
    });

    it("should return number for double scalar", () => {
      const result = getDisplayValueForScalar(123.45);
      expect(result).toBe("123.45");
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
