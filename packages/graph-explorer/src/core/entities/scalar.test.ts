import {
  createRandomBoolean,
  createRandomDouble,
  createRandomInteger,
} from "@shared/utils/testing";
import { createScalar, Scalar } from "./scalar";

describe("scalar", () => {
  describe("createScalar", () => {
    it("should create a null scalar", () => {
      const result = createScalar(null);

      expect(result).toEqual({
        entityType: "scalar",
        type: "null",
        value: null,
      } satisfies Scalar);
    });

    it("should create a string scalar", () => {
      const result = createScalar("hello world");

      expect(result).toEqual({
        entityType: "scalar",
        type: "string",
        value: "hello world",
      } satisfies Scalar);
    });

    it("should create a string scalar from empty string", () => {
      const result = createScalar("");

      expect(result).toEqual({
        entityType: "scalar",
        type: "string",
        value: "",
      } satisfies Scalar);
    });

    it("should create a number scalar from integer", () => {
      const value = createRandomInteger();
      const result = createScalar(value);

      expect(result).toEqual({
        entityType: "scalar",
        type: "number",
        value: value,
      } satisfies Scalar);
    });

    it("should create a number scalar from double", () => {
      const value = createRandomDouble();
      const result = createScalar(value);

      expect(result).toEqual({
        entityType: "scalar",
        type: "number",
        value: value,
      } satisfies Scalar);
    });

    it("should create a number scalar from zero", () => {
      const result = createScalar(0);

      expect(result).toEqual({
        entityType: "scalar",
        type: "number",
        value: 0,
      } satisfies Scalar);
    });

    it("should create a number scalar from negative number", () => {
      const result = createScalar(-100);

      expect(result).toEqual({
        entityType: "scalar",
        type: "number",
        value: -100,
      } satisfies Scalar);
    });

    it("should create a boolean scalar", () => {
      const value = createRandomBoolean();
      const result = createScalar(value);

      expect(result).toEqual({
        entityType: "scalar",
        type: "boolean",
        value,
      } satisfies Scalar);
    });

    it("should create a date scalar", () => {
      const date = new Date("2023-12-25T10:30:00Z");
      const result = createScalar(date);

      expect(result).toEqual({
        entityType: "scalar",
        type: "date",
        value: date,
      } satisfies Scalar);
    });
  });
});
