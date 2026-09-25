import { FetchTimeoutError } from "./FetchTimeoutError";

describe("FetchTimeoutError", () => {
  it("has the literal name FetchTimeoutError", () => {
    const error = new FetchTimeoutError(5000, new Error("aborted"));
    expect(error.name).toBe("FetchTimeoutError");
  });

  it("is an instance of Error and FetchTimeoutError", () => {
    const error = new FetchTimeoutError(5000, new Error("aborted"));
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(FetchTimeoutError);
  });

  it("builds a message from the timeout in milliseconds", () => {
    const error = new FetchTimeoutError(5000, new Error("aborted"));
    expect(error.message).toBe(
      "The request exceeded the fetch timeout of 5000 ms",
    );
  });

  it("exposes the timeout in milliseconds", () => {
    const error = new FetchTimeoutError(5000, new Error("aborted"));
    expect(error.timeoutMs).toBe(5000);
  });

  it("exposes the original error as the cause", () => {
    const cause = new Error("aborted");
    const error = new FetchTimeoutError(5000, cause);
    expect(error.cause).toBe(cause);
  });
});
