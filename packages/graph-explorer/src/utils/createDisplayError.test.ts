import { z } from "zod";

import { createDisplayError } from "./createDisplayError";
import { NetworkError } from "./NetworkError";
import { ServerConnectionError } from "./ServerConnectionError";
import { createCancelledError } from "./testing";

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

  it("Should handle connection reset", () => {
    const result = createDisplayError({ code: "ECONNRESET" });
    expect(result).toStrictEqual({
      title: "Connection reset",
      message: "Please check your connection and try again.",
    });
  });

  it("Should handle connection refused as inner error", () => {
    const error = new NetworkError("Some error message string", 500, {
      cause: { code: "ECONNREFUSED" },
    });
    const result = createDisplayError(error);
    expect(result).toStrictEqual({
      title: "Connection refused",
      message: "Please check your connection and try again.",
    });
  });

  it("Should handle connection reset as inner error", () => {
    const error = new NetworkError("Some error message string", 500, {
      cause: { code: "ECONNRESET" },
    });
    const result = createDisplayError(error);
    expect(result).toStrictEqual({
      title: "Connection reset",
      message: "Please check your connection and try again.",
    });
  });

  it("should handle cancelled error", async () => {
    const error = await createCancelledError();
    const result = createDisplayError(error);
    expect(result).toStrictEqual({
      title: "Request cancelled",
      message:
        "The request exceeded the configured timeout length or was cancelled by the user.",
    });
  });

  it("Should handle AbortError", () => {
    const controller = new AbortController();
    controller.abort();
    const error = controller.signal.reason;
    const result = createDisplayError(error);
    expect(result).toStrictEqual({
      title: "Request cancelled",
      message:
        "The request exceeded the configured timeout length or was cancelled by the user.",
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

  it("Should handle malformed query", () => {
    const result = createDisplayError({ code: "MalformedQueryException" });
    expect(result).toStrictEqual({
      title: "Malformed Query",
      message:
        "The executed query was rejected by the database. It is possible the query structure is not supported by your database.",
    });
  });

  it("Should handle TimeoutError", () => {
    const result = createDisplayError(
      new FakeError("TimeoutError", "Timed out"),
    );
    expect(result).toStrictEqual({
      title: "Fetch Timeout Exceeded",
      message: "The request exceeded the configured fetch timeout.",
    });
  });

  it("Should handle server connection error", () => {
    const result = createDisplayError(
      new ServerConnectionError(
        "http://localhost:8182/query",
        new TypeError("Failed to fetch"),
      ),
    );
    expect(result).toStrictEqual({
      title: "Connection Error",
      message:
        "Unable to reach the proxy server. This is typically caused by the proxy server not running, an incorrect connection URL, or a CORS configuration issue.",
    });
  });

  it("Should handle server connection error with origin mismatch", () => {
    const result = createDisplayError(
      new ServerConnectionError(
        "https://other-host:8182/query",
        new TypeError("Failed to fetch"),
      ),
    );
    expect(result).toStrictEqual({
      title: "Cross-Origin Request Blocked",
      message:
        "The proxy server URL does not match the browser's origin, which can cause CORS errors. Update the connection URL to match the browser's origin.",
    });
  });

  it("Should not report origin mismatch for localhost with different ports", () => {
    const result = createDisplayError(
      new ServerConnectionError(
        "http://localhost:9999/query",
        new TypeError("Failed to fetch"),
      ),
    );
    expect(result).toStrictEqual({
      title: "Connection Error",
      message:
        "Unable to reach the proxy server. This is typically caused by the proxy server not running, an incorrect connection URL, or a CORS configuration issue.",
    });
  });

  it("Should not report origin mismatch for 127.0.0.1 with different ports", () => {
    const result = createDisplayError(
      new ServerConnectionError(
        "http://127.0.0.1:9999/query",
        new TypeError("Failed to fetch"),
      ),
    );
    expect(result).toStrictEqual({
      title: "Connection Error",
      message:
        "Unable to reach the proxy server. This is typically caused by the proxy server not running, an incorrect connection URL, or a CORS configuration issue.",
    });
  });

  it("Should handle too many requests error", () => {
    const result = createDisplayError(
      new NetworkError("Network error", 429, null),
    );
    expect(result).toStrictEqual({
      title: "Too Many Requests",
      message:
        "Requests are currently being throttled. Please try again later.",
    });
  });

  it("Should handle network error", () => {
    const result = createDisplayError(
      new NetworkError("Network error", 500, { message: "Some error" }),
    );
    expect(result).toStrictEqual({
      title: "Network Response 500",
      message: "Some error",
    });
  });

  it("Should handle network error with no data", () => {
    const result = createDisplayError(
      new NetworkError("Network error", 500, undefined),
    );
    expect(result).toStrictEqual({
      title: "Network Response 500",
      message: "An error occurred. Please try again.",
    });
  });

  it("Should handle zod validation errors", () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const result = createDisplayError(
      schema.safeParse({ nameWrong: "Bob", ageWrong: 42 }).error,
    );
    expect(result).toStrictEqual({
      title: "Unrecognized Result Format",
      message: "The data returned did not match the expected format.",
    });
  });
});

/** Used to create errors for test code. */
class FakeError extends Error {
  constructor(name: string, message: string) {
    super(message);
    this.name = name;
  }
}
