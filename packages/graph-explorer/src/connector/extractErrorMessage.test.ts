import { extractErrorMessage } from "./extractErrorMessage";

describe("extractErrorMessage", () => {
  it("returns the string directly when error is a string", () => {
    expect(extractErrorMessage("something broke")).toBe("something broke");
  });

  it("extracts detailedMessage first", () => {
    expect(
      extractErrorMessage({
        detailedMessage: "detailed info",
        message: "short info",
      }),
    ).toBe("detailed info");
  });

  it("extracts message when detailedMessage is absent", () => {
    expect(extractErrorMessage({ message: "error occurred" })).toBe(
      "error occurred",
    );
  });

  it("extracts description when message is absent", () => {
    expect(extractErrorMessage({ description: "something went wrong" })).toBe(
      "something went wrong",
    );
  });

  it("extracts error string when other fields are absent", () => {
    expect(extractErrorMessage({ error: "bad request" })).toBe("bad request");
  });

  it("skips empty strings", () => {
    expect(extractErrorMessage({ message: "", description: "fallback" })).toBe(
      "fallback",
    );
  });

  it("skips non-string values", () => {
    expect(
      extractErrorMessage({ message: 42, description: "actual message" }),
    ).toBe("actual message");
  });

  it("returns undefined for null", () => {
    expect(extractErrorMessage(null)).toBeUndefined();
  });

  it("returns undefined for undefined", () => {
    expect(extractErrorMessage(undefined)).toBeUndefined();
  });

  it("returns undefined for an object with no recognized keys", () => {
    expect(extractErrorMessage({ code: "ERR_SOMETHING" })).toBeUndefined();
  });

  it("returns undefined for a number", () => {
    expect(extractErrorMessage(42)).toBeUndefined();
  });
});
