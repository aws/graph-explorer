import {
  assertRepresentable,
  QueryValueError,
  UnescapableValueError,
  UnrepresentableNumberError,
  UnrepresentableStringError,
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

describe("UnescapableValueError", () => {
  it("carries the language, position, value, and unescapable characters", () => {
    const error = new UnescapableValueError("sparql", "IRI", "a b>c", [
      " ",
      ">",
    ]);

    expect(error.language).toBe("sparql");
    expect(error.position).toBe("IRI");
    expect(error.value).toBe("a b>c");
    expect(error.unescapableCharacters).toStrictEqual([" ", ">"]);
  });

  it("is an Error and a QueryValueError, but not an UnrepresentableValueError", () => {
    const error = new UnescapableValueError("sparql", "IRI", "a b", [" "]);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(QueryValueError);
    expect(error).not.toBeInstanceOf(UnrepresentableValueError);
  });

  it("names itself after the subclass", () => {
    expect(new UnescapableValueError("sparql", "IRI", "a b", [" "]).name).toBe(
      "UnescapableValueError",
    );
  });

  it("derives a message that names the language and position", () => {
    const error = new UnescapableValueError("sparql", "IRI", "a b", [" "]);

    expect(error.message).toContain("sparql");
    expect(error.message).toContain("IRI");
    expect(error.message).toContain("characters that cannot be represented");
  });

  it("exposes the unescapable characters as sorted codepoint labels in details", () => {
    const error = new UnescapableValueError("sparql", "IRI", "a b>c", [
      " ",
      ">",
    ]);

    expect(error.details).toStrictEqual({
      language: "sparql",
      position: "IRI",
      value: "a b>c",
      unescapableCharacters: ["U+0020", "U+003E"],
    });
  });

  it("dedupes and sorts the unescapable characters by codepoint", () => {
    const error = new UnescapableValueError("sparql", "IRI", "a b>c", [
      ">",
      " ",
      ">",
    ]);

    expect(error.details).toStrictEqual({
      language: "sparql",
      position: "IRI",
      value: "a b>c",
      unescapableCharacters: ["U+0020", "U+003E"],
    });
  });

  it("preserves the full value verbatim in details, including control characters", () => {
    const value = "line\u0001\nend";
    const error = new UnescapableValueError("sparql", "IRI", value, [
      "\u0001",
      "\n",
    ]);

    expect(error.details).toStrictEqual({
      language: "sparql",
      position: "IRI",
      value,
      unescapableCharacters: ["U+0001", "U+000A"],
    });
  });
});

describe("assertRepresentable", () => {
  it.each([
    ["a lone high surrogate", "a\uD800b"],
    ["a lone low surrogate", "a\uDC00b"],
    ["a NUL mid-string", "a\0b"],
    ["a NUL alone", "\0"],
  ])("throws UnrepresentableStringError for %s", (_, value) => {
    expect(() => assertRepresentable(value)).toThrow(
      UnrepresentableStringError,
    );
  });

  it.each([
    ["a valid surrogate pair", "a😀b"],
    ["a plain control character", "a\u0001b"],
    ["an empty string", ""],
    ["ordinary text", "hello"],
  ])("does not throw for %s", (_, value) => {
    expect(() => assertRepresentable(value)).not.toThrow();
  });

  it("carries the offending value on the error", () => {
    const value = "a\0b";
    const error = new UnrepresentableStringError(value);

    expect(error.value).toBe(value);
    expect(error.details).toStrictEqual({ value });
  });
});
