import {
  createRandomBoolean,
  createRandomDouble,
  createRandomInteger,
} from "@shared/utils/testing";
import { createScalar, getDisplayValueForScalar, Scalar } from "./scalar";
import { MISSING_DISPLAY_VALUE } from "@/utils";

describe("scalar", () => {
  describe("createScalar", () => {
    it("should create a null scalar", () => {
      const result = createScalar({ value: null });

      expect(result).toEqual({
        entityType: "scalar",
        type: "null",
        value: null,
      } satisfies Scalar);
    });

    it("should create a string scalar", () => {
      const result = createScalar({ value: "hello world" });

      expect(result).toEqual({
        entityType: "scalar",
        type: "string",
        value: "hello world",
      } satisfies Scalar);
    });

    it("should create a string scalar from empty string", () => {
      const result = createScalar({ value: "" });

      expect(result).toEqual({
        entityType: "scalar",
        type: "string",
        value: "",
      } satisfies Scalar);
    });

    it("should create a number scalar from integer", () => {
      const value = createRandomInteger();
      const result = createScalar({ value });

      expect(result).toEqual({
        entityType: "scalar",
        type: "number",
        value: value,
      } satisfies Scalar);
    });

    it("should create a number scalar from double", () => {
      const value = createRandomDouble();
      const result = createScalar({ value });

      expect(result).toEqual({
        entityType: "scalar",
        type: "number",
        value: value,
      } satisfies Scalar);
    });

    it("should create a number scalar from zero", () => {
      const result = createScalar({ value: 0 });

      expect(result).toEqual({
        entityType: "scalar",
        type: "number",
        value: 0,
      } satisfies Scalar);
    });

    it("should create a number scalar from negative number", () => {
      const result = createScalar({ value: -100 });

      expect(result).toEqual({
        entityType: "scalar",
        type: "number",
        value: -100,
      } satisfies Scalar);
    });

    it("should create a boolean scalar", () => {
      const value = createRandomBoolean();
      const result = createScalar({ value });

      expect(result).toEqual({
        entityType: "scalar",
        type: "boolean",
        value,
      } satisfies Scalar);
    });

    it("should create a date scalar", () => {
      const date = new Date("2023-12-25T10:30:00Z");
      const result = createScalar({ value: date });

      expect(result).toEqual({
        entityType: "scalar",
        type: "date",
        value: date,
      } satisfies Scalar);
    });
  });

  describe("getDisplayValueForScalar", () => {
    it("should return null for null scalar", () => {
      const scalar = createScalar({ value: null });

      const result = getDisplayValueForScalar(scalar);

      expect(result).toBe(MISSING_DISPLAY_VALUE);
    });

    it("should return string for string scalar", () => {
      const scalar = createScalar({ value: "hello world" });

      const result = getDisplayValueForScalar(scalar);

      expect(result).toBe("hello world");
    });

    it("should return number for integer scalar", () => {
      const scalar = createScalar({ value: 123456 });

      const result = getDisplayValueForScalar(scalar);

      expect(result).toBe("123,456");
    });

    it("should return number for double scalar", () => {
      const scalar = createScalar({ value: 123.45 });

      const result = getDisplayValueForScalar(scalar);

      expect(result).toBe("123.45");
    });

    it("should return boolean for boolean scalar", () => {
      const scalar = createScalar({ value: true });

      const result = getDisplayValueForScalar(scalar);

      expect(result).toBe("true");
    });

    it("should return date for date scalar", () => {
      const date = new Date("2023-12-25T10:30:00Z");
      const scalar = createScalar({ value: date });

      const result = getDisplayValueForScalar(scalar);

      expect(result).toBe("Dec 25 2023, 10:30 AM");
    });
  });
});
