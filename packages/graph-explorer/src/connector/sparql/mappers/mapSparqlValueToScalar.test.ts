import { describe, test, expect } from "vitest";
import { mapSparqlValueToScalar } from "./mapSparqlValueToScalar";
import { SparqlValue } from "../types";

describe("mapSparqlValueToScalar", () => {
  describe("URI values", () => {
    test("should return URI value as string", () => {
      const sparqlValue: SparqlValue = {
        type: "uri",
        value: "http://example.org/person/john",
      };

      const result = mapSparqlValueToScalar(sparqlValue);

      expect(result).toBe("http://example.org/person/john");
    });
  });

  describe("blank node values", () => {
    test("should return blank node value as string", () => {
      const sparqlValue: SparqlValue = {
        type: "bnode",
        value: "_:b1",
      };

      const result = mapSparqlValueToScalar(sparqlValue);

      expect(result).toBe("_:b1");
    });
  });

  describe("plain literals", () => {
    test("should return plain literal without datatype as string", () => {
      const sparqlValue: SparqlValue = {
        type: "literal",
        value: "John Doe",
      };

      const result = mapSparqlValueToScalar(sparqlValue);

      expect(result).toBe("John Doe");
    });

    test("should return plain literal with language tag as string", () => {
      const sparqlValue: SparqlValue = {
        type: "literal",
        value: "Hello",
        "xml:lang": "en",
      };

      const result = mapSparqlValueToScalar(sparqlValue);

      expect(result).toBe("Hello");
    });
  });

  describe("integer literals", () => {
    test("should parse XMLSchema#integer to number", () => {
      const sparqlValue: SparqlValue = {
        type: "literal",
        value: "42",
        datatype: "http://www.w3.org/2001/XMLSchema#integer",
      };

      const result = mapSparqlValueToScalar(sparqlValue);

      expect(result).toBe(42);
      expect(typeof result).toBe("number");
    });

    test("should parse XMLSchema#int to number", () => {
      const sparqlValue: SparqlValue = {
        type: "literal",
        value: "123",
        datatype: "http://www.w3.org/2001/XMLSchema#int",
      };

      const result = mapSparqlValueToScalar(sparqlValue);

      expect(result).toBe(123);
    });

    test("should parse XMLSchema#long to number", () => {
      const sparqlValue: SparqlValue = {
        type: "literal",
        value: "9876543210",
        datatype: "http://www.w3.org/2001/XMLSchema#long",
      };

      const result = mapSparqlValueToScalar(sparqlValue);

      expect(result).toBe(9876543210);
    });

    test("should handle negative integers", () => {
      const sparqlValue: SparqlValue = {
        type: "literal",
        value: "-42",
        datatype: "http://www.w3.org/2001/XMLSchema#integer",
      };

      const result = mapSparqlValueToScalar(sparqlValue);

      expect(result).toBe(-42);
    });

    test("should handle zero", () => {
      const sparqlValue: SparqlValue = {
        type: "literal",
        value: "0",
        datatype: "http://www.w3.org/2001/XMLSchema#integer",
      };

      const result = mapSparqlValueToScalar(sparqlValue);

      expect(result).toBe(0);
    });
  });

  describe("decimal and float literals", () => {
    test("should parse XMLSchema#decimal to number", () => {
      const sparqlValue: SparqlValue = {
        type: "literal",
        value: "3.14159",
        datatype: "http://www.w3.org/2001/XMLSchema#decimal",
      };

      const result = mapSparqlValueToScalar(sparqlValue);

      expect(result).toBe(3.14159);
      expect(typeof result).toBe("number");
    });

    test("should parse XMLSchema#double to number", () => {
      const sparqlValue: SparqlValue = {
        type: "literal",
        value: "2.718281828",
        datatype: "http://www.w3.org/2001/XMLSchema#double",
      };

      const result = mapSparqlValueToScalar(sparqlValue);

      expect(result).toBe(2.718281828);
    });

    test("should parse XMLSchema#float to number", () => {
      const sparqlValue: SparqlValue = {
        type: "literal",
        value: "1.23",
        datatype: "http://www.w3.org/2001/XMLSchema#float",
      };

      const result = mapSparqlValueToScalar(sparqlValue);

      expect(result).toBe(1.23);
    });

    test("should handle negative decimals", () => {
      const sparqlValue: SparqlValue = {
        type: "literal",
        value: "-3.14",
        datatype: "http://www.w3.org/2001/XMLSchema#decimal",
      };

      const result = mapSparqlValueToScalar(sparqlValue);

      expect(result).toBe(-3.14);
    });

    test("should handle scientific notation", () => {
      const sparqlValue: SparqlValue = {
        type: "literal",
        value: "1.23e-4",
        datatype: "http://www.w3.org/2001/XMLSchema#double",
      };

      const result = mapSparqlValueToScalar(sparqlValue);

      expect(result).toBe(0.000123);
    });
  });

  describe("boolean literals", () => {
    test("should parse 'true' to boolean true", () => {
      const sparqlValue: SparqlValue = {
        type: "literal",
        value: "true",
        datatype: "http://www.w3.org/2001/XMLSchema#boolean",
      };

      const result = mapSparqlValueToScalar(sparqlValue);

      expect(result).toBe(true);
      expect(typeof result).toBe("boolean");
    });

    test("should parse 'false' to boolean false", () => {
      const sparqlValue: SparqlValue = {
        type: "literal",
        value: "false",
        datatype: "http://www.w3.org/2001/XMLSchema#boolean",
      };

      const result = mapSparqlValueToScalar(sparqlValue);

      expect(result).toBe(false);
      expect(typeof result).toBe("boolean");
    });

    test("should parse '1' to boolean true", () => {
      const sparqlValue: SparqlValue = {
        type: "literal",
        value: "1",
        datatype: "http://www.w3.org/2001/XMLSchema#boolean",
      };

      const result = mapSparqlValueToScalar(sparqlValue);

      expect(result).toBe(true);
      expect(typeof result).toBe("boolean");
    });

    test("should parse '0' to boolean false", () => {
      const sparqlValue: SparqlValue = {
        type: "literal",
        value: "0",
        datatype: "http://www.w3.org/2001/XMLSchema#boolean",
      };

      const result = mapSparqlValueToScalar(sparqlValue);

      expect(result).toBe(false);
      expect(typeof result).toBe("boolean");
    });
  });

  describe("date and dateTime literals", () => {
    test("should parse XMLSchema#dateTime to Date object", () => {
      const sparqlValue: SparqlValue = {
        type: "literal",
        value: "2023-12-25T10:30:00Z",
        datatype: "http://www.w3.org/2001/XMLSchema#dateTime",
      };

      const result = mapSparqlValueToScalar(sparqlValue);

      expect(result).toBeInstanceOf(Date);
      expect(result).toEqual(new Date("2023-12-25T10:30:00Z"));
    });

    test("should parse XMLSchema#date to Date object", () => {
      const sparqlValue: SparqlValue = {
        type: "literal",
        value: "2023-12-25",
        datatype: "http://www.w3.org/2001/XMLSchema#date",
      };

      const result = mapSparqlValueToScalar(sparqlValue);

      expect(result).toBeInstanceOf(Date);
      expect(result).toEqual(new Date("2023-12-25"));
    });

    test("should handle dateTime with timezone offset", () => {
      const sparqlValue: SparqlValue = {
        type: "literal",
        value: "2023-12-25T10:30:00+02:00",
        datatype: "http://www.w3.org/2001/XMLSchema#dateTime",
      };

      const result = mapSparqlValueToScalar(sparqlValue);

      expect(result).toBeInstanceOf(Date);
      expect(result).toEqual(new Date("2023-12-25T10:30:00+02:00"));
    });
  });

  describe("unknown datatypes", () => {
    test("should return unknown datatype as string", () => {
      const sparqlValue: SparqlValue = {
        type: "literal",
        value: "custom-value",
        datatype: "http://example.org/customType",
      };

      const result = mapSparqlValueToScalar(sparqlValue);

      expect(result).toBe("custom-value");
      expect(typeof result).toBe("string");
    });

    test("should return empty datatype as string", () => {
      const sparqlValue: SparqlValue = {
        type: "literal",
        value: "some-value",
        datatype: "",
      };

      const result = mapSparqlValueToScalar(sparqlValue);

      expect(result).toBe("some-value");
    });
  });

  describe("edge cases", () => {
    test("should handle empty string values", () => {
      const sparqlValue: SparqlValue = {
        type: "literal",
        value: "",
      };

      const result = mapSparqlValueToScalar(sparqlValue);

      expect(result).toBe("");
    });

    test("should handle invalid integer strings as NaN", () => {
      const sparqlValue: SparqlValue = {
        type: "literal",
        value: "not-a-number",
        datatype: "http://www.w3.org/2001/XMLSchema#integer",
      };

      const result = mapSparqlValueToScalar(sparqlValue);

      expect(result).toBeNaN();
    });

    test("should handle invalid float strings as NaN", () => {
      const sparqlValue: SparqlValue = {
        type: "literal",
        value: "not-a-float",
        datatype: "http://www.w3.org/2001/XMLSchema#decimal",
      };

      const result = mapSparqlValueToScalar(sparqlValue);

      expect(result).toBeNaN();
    });

    test("should handle invalid date strings", () => {
      const sparqlValue: SparqlValue = {
        type: "literal",
        value: "not-a-date",
        datatype: "http://www.w3.org/2001/XMLSchema#dateTime",
      };

      const result = mapSparqlValueToScalar(sparqlValue);

      expect(result).toBeInstanceOf(Date);
      expect(result!.toString()).toBe("Invalid Date");
    });
  });
});
