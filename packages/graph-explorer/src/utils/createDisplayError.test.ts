import { createDisplayError } from "./createDisplayError";

const defaultResult = {
  title: "Something went wrong",
  message: "An error occurred. Please try again.",
};

describe("createDisplayError", () => {
  it("Should handle empty object", () => {
    const result = createDisplayError({});
    expect(result).toStrictEqual(defaultResult);
  });

  it("Should handle null", () => {
    const result = createDisplayError(null);
    expect(result).toStrictEqual(defaultResult);
  });

  it("Should handle undefined", () => {
    const result = createDisplayError(undefined);
    expect(result).toStrictEqual(defaultResult);
  });

  it("Should handle string", () => {
    const result = createDisplayError("Some error message string");
    expect(result).toStrictEqual(defaultResult);
  });

  it("Should handle connection refused", () => {
    const result = createDisplayError({ code: "ECONNREFUSED" });
    expect(result).toStrictEqual({
      title: "Connection refused",
      message: "Please check your connection and try again.",
    });
  });

  it("Should handle connection refused as inner error", () => {
    const error = new Error("Some error message string", {
      cause: { code: "ECONNREFUSED" },
    });
    const result = createDisplayError(error);
    expect(result).toStrictEqual({
      title: "Connection refused",
      message: "Please check your connection and try again.",
    });
  });

  it("Should handle AbortError", () => {
    const result = createDisplayError({ name: "AbortError" });
    expect(result).toStrictEqual({
      title: "Request cancelled",
      message: "The request exceeded the configured timeout length.",
    });
  });

  it("Should handle deadline exceeded", () => {
    const result = createDisplayError({ code: "TimeLimitExceededException" });
    expect(result).toStrictEqual({
      title: "Deadline exceeded",
      message:
        "Increase the query timeout in the DB cluster parameter group, or retry the request.",
    });
  });
});
