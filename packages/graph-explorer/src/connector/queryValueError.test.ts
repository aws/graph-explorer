import {
  QueryValueError,
  UnrepresentableNumberError,
  UnrepresentableValueError,
  UnsupportedValueTypeError,
} from "./queryValueError";

describe("UnsupportedValueTypeError", () => {
  it("carries the language, position, and original value", () => {
    const error = new UnsupportedValueTypeError("openCypher", "id", 124);

    expect(error.language).toBe("openCypher");
    expect(error.position).toBe("id");
    expect(error.value).toBe(124);
  });

  it("is an Error and a QueryValueError", () => {
    const error = new UnsupportedValueTypeError("openCypher", "id", 124);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(QueryValueError);
  });

  it("names itself after the subclass", () => {
    const error = new UnsupportedValueTypeError("openCypher", "id", 124);

    expect(error.name).toBe("UnsupportedValueTypeError");
  });

  it("preserves the original value type rather than stringifying it", () => {
    const error = new UnsupportedValueTypeError("sparql", "IRI", 124);

    expect(error.value).toBe(124);
    expect(typeof error.value).toBe("number");
  });

  it("derives a message that names the position and the offending type", () => {
    const error = new UnsupportedValueTypeError("openCypher", "id", 124);

    expect(error.message).toContain("id");
    expect(error.message).toContain("number");
  });

  it("exposes the language, position, and value type as details", () => {
    const error = new UnsupportedValueTypeError("sparql", "IRI", 124);

    expect(error.details).toStrictEqual({
      language: "sparql",
      position: "IRI",
      valueType: "number",
      value: 124,
    });
  });
});

describe("UnrepresentableNumberError", () => {
  it("is an Error, a QueryValueError, and an UnrepresentableValueError", () => {
    const error = new UnrepresentableNumberError(NaN);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(QueryValueError);
    expect(error).toBeInstanceOf(UnrepresentableValueError);
  });

  it("names itself after the subclass", () => {
    expect(new UnrepresentableNumberError(NaN).name).toBe(
      "UnrepresentableNumberError",
    );
  });

  it("preserves the original numeric value", () => {
    const error = new UnrepresentableNumberError(1e21);

    expect(error.value).toBe(1e21);
    expect(typeof error.value).toBe("number");
  });

  // NaN loses its identity through JSON, so it goes through its own assertion.
  it("preserves NaN", () => {
    expect(new UnrepresentableNumberError(NaN).value).toBeNaN();
  });

  it("derives a message that names the offending value's text form", () => {
    expect(new UnrepresentableNumberError(1e21).message).toContain("1e+21");
    expect(new UnrepresentableNumberError(Infinity).message).toContain(
      "Infinity",
    );
  });

  it("exposes the value and its text form as details", () => {
    expect(new UnrepresentableNumberError(1e21).details).toStrictEqual({
      value: 1e21,
      valueText: "1e+21",
    });
  });
});
