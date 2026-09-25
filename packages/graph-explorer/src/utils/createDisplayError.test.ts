// @vitest-environment happy-dom
import { z } from "zod";

import { EdgeConnectionDiscoveryError } from "@/connector/gremlin/fetchEdgeConnections/discoveryError";
import {
  EmptyIdentifierError,
  QueryValueError,
  UnescapableValueError,
  UnsupportedValueTypeError,
} from "@/connector/queryValueError";
import { FileEnvelopeError } from "@/core/fileEnvelope";

import { createDisplayError } from "./createDisplayError";
import { DatabaseTimeoutError } from "./DatabaseTimeoutError";
import { FetchTimeoutError } from "./FetchTimeoutError";
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

  it("Should give a specific message for a value that cannot be used in a query", () => {
    const error = new UnsupportedValueTypeError("openCypher", "id", 124);
    const result = createDisplayError(error);
    expect(result).toStrictEqual({
      title: "This value cannot be used",
      message:
        'The value "124" cannot be used in a query against this database.',
    });
  });

  it("Should fall back to generic wording for an unrecognized query value failure", () => {
    const result = createDisplayError(new UnrecognizedQueryValueError());
    expect(result).toStrictEqual({
      title: "This value cannot be used",
      message: "This value cannot be used in a query against this database.",
    });
  });

  it.each(["gremlin", "openCypher"] as const)(
    "Should give the same language-agnostic message for an empty %s identifier",
    language => {
      const result = createDisplayError(new EmptyIdentifierError(language));
      expect(result).toStrictEqual({
        title: "This identifier cannot be used",
        message: "An empty identifier cannot be used in a query.",
      });
    },
  );

  it("Should fall back to generic wording for an unescapable value failure", () => {
    const error = new UnescapableValueError("sparql", "IRI", "a b", [" "]);
    const result = createDisplayError(error);
    expect(result).toStrictEqual({
      title: "This value cannot be used",
      message: "This value cannot be used in a query against this database.",
    });
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

  // The proxy server's error handler used to send only { status, message }, so
  // an errno could never reach the browser and every network failure fell
  // through to a generic "Network Response 500". These use the exact payload
  // extractErrorInfo now sends
  // (packages/graph-explorer-proxy-server/src/error-handler.ts).
  describe("errno codes from the proxy server's error payload", () => {
    const unreachable = {
      title: "Database unreachable",
      message:
        "The database hostname could not be resolved. Check the hostname in the connection and try again.",
    };
    const timedOut = {
      title: "Database connection timed out",
      message:
        "The database hostname resolved, but nothing answered at that address. Check that a security group or firewall permits the Graph Explorer server, and that the port in the connection is correct.",
    };

    it("Should handle an unresolvable host", () => {
      const error = new NetworkError("getaddrinfo ENOTFOUND bad-host", 500, {
        status: 500,
        message: "getaddrinfo ENOTFOUND bad-host",
        code: "ENOTFOUND",
      });

      expect(createDisplayError(error)).toStrictEqual(unreachable);
    });

    it("Should handle a connection that timed out", () => {
      const error = new NetworkError("connect ETIMEDOUT 10.0.0.4:8182", 500, {
        status: 500,
        message: "connect ETIMEDOUT 10.0.0.4:8182",
        code: "ETIMEDOUT",
      });

      expect(createDisplayError(error)).toStrictEqual(timedOut);
    });

    it("Should handle a connection that timed out reported under cause", () => {
      const error = new NetworkError("fetch failed", 500, {
        status: 500,
        message: "fetch failed",
        cause: { code: "ETIMEDOUT" },
      });

      expect(createDisplayError(error)).toStrictEqual(timedOut);
    });

    it("Should handle a temporary DNS failure", () => {
      const error = new NetworkError("getaddrinfo EAI_AGAIN db", 500, {
        status: 500,
        message: "getaddrinfo EAI_AGAIN db",
        code: "EAI_AGAIN",
      });

      expect(createDisplayError(error)).toStrictEqual(unreachable);
    });

    it("Should handle an unresolvable host reported under cause", () => {
      const error = new NetworkError("fetch failed", 500, {
        status: 500,
        message: "fetch failed",
        cause: { code: "ENOTFOUND" },
      });

      expect(createDisplayError(error)).toStrictEqual(unreachable);
    });

    it("Should handle a refused port", () => {
      const message =
        "request to http://localhost:9999/gremlin failed, reason: connect ECONNREFUSED 127.0.0.1:9999";
      const error = new NetworkError(message, 500, {
        status: 500,
        message,
        code: "ECONNREFUSED",
      });

      expect(createDisplayError(error)).toStrictEqual({
        title: "Connection refused",
        message: "Please check your connection and try again.",
      });
    });
  });

  it("should handle cancelled error", async () => {
    const error = await createCancelledError();
    const result = createDisplayError(error);
    expect(result).toStrictEqual({
      title: "Request cancelled",
      message: "The request was cancelled.",
    });
  });

  it("Should handle AbortError", () => {
    const controller = new AbortController();
    controller.abort();
    const error = controller.signal.reason;
    const result = createDisplayError(error);
    expect(result).toStrictEqual({
      title: "Request cancelled",
      message: "The request was cancelled.",
    });
  });

  it("Should handle the database running out of memory", () => {
    const result = createDisplayError({ code: "MemoryLimitExceededException" });
    expect(result).toStrictEqual({
      title: "Not enough memory",
      message:
        "The database ran out of memory answering the query. Try a smaller request, or use an instance with more memory.",
    });
  });

  it("Should give edge connection discovery its own recovery instructions", () => {
    const result = createDisplayError(
      new EdgeConnectionDiscoveryError(
        {
          strategy: "sampled",
          requests: 1,
          totalEdges: 19_928_805,
          degraded: true,
          cause: "database-limit",
        },
        new NetworkError("Query cannot be completed", 500, {
          code: "MemoryLimitExceededException",
        }),
      ),
    );

    expect(result.title).toBe("Could not discover edge connections");
    // The generic memory branch would say "try a smaller request", which is not
    // something the user can do here. The database configuration is.
    expect(result.message).toContain("DB cluster parameter group");
    expect(result.message).not.toContain("smaller request");
  });

  it("Should handle malformed query", () => {
    const result = createDisplayError({ code: "MalformedQueryException" });
    expect(result).toStrictEqual({
      title: "Malformed Query",
      message:
        "The executed query was rejected by the database. It is possible the query structure is not supported by your database.",
    });
  });

  it("Should handle FetchTimeoutError", () => {
    const result = createDisplayError(
      new FetchTimeoutError(240000, new Error("aborted")),
    );
    expect(result).toStrictEqual({
      title: "Fetch timeout exceeded",
      message:
        "The request did not finish within this connection's fetch timeout of 240,000 ms. Increase the Fetch Timeout in this connection's advanced options, or retry the request.",
    });
  });

  it("Should handle DatabaseTimeoutError", () => {
    const result = createDisplayError(
      new DatabaseTimeoutError(
        "A timeout occurred",
        500,
        { code: "TimeLimitExceededException" },
        "TimeLimitExceededException",
      ),
    );
    expect(result).toStrictEqual({
      title: "Database query timed out",
      message:
        "The database stopped the query because it ran longer than its query timeout. Increase the query timeout in the database configuration, such as the DB cluster parameter group for Neptune, or retry the request.",
    });
  });

  it("Should fall back to the generic network message for a plain NetworkError with a TimeLimitExceededException data code", () => {
    const error = new NetworkError("A timeout occurred", 500, {
      code: "TimeLimitExceededException",
      message: "A timeout occurred",
    });
    const result = createDisplayError(error);
    expect(result).toStrictEqual({
      title: "Network Response 500",
      message: "A timeout occurred",
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

  it.each([
    "http://localhost:9999/query",
    "http://127.0.0.1:9999/query",
    "http://[::1]:9999/query",
    "http://0.0.0.0:9999/query",
    "http://127.0.0.1:8182/query",
  ])("Should not report origin mismatch for loopback URL %s", (url: string) => {
    const result = createDisplayError(
      new ServerConnectionError(url, new TypeError("Failed to fetch")),
    );
    expect(result).toStrictEqual({
      title: "Connection Error",
      message:
        "Unable to reach the proxy server. This is typically caused by the proxy server not running, an incorrect connection URL, or a CORS configuration issue.",
    });
  });

  it("Should handle server connection error with unparseable URL", () => {
    const result = createDisplayError(
      new ServerConnectionError("not-a-url", new TypeError("Failed to fetch")),
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

  it("Should surface a file envelope error message under an Invalid file title", () => {
    const result = createDisplayError(
      new FileEnvelopeError(
        'Expected a "styling-export" file, but got "connection-export"',
      ),
    );
    expect(result).toStrictEqual({
      title: "Invalid file",
      message: 'Expected a "styling-export" file, but got "connection-export"',
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

/** Stands in for a query value failure type that `createDisplayError` has no branch for. */
class UnrecognizedQueryValueError extends QueryValueError {
  readonly details = {};

  constructor() {
    super("UnrecognizedQueryValueError", "unrecognized");
  }
}
