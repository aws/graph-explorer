import type { FeatureFlags, NormalizedConnection } from "@/core";

import {
  DatabaseTimeoutError,
  FetchTimeoutError,
  logger,
  NetworkError,
  ServerConnectionError,
} from "@/utils";
import { abortableFetch } from "@/utils/testing";

import { fetchDatabaseRequest } from "./fetchDatabaseRequest";

function createConnection(
  overrides?: Partial<NormalizedConnection>,
): NormalizedConnection {
  return {
    queryEngine: "gremlin",
    graphDbUrl: "",
    awsAuthEnabled: false,
    ...overrides,
  };
}

function createFeatureFlags(overrides?: Partial<FeatureFlags>): FeatureFlags {
  return {
    showDebugActions: false,
    allowLoggingDbQuery: false,
    ...overrides,
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function textResponse(body: string, status: number): Response {
  return new Response(body, {
    status,
    headers: { "Content-Type": "text/plain" },
  });
}

function emptyResponse(status: number): Response {
  return new Response("", { status, headers: {} });
}

describe("fetchDatabaseRequest", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const connection = createConnection();
  const featureFlags = createFeatureFlags();

  describe("successful responses", () => {
    it("returns parsed JSON on success", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ result: "ok" }));

      const data = await fetchDatabaseRequest(
        connection,
        featureFlags,
        "http://localhost:8182/query",
        { method: "POST" },
      );

      expect(data).toStrictEqual({ result: "ok" });
    });

    it("passes the URI and method through to fetch", async () => {
      mockFetch.mockResolvedValue(jsonResponse({}));

      await fetchDatabaseRequest(
        connection,
        featureFlags,
        "http://localhost:8182/sparql",
        { method: "GET" },
      );

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:8182/sparql",
        expect.objectContaining({ method: "GET" }),
      );
    });

    it("passes the request body through to fetch", async () => {
      mockFetch.mockResolvedValue(jsonResponse({}));

      await fetchDatabaseRequest(connection, featureFlags, "/query", {
        method: "POST",
        body: "g.V().limit(10)",
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "/query",
        expect.objectContaining({ body: "g.V().limit(10)" }),
      );
    });
  });

  describe("header construction", () => {
    it("sets graph-db-connection-url header", async () => {
      mockFetch.mockResolvedValue(jsonResponse({}));
      const conn = createConnection({
        graphDbUrl: "https://my-neptune:8182",
      });

      await fetchDatabaseRequest(conn, featureFlags, "/query", {
        method: "POST",
      });

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers["graph-db-connection-url"]).toBe(
        "https://my-neptune:8182",
      );
      expect(headers["db-query-logging-enabled"]).toBe("false");
    });

    it("sets db-query-logging-enabled based on allowLoggingDbQuery", async () => {
      mockFetch.mockResolvedValue(jsonResponse({}));
      const conn = createConnection({ graphDbUrl: "https://db:8182" });
      const flags = createFeatureFlags({ allowLoggingDbQuery: true });

      await fetchDatabaseRequest(conn, flags, "/query", { method: "POST" });

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers["db-query-logging-enabled"]).toBe("true");
    });

    it("sets AWS headers when awsAuthEnabled is true", async () => {
      mockFetch.mockResolvedValue(jsonResponse({}));
      const conn = createConnection({
        awsAuthEnabled: true,
        awsRegion: "us-west-2",
        serviceType: "neptune-graph",
      });

      await fetchDatabaseRequest(conn, featureFlags, "/query", {
        method: "POST",
      });

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers["aws-neptune-region"]).toBe("us-west-2");
      expect(headers["service-type"]).toBe("neptune-graph");
    });

    it("defaults serviceType to neptune-db", async () => {
      mockFetch.mockResolvedValue(jsonResponse({}));
      const conn = createConnection({ awsAuthEnabled: true });

      await fetchDatabaseRequest(conn, featureFlags, "/query", {
        method: "POST",
      });

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers["service-type"]).toBe("neptune-db");
    });

    it("always sends graph-db-connection-url header", async () => {
      mockFetch.mockResolvedValue(jsonResponse({}));
      const conn = createConnection({
        graphDbUrl: "https://my-db:8182",
      });

      await fetchDatabaseRequest(conn, featureFlags, "/query", {
        method: "POST",
      });

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers["graph-db-connection-url"]).toBe("https://my-db:8182");
      expect(headers["db-query-logging-enabled"]).toBe("false");
    });

    it("does not set AWS headers when awsAuthEnabled is disabled", async () => {
      mockFetch.mockResolvedValue(jsonResponse({}));

      await fetchDatabaseRequest(connection, featureFlags, "/query", {
        method: "POST",
      });

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers).not.toHaveProperty("aws-neptune-region");
      expect(headers).not.toHaveProperty("service-type");
    });

    it("merges caller-provided headers with auth headers", async () => {
      mockFetch.mockResolvedValue(jsonResponse({}));
      const conn = createConnection({ graphDbUrl: "https://db:8182" });

      await fetchDatabaseRequest(conn, featureFlags, "/query", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers["content-type"]).toBe("application/x-www-form-urlencoded");
      expect(headers["graph-db-connection-url"]).toBeDefined();
    });
  });

  describe("timeout and abort signals", () => {
    it("does not set a signal when no timeout or abort signal is provided", async () => {
      mockFetch.mockResolvedValue(jsonResponse({}));

      await fetchDatabaseRequest(connection, featureFlags, "/query", {
        method: "POST",
      });

      const signal = mockFetch.mock.calls[0][1].signal;
      expect(signal).toBeUndefined();
    });

    it("passes through the caller's abort signal", async () => {
      mockFetch.mockResolvedValue(jsonResponse({}));
      const controller = new AbortController();

      await fetchDatabaseRequest(connection, featureFlags, "/query", {
        method: "POST",
        signal: controller.signal,
      });

      const signal = mockFetch.mock.calls[0][1].signal;
      expect(signal).toBeDefined();
      expect(signal!.aborted).toBe(false);
    });

    it("creates a signal when fetchTimeoutMs is set", async () => {
      mockFetch.mockResolvedValue(jsonResponse({}));
      const conn = createConnection({ fetchTimeoutMs: 5000 });

      await fetchDatabaseRequest(conn, featureFlags, "/query", {
        method: "POST",
      });

      const signal = mockFetch.mock.calls[0][1].signal;
      expect(signal).toBeDefined();
    });

    it("does not create a timeout signal when fetchTimeoutMs is 0", async () => {
      mockFetch.mockResolvedValue(jsonResponse({}));
      const conn = createConnection({ fetchTimeoutMs: 0 });

      await fetchDatabaseRequest(conn, featureFlags, "/query", {
        method: "POST",
      });

      const signal = mockFetch.mock.calls[0][1].signal;
      expect(signal).toBeUndefined();
    });

    it("does not create a timeout signal when fetchTimeoutMs is negative", async () => {
      mockFetch.mockResolvedValue(jsonResponse({}));
      const conn = createConnection({ fetchTimeoutMs: -1 });

      await fetchDatabaseRequest(conn, featureFlags, "/query", {
        method: "POST",
      });

      const signal = mockFetch.mock.calls[0][1].signal;
      expect(signal).toBeUndefined();
    });
  });

  describe("error responses", () => {
    it("throws NetworkError with message from JSON body", async () => {
      mockFetch.mockResolvedValue(
        jsonResponse({ message: "Query timed out" }, 500),
      );

      await expect(
        fetchDatabaseRequest(connection, featureFlags, "/query", {
          method: "POST",
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          message: "Query timed out",
          statusCode: 500,
        }),
      );
    });

    it("throws NetworkError with detailedMessage when present", async () => {
      mockFetch.mockResolvedValue(
        jsonResponse(
          {
            code: "MalformedQueryException",
            detailedMessage: "Syntax error at line 1",
            message: "Bad request",
          },
          400,
        ),
      );

      await expect(
        fetchDatabaseRequest(connection, featureFlags, "/query", {
          method: "POST",
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          message: "Syntax error at line 1",
        }),
      );
    });

    it("throws NetworkError with default message when body has no extractable message", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ code: "ERR_UNKNOWN" }, 500));

      await expect(
        fetchDatabaseRequest(connection, featureFlags, "/query", {
          method: "POST",
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          message: "Network response was not OK",
        }),
      );
    });

    it("includes the decoded error body as data on NetworkError", async () => {
      const errorBody = {
        code: "MalformedQueryException",
        requestId: "abc-123",
        detailedMessage: "Syntax error",
      };
      mockFetch.mockResolvedValue(jsonResponse(errorBody, 400));

      const error = await fetchDatabaseRequest(
        connection,
        featureFlags,
        "/query",
        { method: "POST" },
      ).catch(e => e);

      expect(error).toBeInstanceOf(NetworkError);
      expect(error.data).toStrictEqual(errorBody);
    });

    it("preserves the HTTP status code", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ message: "nope" }, 403));

      const error = await fetchDatabaseRequest(
        connection,
        featureFlags,
        "/query",
        { method: "POST" },
      ).catch(e => e);

      expect(error.statusCode).toBe(403);
    });

    it("logs the error via logger.error", async () => {
      mockFetch.mockResolvedValue(
        jsonResponse({ message: "server error" }, 500),
      );

      await fetchDatabaseRequest(connection, featureFlags, "/query", {
        method: "POST",
      }).catch(() => {});

      expect(logger.error).toHaveBeenCalledWith(
        "Response status 500 received:",
        expect.anything(),
      );
    });
  });

  describe("error body decoding", () => {
    it("flattens a nested error object", async () => {
      const innerError = { code: "ECONNREFUSED", message: "refused" };
      mockFetch.mockResolvedValue(jsonResponse({ error: innerError }, 502));

      const error = await fetchDatabaseRequest(
        connection,
        featureFlags,
        "/query",
        { method: "POST" },
      ).catch(e => e);

      expect(error.data).toStrictEqual(innerError);
    });

    it("returns raw text when JSON parsing fails", async () => {
      mockFetch.mockResolvedValue(
        new Response("not valid json", {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const error = await fetchDatabaseRequest(
        connection,
        featureFlags,
        "/query",
        { method: "POST" },
      ).catch(e => e);

      expect(error.data).toBe("not valid json");
    });

    it("returns raw text for non-JSON content", async () => {
      mockFetch.mockResolvedValue(textResponse("Service Unavailable", 503));

      const error = await fetchDatabaseRequest(
        connection,
        featureFlags,
        "/query",
        { method: "POST" },
      ).catch(e => e);

      expect(error.data).toBe("Service Unavailable");
    });

    it("uses default message when error body is empty", async () => {
      mockFetch.mockResolvedValue(emptyResponse(500));

      await expect(
        fetchDatabaseRequest(connection, featureFlags, "/query", {
          method: "POST",
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          message: "Network response was not OK",
        }),
      );
    });

    it("assumes JSON when Content-Type header is missing", async () => {
      const body = JSON.stringify({ message: "no content type" });
      const response = new Response(body, { status: 400 });
      response.headers.delete("Content-Type");
      mockFetch.mockResolvedValue(response);

      const error = await fetchDatabaseRequest(
        connection,
        featureFlags,
        "/query",
        { method: "POST" },
      ).catch(e => e);

      expect(error.message).toBe("no content type");
    });
  });

  describe("fetch failures", () => {
    it("wraps failed to fetch in ServerConnectionError with the URL", async () => {
      mockFetch.mockRejectedValue(new TypeError("Failed to fetch"));

      const error = await fetchDatabaseRequest(
        connection,
        featureFlags,
        "http://localhost:8182/query",
        { method: "POST" },
      ).catch(e => e);

      expect(error).toBeInstanceOf(ServerConnectionError);
      expect(error.url).toBe("http://localhost:8182/query");
      expect(error.cause).toBeInstanceOf(TypeError);
    });

    it("propagates abort errors", async () => {
      const controller = new AbortController();
      controller.abort();

      mockFetch.mockRejectedValue(controller.signal.reason);

      await expect(
        fetchDatabaseRequest(connection, featureFlags, "/query", {
          method: "POST",
          signal: controller.signal,
        }),
      ).rejects.toBe(controller.signal.reason);
    });

    it("wraps other TypeErrors as ServerConnectionError", async () => {
      const error = new TypeError("Cannot read properties of null");
      mockFetch.mockRejectedValue(error);

      const caught = await fetchDatabaseRequest(
        connection,
        featureFlags,
        "http://localhost:8182/query",
        { method: "POST" },
      ).catch(e => e);

      expect(caught).toBeInstanceOf(ServerConnectionError);
      expect(caught.cause).toBe(error);
    });

    it("extracts URL from a URL object", async () => {
      mockFetch.mockRejectedValue(new TypeError("Failed to fetch"));

      const caught = await fetchDatabaseRequest(
        connection,
        featureFlags,
        new URL("http://localhost:8182/sparql"),
        { method: "POST" },
      ).catch(e => e);

      expect(caught).toBeInstanceOf(ServerConnectionError);
      expect(caught.url).toBe("http://localhost:8182/sparql");
    });
  });

  describe("timeout classification", () => {
    // Like `abortableFetch`, but delays the rejection well past the fetch
    // timeout window so a real, independent fetch-timeout timer has a
    // chance to fire on its own before the rejection (and this module's
    // catch block) runs. Proves classification is decided by which signal's
    // reason the combined signal actually captured, not by re-checking
    // `aborted` flags after the fact, once both signals are aborted.
    function delayedAbortableFetch(_uri: unknown, init: RequestInit) {
      return new Promise((_resolve, reject) => {
        const signal = init.signal;
        if (!signal) return;
        const rejectAfterDelay = () =>
          setTimeout(() => reject(signal.reason as Error), 20);
        if (signal.aborted) {
          rejectAfterDelay();
          return;
        }
        signal.addEventListener("abort", rejectAfterDelay);
      });
    }

    // Mimics a non-OK response whose error body takes a while to read, so a
    // fetch timeout that fires during that read must not override the
    // NetworkError/DatabaseTimeoutError `sendRequest` builds from the body.
    function slowErrorResponse(body: string, status: number, delayMs: number) {
      return {
        ok: false,
        status,
        headers: new Headers({ "Content-Type": "application/json" }),
        text: () =>
          new Promise<string>(resolve =>
            setTimeout(() => resolve(body), delayMs),
          ),
      } as unknown as Response;
    }

    // Mimics a response that arrived successfully but whose body never
    // finishes streaming until the signal fires, so a timeout mid-parse is
    // still classified rather than escaping unclassified.
    function hangingJsonResponse(init: RequestInit) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          new Promise((_resolve, reject) => {
            const signal = init.signal;
            if (!signal) return;
            signal.addEventListener("abort", () =>
              reject(signal.reason as Error),
            );
          }),
      } as unknown as Response);
    }

    it("throws FetchTimeoutError when the fetch timer fires", async () => {
      mockFetch.mockImplementation(abortableFetch);
      const conn = createConnection({ fetchTimeoutMs: 1 });

      const error = await fetchDatabaseRequest(conn, featureFlags, "/query", {
        method: "POST",
      }).catch(e => e);

      expect(error).toBeInstanceOf(FetchTimeoutError);
      expect(error.timeoutMs).toBe(1);
      expect(error.cause).toBeInstanceOf(DOMException);
      expect(error.cause.name).toBe("TimeoutError");
    });

    it("throws exactly the caller's AbortError when the caller aborts first", async () => {
      mockFetch.mockImplementation(abortableFetch);
      const conn = createConnection({ fetchTimeoutMs: 1 });
      const controller = new AbortController();
      controller.abort();

      const error = await fetchDatabaseRequest(conn, featureFlags, "/query", {
        method: "POST",
        signal: controller.signal,
      }).catch(e => e);

      expect(error).toBe(controller.signal.reason);
      expect(error).not.toBeInstanceOf(FetchTimeoutError);
    });

    it("throws the caller's AbortError when the caller aborts first, even once the fetch timeout also fires before the catch runs", async () => {
      mockFetch.mockImplementation(delayedAbortableFetch);
      const conn = createConnection({ fetchTimeoutMs: 5 });
      const controller = new AbortController();

      const promise = fetchDatabaseRequest(conn, featureFlags, "/query", {
        method: "POST",
        signal: controller.signal,
      }).catch(e => e);

      // Abort before the fetch timeout's 5ms elapses. `delayedAbortableFetch`
      // won't reject for another 20ms, so by the time this module's catch
      // block runs, the independent fetch-timeout signal has also fired.
      controller.abort();

      const error = await promise;

      expect(error).toBe(controller.signal.reason);
      expect(error).not.toBeInstanceOf(FetchTimeoutError);
    });

    it("throws FetchTimeoutError when the fetch timeout fires first, even once the caller also aborts before the catch runs", async () => {
      mockFetch.mockImplementation(delayedAbortableFetch);
      const conn = createConnection({ fetchTimeoutMs: 5 });
      const controller = new AbortController();

      const promise = fetchDatabaseRequest(conn, featureFlags, "/query", {
        method: "POST",
        signal: controller.signal,
      }).catch(e => e);

      // Wait for the fetch timeout to fire first, then abort the caller's
      // signal before `delayedAbortableFetch`'s 20ms delay rejects, so both
      // signals are aborted by the time this module's catch block runs.
      await new Promise(resolve => setTimeout(resolve, 10));
      controller.abort();

      const error = await promise;

      expect(error).toBeInstanceOf(FetchTimeoutError);
      expect(error.timeoutMs).toBe(5);
    });

    it("preserves a DatabaseTimeoutError read from the response body even if the fetch timeout fires while reading it", async () => {
      const errorBody = {
        requestId: "abc-123",
        code: "TimeLimitExceededException",
        detailedMessage: "A timeout occurred during the request.",
      };
      mockFetch.mockResolvedValue(
        slowErrorResponse(JSON.stringify(errorBody), 500, 20),
      );
      const conn = createConnection({ fetchTimeoutMs: 5 });

      const error = await fetchDatabaseRequest(conn, featureFlags, "/query", {
        method: "POST",
      }).catch(e => e);

      expect(error).toBeInstanceOf(DatabaseTimeoutError);
      expect(error).not.toBeInstanceOf(FetchTimeoutError);
      expect(error.databaseCode).toBe("TimeLimitExceededException");
    });

    it("throws FetchTimeoutError when the timeout fires while reading the response body", async () => {
      mockFetch.mockImplementation((_uri, init) => hangingJsonResponse(init));
      const conn = createConnection({ fetchTimeoutMs: 1 });

      const error = await fetchDatabaseRequest(conn, featureFlags, "/query", {
        method: "POST",
      }).catch(e => e);

      expect(error).toBeInstanceOf(FetchTimeoutError);
      expect(error.timeoutMs).toBe(1);
    });

    it("throws DatabaseTimeoutError for a Neptune query timeout body", async () => {
      const errorBody = {
        requestId: "abc-123",
        code: "TimeLimitExceededException",
        detailedMessage: "A timeout occurred during the request.",
      };
      mockFetch.mockResolvedValue(jsonResponse(errorBody, 500));

      const error = await fetchDatabaseRequest(
        connection,
        featureFlags,
        "/query",
        { method: "POST" },
      ).catch(e => e);

      expect(error).toBeInstanceOf(DatabaseTimeoutError);
      expect(error.databaseCode).toBe("TimeLimitExceededException");
      expect(error.statusCode).toBe(500);
      expect(error.data).toStrictEqual(errorBody);
    });

    it("throws DatabaseTimeoutError for a Neptune query timeout body wrapped in an error object", async () => {
      const innerError = {
        requestId: "abc-123",
        code: "TimeLimitExceededException",
        detailedMessage: "A timeout occurred during the request.",
      };
      mockFetch.mockResolvedValue(jsonResponse({ error: innerError }, 500));

      const error = await fetchDatabaseRequest(
        connection,
        featureFlags,
        "/query",
        { method: "POST" },
      ).catch(e => e);

      expect(error).toBeInstanceOf(DatabaseTimeoutError);
      expect(error.databaseCode).toBe("TimeLimitExceededException");
      expect(error.data).toStrictEqual(innerError);
    });

    it("throws a plain NetworkError for a memory limit error, not DatabaseTimeoutError", async () => {
      mockFetch.mockResolvedValue(
        jsonResponse({ code: "MemoryLimitExceededException" }, 500),
      );

      const error = await fetchDatabaseRequest(
        connection,
        featureFlags,
        "/query",
        { method: "POST" },
      ).catch(e => e);

      expect(error).toBeInstanceOf(NetworkError);
      expect(error).not.toBeInstanceOf(DatabaseTimeoutError);
    });

    it("throws a plain NetworkError for ETIMEDOUT, not DatabaseTimeoutError", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ code: "ETIMEDOUT" }, 500));

      const error = await fetchDatabaseRequest(
        connection,
        featureFlags,
        "/query",
        { method: "POST" },
      ).catch(e => e);

      expect(error).toBeInstanceOf(NetworkError);
      expect(error).not.toBeInstanceOf(DatabaseTimeoutError);
    });
  });
});
