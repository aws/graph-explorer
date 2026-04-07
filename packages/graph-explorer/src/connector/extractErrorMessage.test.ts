import { extractErrorMessage } from "./extractErrorMessage";

describe("extractErrorMessage", () => {
  it("returns the string directly when error is a string", () => {
    expect(extractErrorMessage("something broke")).toBe("something broke");
  });

  it("returns an empty string as-is", () => {
    expect(extractErrorMessage("")).toBe("");
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

  it.each([
    { message: "", description: "fallback" },
    { message: null, description: "fallback" },
    { message: 42, description: "fallback" },
    { message: { text: "nested" }, description: "fallback" },
    { message: ["a", "b"], error: "fallback" },
  ])("skips non-string message and falls back: %o", input => {
    expect(extractErrorMessage(input)).toBe("fallback");
  });

  it("skips all empty string fields and returns undefined", () => {
    expect(
      extractErrorMessage({
        detailedMessage: "",
        message: "",
        description: "",
        error: "",
      }),
    ).toBeUndefined();
  });

  it.each([
    null,
    undefined,
    42,
    0,
    -1,
    true,
    false,
    {},
    [],
    { code: "ERR_SOMETHING" },
    { detail: "ignored" },
    { inner: { message: "nested" } },
  ])("returns undefined for: %p", input => {
    expect(extractErrorMessage(input)).toBeUndefined();
  });
});
