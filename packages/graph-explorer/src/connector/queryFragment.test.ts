import { InvalidFragmentValueError } from "./queryFragment";

describe("InvalidFragmentValueError.unsupportedType", () => {
  it("carries the language, position, reason, and original value", () => {
    const error = InvalidFragmentValueError.unsupportedType(
      "openCypher",
      "id",
      124,
    );

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("InvalidFragmentValueError");
    expect(error.language).toBe("openCypher");
    expect(error.position).toBe("id");
    expect(error.reason).toBe("unsupported-type");
    expect(error.value).toBe(124);
  });

  it("preserves the original value type rather than stringifying it", () => {
    const error = InvalidFragmentValueError.unsupportedType(
      "sparql",
      "IRI",
      124,
    );

    expect(error.value).toBe(124);
    expect(typeof error.value).toBe("number");
  });

  it("derives a message that names the position and the offending type", () => {
    const error = InvalidFragmentValueError.unsupportedType(
      "openCypher",
      "id",
      124,
    );

    expect(error.message).toContain("id");
    expect(error.message).toContain("number");
  });
});
