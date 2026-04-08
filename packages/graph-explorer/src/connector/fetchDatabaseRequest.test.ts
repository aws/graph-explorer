import type { FeatureFlags, NormalizedConnection } from "@/core";

import { logger, NetworkError } from "@/utils";

import { fetchDatabaseRequest } from "./fetchDatabaseRequest";

function createConnection(
  overrides?: Partial<NormalizedConnection>,
): NormalizedConnection {
  return {
    url: "http://localhost:8182",
    queryEngine: "gremlin",
    graphDbUrl: "",
    proxyConnection: false,
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
    it("sets proxy headers when proxyConnection is true", async () => {
      mockFetch.mockResolvedValue(jsonResponse({}));
      const conn = createConnection({
        proxyConnection: true,
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
      const conn = createConnection({ proxyConnection: true });
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

    it("does not set proxy or AWS headers when both are disabled", async () => {
      mockFetch.mockResolvedValue(jsonResponse({}));

      await fetchDatabaseRequest(connection, featureFlags, "/query", {
        method: "POST",
      });

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers).not.toHaveProperty("graph-db-connection-url");
      expect(headers).not.toHaveProperty("aws-neptune-region");
      expect(headers).not.toHaveProperty("service-type");
    });

    it("merges caller-provided headers with auth headers", async () => {
      mockFetch.mockResolvedValue(jsonResponse({}));
      const conn = createConnection({ proxyConnection: true });

      await fetchDatabaseRequest(conn, featureFlags, "/query", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers["Content-Type"]).toBe("application/x-www-form-urlencoded");
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
    it("propagates network errors from fetch", async () => {
      mockFetch.mockRejectedValue(new TypeError("Failed to fetch"));

      await expect(
        fetchDatabaseRequest(connection, featureFlags, "/query", {
          method: "POST",
        }),
      ).rejects.toThrow(TypeError);
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
      ).rejects.toThrow();
    });
  });
});
