import { z } from "zod";

import { createErrorDetails } from "./createErrorDetails";
import { NetworkError } from "./NetworkError";
import { ServerConnectionError } from "./ServerConnectionError";

describe("createErrorDetails", () => {
  describe("Error instances", () => {
    it("returns name and message from a standard Error", () => {
      const error = new Error("something broke");
      expect(createErrorDetails(error)).toStrictEqual({
        name: "Error",
        message: "something broke",
      });
    });

    it("returns name and message from a TypeError", () => {
      const error = new TypeError("invalid type");
      expect(createErrorDetails(error)).toStrictEqual({
        name: "TypeError",
        message: "invalid type",
      });
    });

    it("returns name and message from a RangeError", () => {
      const error = new RangeError("out of range");
      expect(createErrorDetails(error)).toStrictEqual({
        name: "RangeError",
        message: "out of range",
      });
    });

    it("returns name and message from an Error with empty message", () => {
      const error = new Error("");
      expect(createErrorDetails(error)).toStrictEqual({
        name: "Error",
        message: "",
      });
    });

    it("returns name and message from an Error with a custom name", () => {
      const error = new Error("custom message");
      error.name = "CustomError";
      expect(createErrorDetails(error)).toStrictEqual({
        name: "CustomError",
        message: "custom message",
      });
    });

    it("includes cause as data when present", () => {
      const cause = new Error("connection refused");
      const error = new Error("Failed to fetch", { cause });
      const details = createErrorDetails(error);
      expect(details.name).toBe("Error");
      expect(details.message).toBe("Failed to fetch");
      expect(details.data).toBe(
        JSON.stringify({ name: cause.name, message: cause.message }, null, 2),
      );
    });

    it("includes nested cause chain as data", () => {
      const root = new Error("ECONNREFUSED");
      const mid = new Error("socket error", { cause: root });
      const error = new Error("request failed", { cause: mid });
      const details = createErrorDetails(error);
      expect(details.data).toBe(
        JSON.stringify(
          {
            name: mid.name,
            message: mid.message,
            cause: { name: root.name, message: root.message },
          },
          null,
          2,
        ),
      );
    });

    it("does not include data when cause is absent", () => {
      const error = new Error("simple error");
      expect(createErrorDetails(error)).toStrictEqual({
        name: "Error",
        message: "simple error",
      });
    });

    it("includes plain object cause as data", () => {
      const cause = { code: "ECONNREFUSED", address: "127.0.0.1", port: 8182 };
      const error = new Error("connect failed", { cause });
      expect(createErrorDetails(error)).toStrictEqual({
        name: "Error",
        message: "connect failed",
        data: JSON.stringify(cause, null, 2),
      });
    });

    it("includes code from Error cause when present", () => {
      const cause = new Error("connection refused");
      (cause as any).code = "ECONNREFUSED";
      const error = new Error("fetch failed", { cause });
      const details = createErrorDetails(error);
      expect(details.data).toBe(
        JSON.stringify(
          {
            name: "Error",
            message: "connection refused",
            code: "ECONNREFUSED",
          },
          null,
          2,
        ),
      );
    });
  });

  describe("ServerConnectionError", () => {
    it("includes the URL and cause in the data", () => {
      const cause = new TypeError("Failed to fetch");
      const error = new ServerConnectionError(
        "http://localhost:8182/query",
        cause,
      );
      expect(createErrorDetails(error)).toStrictEqual({
        name: "ServerConnectionError",
        message: "Unable to reach the server",
        data: JSON.stringify(
          {
            url: "http://localhost:8182/query",
            cause: { name: "TypeError", message: "Failed to fetch" },
          },
          null,
          2,
        ),
      });
    });
  });

  describe("NetworkError", () => {
    it("includes status code and standard status text in the name", () => {
      const error = new NetworkError("request failed", 500, null);
      expect(createErrorDetails(error)).toStrictEqual({
        name: "500 Internal Server Error",
        message: "request failed",
      });
    });

    it("shows standard status text for 400", () => {
      const error = new NetworkError("Missing header", 400, null);
      expect(createErrorDetails(error)).toStrictEqual({
        name: "400 Bad Request",
        message: "Missing header",
      });
    });

    it("shows standard status text for 401", () => {
      const error = new NetworkError("auth failed", 401, null);
      expect(createErrorDetails(error)).toStrictEqual({
        name: "401 Unauthorized",
        message: "auth failed",
      });
    });

    it("shows standard status text for 403", () => {
      const error = new NetworkError("access denied", 403, null);
      expect(createErrorDetails(error)).toStrictEqual({
        name: "403 Forbidden",
        message: "access denied",
      });
    });

    it("shows standard status text for 404", () => {
      const error = new NetworkError("not found", 404, null);
      expect(createErrorDetails(error)).toStrictEqual({
        name: "404 Not Found",
        message: "not found",
      });
    });

    it("shows standard status text for 408", () => {
      const error = new NetworkError("timed out", 408, null);
      expect(createErrorDetails(error)).toStrictEqual({
        name: "408 Request Timeout",
        message: "timed out",
      });
    });

    it("shows standard status text for 429", () => {
      const error = new NetworkError("throttled", 429, null);
      expect(createErrorDetails(error)).toStrictEqual({
        name: "429 Too Many Requests",
        message: "throttled",
      });
    });

    it("shows standard status text for 502", () => {
      const error = new NetworkError("bad gateway", 502, null);
      expect(createErrorDetails(error)).toStrictEqual({
        name: "502 Bad Gateway",
        message: "bad gateway",
      });
    });

    it("shows standard status text for 503", () => {
      const error = new NetworkError("unavailable", 503, null);
      expect(createErrorDetails(error)).toStrictEqual({
        name: "503 Service Unavailable",
        message: "unavailable",
      });
    });

    it("falls back to just the status code for non-standard codes", () => {
      const error = new NetworkError("something weird", 599, null);
      expect(createErrorDetails(error)).toStrictEqual({
        name: "599",
        message: "something weird",
      });
    });

    it("includes formatted data when NetworkError has extra data", () => {
      const data = {
        code: "MalformedQueryException",
        requestId: "abc-123",
        detailedMessage: "Syntax error at line 1",
      };
      const error = new NetworkError("Syntax error at line 1", 400, data);
      expect(createErrorDetails(error)).toStrictEqual({
        name: "400 Bad Request",
        message: "Syntax error at line 1",
        data: JSON.stringify(data, null, 2),
      });
    });

    it("does not include data when it is undefined", () => {
      const error = new NetworkError("failed", 500, undefined);
      expect(createErrorDetails(error)).toStrictEqual({
        name: "500 Internal Server Error",
        message: "failed",
      });
    });

    it("does not include data when it is null", () => {
      const error = new NetworkError("failed", 500, null);
      expect(createErrorDetails(error)).toStrictEqual({
        name: "500 Internal Server Error",
        message: "failed",
      });
    });

    it("includes data when it is a string", () => {
      const error = new NetworkError("failed", 500, "raw text");
      expect(createErrorDetails(error)).toStrictEqual({
        name: "500 Internal Server Error",
        message: "failed",
        data: '"raw text"',
      });
    });
  });

  describe("ZodError", () => {
    it("shows issues as formatted JSON in data", () => {
      const schema = z.object({ name: z.string() });
      const result = schema.safeParse({ name: 42 });
      assert(!result.success);

      const details = createErrorDetails(result.error);
      expect(details.name).toBe("ZodError");
      expect(details.data).toBe(JSON.stringify(result.error.issues, null, 2));
    });

    it("includes the error message", () => {
      const schema = z.object({ value: z.string() });
      const result = schema.safeParse({});
      assert(!result.success);

      const details = createErrorDetails(result.error);
      expect(details.message).toBe(result.error.message);
    });
  });

  describe("DOMException", () => {
    it("returns name and message from an AbortError", () => {
      const error = new DOMException("The operation was aborted", "AbortError");
      expect(createErrorDetails(error)).toStrictEqual({
        name: "AbortError",
        message: "The operation was aborted",
      });
    });

    it("returns name and message from a TimeoutError", () => {
      const error = new DOMException("Signal timed out", "TimeoutError");
      expect(createErrorDetails(error)).toStrictEqual({
        name: "TimeoutError",
        message: "Signal timed out",
      });
    });
  });

  describe("non-Error values", () => {
    it("returns 'Unknown Error' with JSON for a plain object", () => {
      const error = { code: "ECONNREFUSED" };
      expect(createErrorDetails(error)).toStrictEqual({
        name: "Unknown Error",
        message: JSON.stringify({ code: "ECONNREFUSED" }, null, 2),
      });
    });

    it("returns 'Unknown Error' with JSON for a string", () => {
      expect(createErrorDetails("some string")).toStrictEqual({
        name: "Unknown Error",
        message: '"some string"',
      });
    });

    it("returns 'Unknown Error' with 'null' for null", () => {
      expect(createErrorDetails(null)).toStrictEqual({
        name: "Unknown Error",
        message: "null",
      });
    });

    it("returns 'Unknown Error' with undefined message for undefined", () => {
      expect(createErrorDetails(undefined)).toStrictEqual({
        name: "Unknown Error",
        message: undefined,
      });
    });

    it("returns 'Unknown Error' with stringified number", () => {
      expect(createErrorDetails(42)).toStrictEqual({
        name: "Unknown Error",
        message: "42",
      });
    });

    it("returns 'Unknown Error' with 'true' for boolean", () => {
      expect(createErrorDetails(true)).toStrictEqual({
        name: "Unknown Error",
        message: "true",
      });
    });

    it("returns 'Unknown Error' with JSON for nested object", () => {
      const error = { error: { status: 500, message: "Server Error" } };
      expect(createErrorDetails(error)).toStrictEqual({
        name: "Unknown Error",
        message: JSON.stringify(error, null, 2),
      });
    });
  });
});
