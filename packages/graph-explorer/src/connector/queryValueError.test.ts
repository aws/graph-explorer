import { QueryValueError, UnsupportedValueTypeError } from "./queryValueError";

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
