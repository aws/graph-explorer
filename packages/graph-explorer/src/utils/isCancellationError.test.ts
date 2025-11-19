import { isCancellationError } from "./isCancellationError";
import { NetworkError } from "./NetworkError";
import { createCancelledError } from "./testing";

describe("isCancellationError", () => {
  it("should return true for AbortError", () => {
    const controller = new AbortController();
    controller.abort();
    const error = controller.signal.reason;
    expect(isCancellationError(error)).toBe(true);
  });

  it("should return true for CanceledError", async () => {
    const error = await createCancelledError();
    expect(isCancellationError(error)).toBe(true);
  });

  it("should return false for object", () => {
    expect(isCancellationError({})).toBe(false);
  });

  it("should return false for null", () => {
    expect(isCancellationError(null)).toBe(false);
  });

  it("should return false for undefined", () => {
    expect(isCancellationError(undefined)).toBe(false);
  });

  it("should return false for empty string", () => {
    expect(isCancellationError("")).toBe(false);
  });

  it("should return false for string", () => {
    expect(isCancellationError("AbortError")).toBe(false);
    expect(isCancellationError("CancelledError")).toBe(false);
  });

  it("should return false for other errors", () => {
    expect(isCancellationError(new Error())).toBe(false);
    expect(isCancellationError(new TypeError())).toBe(false);
    expect(isCancellationError(new SyntaxError())).toBe(false);
    expect(isCancellationError(new RangeError())).toBe(false);
    expect(isCancellationError(new ReferenceError())).toBe(false);
    expect(isCancellationError(new EvalError())).toBe(false);
    expect(isCancellationError(new URIError())).toBe(false);
    expect(isCancellationError(new DOMException())).toBe(false);
    expect(isCancellationError(new NetworkError("Test", 500, null))).toBe(
      false,
    );
  });
});
