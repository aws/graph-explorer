import fs from "fs";
import os from "os";
import path from "path";
import { Readable } from "stream";
import request from "supertest";

import { createApp } from "./app.js";
import { createLogger } from "./logging.js";

// node-fetch is globally mocked in test-setup.ts
const { default: fetch } = await import("node-fetch");
const mockFetch = vi.mocked(fetch);

const testVersion = "1.2.3";

function createTestApp(configPath = ".", corsOrigin?: string[]) {
  const app = createApp({
    configPath,
    staticFilesVirtualPath: "/explorer",
    staticFilesPath: ".",
    version: testVersion,
    corsOrigin,
  });
  app.locals.logger = createLogger({
    HOST: "localhost",
    PROXY_SERVER_HTTPS_CONNECTION: false,
    PROXY_SERVER_HTTPS_PORT: 443,
    PROXY_SERVER_HTTP_PORT: 80,
    LOG_LEVEL: "silent",
    LOG_STYLE: "default",
  });
  return app;
}

const graphDbUrl = "https://my-graph-db.example.com:8182";

function dbHeaders(overrides: Record<string, string> = {}) {
  return {
    "graph-db-connection-url": graphDbUrl,
    ...overrides,
  };
}

/** Creates a minimal node-fetch Response-like object that fetchData can pipe. */
function createMockFetchResponse(
  body: string,
  status = 200,
  headers: Record<string, string> = {},
) {
  const readable = Readable.from([body]);
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Map(Object.entries(headers)),
    body: readable,
  };
}

function mockFetchOnce(body = "ok", status = 200, headers = {}) {
  mockFetch.mockResolvedValueOnce(
    createMockFetchResponse(body, status, headers) as any,
  );
}

describe("createApp", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  // ── CORS ────────────────────────────────────────────────────────────

  describe("CORS", () => {
    it("reflects the request origin by default", async () => {
      const app = createTestApp();
      const response = await request(app)
        .get("/status")
        .set("Origin", "http://example.com");

      expect(response.headers["access-control-allow-origin"]).toBe(
        "http://example.com",
      );
    });

    it("does not set origin header when request has no Origin", async () => {
      const app = createTestApp();
      const response = await request(app).get("/status");

      expect(response.headers["access-control-allow-origin"]).toBeUndefined();
    });

    it("sets the configured corsOrigin when provided", async () => {
      const app = createTestApp(".", ["https://my-app.example.com"]);
      const response = await request(app)
        .get("/status")
        .set("Origin", "https://my-app.example.com");

      expect(response.headers["access-control-allow-origin"]).toBe(
        "https://my-app.example.com",
      );
    });

    it("returns the configured origin regardless of the requesting origin", async () => {
      const app = createTestApp(".", ["https://my-app.example.com"]);
      const response = await request(app)
        .get("/status")
        .set("Origin", "https://evil.example.com");

      // The cors library sets a fixed Access-Control-Allow-Origin header
      // when origin is a string. The browser enforces the mismatch by
      // blocking the response when the header doesn't match the page origin.
      expect(response.headers["access-control-allow-origin"]).toBe(
        "https://my-app.example.com",
      );
    });

    it("returns the configured origin on preflight regardless of the requesting origin", async () => {
      const app = createTestApp(".", ["https://my-app.example.com"]);
      const response = await request(app)
        .options("/status")
        .set("Origin", "https://evil.example.com")
        .set("Access-Control-Request-Method", "POST");

      expect(response.headers["access-control-allow-origin"]).toBe(
        "https://my-app.example.com",
      );
    });

    it("reflects the matching origin when multiple origins are configured", async () => {
      const app = createTestApp(".", [
        "https://app-a.example.com",
        "https://app-b.example.com",
      ]);
      const response = await request(app)
        .get("/status")
        .set("Origin", "https://app-b.example.com");

      expect(response.headers["access-control-allow-origin"]).toBe(
        "https://app-b.example.com",
      );
    });

    it("does not reflect a non-matching origin when multiple origins are configured", async () => {
      const app = createTestApp(".", [
        "https://app-a.example.com",
        "https://app-b.example.com",
      ]);
      const response = await request(app)
        .get("/status")
        .set("Origin", "https://evil.example.com");

      expect(response.headers["access-control-allow-origin"]).toBeUndefined();
    });

    it("only allows GET and POST methods", async () => {
      const app = createTestApp();
      const response = await request(app)
        .options("/status")
        .set("Origin", "http://example.com")
        .set("Access-Control-Request-Method", "DELETE");

      expect(response.headers["access-control-allow-methods"]).toBe("GET,POST");
    });

    it("sets preflight max-age cache header", async () => {
      const app = createTestApp();
      const response = await request(app)
        .options("/status")
        .set("Origin", "http://example.com")
        .set("Access-Control-Request-Method", "POST");

      expect(response.headers["access-control-max-age"]).toBe("86400");
    });

    it("only forwards content-type from upstream responses", async () => {
      mockFetchOnce(JSON.stringify({ results: [] }), 200, {
        "content-type": "application/json",
        "access-control-allow-origin": "https://upstream.example.com",
        "transfer-encoding": "chunked",
        server: "Neptune/1.0",
        "x-request-id": "abc-123",
      });

      const app = createTestApp();
      const response = await request(app)
        .post("/sparql")
        .set(dbHeaders())
        .send({ query: "SELECT 1" });

      expect(response.headers["content-type"]).toContain("application/json");
      expect(response.headers["access-control-allow-origin"]).toBeUndefined();
      expect(response.headers["server"]).toBeUndefined();
      expect(response.headers["x-request-id"]).toBeUndefined();
    });
  });

  // ── Static routes ──────────────────────────────────────────────────

  it("GET /status returns 200 OK", async () => {
    const app = createTestApp();
    const response = await request(app).get("/status");
    expect(response.status).toBe(200);
    expect(response.text).toBe("OK");
  });

  it("unknown routes return 404", async () => {
    const app = createTestApp();
    const response = await request(app).get("/nonexistent");
    expect(response.status).toBe(404);
  });

  it("GET /defaultConnection serves defaultConnection.json from configPath", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ge-app-test-"));
    try {
      const connectionData = { endpoint: "https://example:8182" };
      fs.writeFileSync(
        path.join(tmpDir, "defaultConnection.json"),
        JSON.stringify(connectionData),
      );
      const app = createTestApp(tmpDir);
      const response = await request(app).get("/defaultConnection");
      expect(response.status).toBe(200);
      expect(response.body).toEqual(connectionData);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  // ── Logger route ───────────────────────────────────────────────────

  it("POST /logger returns error when level header is missing", async () => {
    const app = createTestApp();
    const response = await request(app)
      .post("/logger")
      .set("message", JSON.stringify("test message"));
    expect(response.status).toBe(500);
  });

  it("POST /logger returns error when message header is missing", async () => {
    const app = createTestApp();
    const response = await request(app).post("/logger").set("level", "info");
    expect(response.status).toBe(500);
  });

  it("POST /logger succeeds with valid level and message", async () => {
    const app = createTestApp();
    const response = await request(app)
      .post("/logger")
      .set("level", "info")
      .set("message", JSON.stringify("test message"));
    expect(response.status).toBe(200);
    expect(response.text).toBe("Log received.");
  });

  it.each(["error", "warn", "info", "debug", "trace"])(
    "POST /logger accepts %s level",
    async level => {
      const app = createTestApp();
      const response = await request(app)
        .post("/logger")
        .set("level", level)
        .set("message", JSON.stringify("msg"));
      expect(response.status).toBe(200);
    },
  );

  it("POST /logger returns error for unknown log level", async () => {
    const app = createTestApp();
    const response = await request(app)
      .post("/logger")
      .set("level", "verbose")
      .set("message", JSON.stringify("msg"));
    expect(response.status).toBe(500);
  });

  // ── Error handling middleware ──────────────────────────────────────

  it("error handling middleware sends structured error response", async () => {
    const app = createTestApp();
    const response = await request(app)
      .post("/logger")
      .set("level", "info")
      .set("message", "not valid json");
    expect(response.status).toBe(500);
    expect(response.body.error).toBeDefined();
  });

  // ── Query validation (400 cases) ──────────────────────────────────

  describe.each(["sparql", "gremlin", "openCypher"])(
    "POST /%s input validation",
    route => {
      it("returns 400 when query is missing but headers are present", async () => {
        const app = createTestApp();
        const response = await request(app)
          .post(`/${route}`)
          .set(dbHeaders())
          .send({});
        expect(response.status).toBe(400);
      });

      it("returns 400 when neither query nor db headers are present", async () => {
        const app = createTestApp();
        const response = await request(app).post(`/${route}`).send({});
        expect(response.status).toBe(400);
      });

      it("returns 400 when query is present but db connection header is missing", async () => {
        mockFetchOnce();

        const app = createTestApp();
        const response = await request(app)
          .post(`/${route}`)
          .send({ query: "test query" });
        expect(response.status).toBe(400);
      });

      it("returns 400 when graph-db-connection-url is not a valid HTTP URL", async () => {
        const app = createTestApp();
        const response = await request(app)
          .post(`/${route}`)
          .set({ "graph-db-connection-url": "ftp://not-http.example.com" })
          .send({ query: "test query" });
        expect(response.status).toBe(400);
      });
    },
  );

  // ── SPARQL happy path ─────────────────────────────────────────────

  describe("POST /sparql", () => {
    it("proxies query to the graph database", async () => {
      mockFetchOnce(JSON.stringify({ results: [] }), 200, {
        "content-type": "application/sparql-results+json",
      });

      const app = createTestApp();
      const response = await request(app)
        .post("/sparql")
        .set(dbHeaders())
        .send({ query: "SELECT * WHERE { ?s ?p ?o }" });

      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledWith(
        `${graphDbUrl}/sparql`,
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("sends query as url-encoded form body", async () => {
      mockFetchOnce();

      const app = createTestApp();
      const query = "SELECT * WHERE { ?s ?p ?o }";
      await request(app).post("/sparql").set(dbHeaders()).send({ query });

      const fetchOptions = mockFetch.mock.calls[0][1] as any;
      expect(fetchOptions.headers["Content-Type"]).toBe(
        "application/x-www-form-urlencoded",
      );
      expect(fetchOptions.body).toContain(`query=${encodeURIComponent(query)}`);
    });

    it("includes queryId in the body when provided", async () => {
      mockFetchOnce();

      const app = createTestApp();
      await request(app)
        .post("/sparql")
        .set(dbHeaders({ queryid: "q-123" }))
        .send({ query: "SELECT 1" });

      const fetchOptions = mockFetch.mock.calls[0][1] as any;
      expect(fetchOptions.body).toContain(
        `queryId=${encodeURIComponent("q-123")}`,
      );
    });

    it("pipes the upstream response status and body back to the client", async () => {
      const upstreamBody = JSON.stringify({
        results: { bindings: [{ x: "1" }] },
      });
      mockFetchOnce(upstreamBody, 200, {
        "content-type": "application/sparql-results+json",
      });

      const app = createTestApp();
      const response = await request(app)
        .post("/sparql")
        .set(dbHeaders())
        .send({ query: "SELECT 1" });

      expect(response.status).toBe(200);
      expect(response.text).toBe(upstreamBody);
    });

    it("forwards non-200 status from the upstream database", async () => {
      mockFetchOnce("Bad Request", 400);

      const app = createTestApp();
      const response = await request(app)
        .post("/sparql")
        .set(dbHeaders())
        .send({ query: "INVALID" });

      expect(response.status).toBe(400);
    });
  });

  // ── Gremlin happy path ────────────────────────────────────────────

  describe("POST /gremlin", () => {
    it("proxies query to the graph database", async () => {
      mockFetchOnce(JSON.stringify({ result: {} }), 200, {
        "content-type": "application/vnd.gremlin-v3.0+json",
      });

      const app = createTestApp();
      const response = await request(app)
        .post("/gremlin")
        .set(dbHeaders())
        .send({ query: "g.V().limit(1)" });

      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledWith(
        `${graphDbUrl}/gremlin`,
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("sends query as JSON with gremlin key", async () => {
      mockFetchOnce();

      const app = createTestApp();
      const query = "g.V().limit(1)";
      await request(app).post("/gremlin").set(dbHeaders()).send({ query });

      const fetchOptions = mockFetch.mock.calls[0][1] as any;
      const body = JSON.parse(fetchOptions.body);
      expect(body.gremlin).toBe(query);
    });

    it("includes queryId in the JSON body when provided", async () => {
      mockFetchOnce();

      const app = createTestApp();
      await request(app)
        .post("/gremlin")
        .set(dbHeaders({ queryid: "q-456" }))
        .send({ query: "g.V()" });

      const fetchOptions = mockFetch.mock.calls[0][1] as any;
      const body = JSON.parse(fetchOptions.body);
      expect(body.queryId).toBe("q-456");
    });

    it("forwards non-200 status from the upstream database", async () => {
      mockFetchOnce("Server Error", 500);

      const app = createTestApp();
      const response = await request(app)
        .post("/gremlin")
        .set(dbHeaders())
        .send({ query: "g.V()" });

      expect(response.status).toBe(500);
    });
  });

  // ── openCypher happy path ─────────────────────────────────────────

  describe("POST /openCypher", () => {
    it("proxies query to the graph database", async () => {
      mockFetchOnce(JSON.stringify({ results: [] }), 200, {
        "content-type": "application/json",
      });

      const app = createTestApp();
      const response = await request(app)
        .post("/openCypher")
        .set(dbHeaders())
        .send({ query: "MATCH (n) RETURN n LIMIT 1" });

      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledWith(
        `${graphDbUrl}/openCypher`,
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("sends query as url-encoded form body", async () => {
      mockFetchOnce();

      const app = createTestApp();
      const query = "MATCH (n) RETURN n";
      await request(app).post("/openCypher").set(dbHeaders()).send({ query });

      const fetchOptions = mockFetch.mock.calls[0][1] as any;
      expect(fetchOptions.headers["Content-Type"]).toBe(
        "application/x-www-form-urlencoded",
      );
      expect(fetchOptions.body).toBe(`query=${encodeURIComponent(query)}`);
    });

    it("forwards non-200 status from the upstream database", async () => {
      mockFetchOnce("Not Found", 404);

      const app = createTestApp();
      const response = await request(app)
        .post("/openCypher")
        .set(dbHeaders())
        .send({ query: "MATCH (n) RETURN n" });

      expect(response.status).toBe(404);
    });
  });

  // ── Summary routes ────────────────────────────────────────────────

  describe("GET /summary", () => {
    it("proxies to the graph database summary endpoint", async () => {
      mockFetchOnce(JSON.stringify({ graphSummary: {} }), 200, {
        "content-type": "application/json",
      });

      const app = createTestApp();
      const response = await request(app).get("/summary").set(dbHeaders());

      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledWith(
        `${graphDbUrl}/summary?mode=detailed`,
        expect.objectContaining({ method: "GET" }),
      );
    });
  });

  describe("GET /pg/statistics/summary", () => {
    it("proxies to the PG statistics summary endpoint", async () => {
      mockFetchOnce(JSON.stringify({ stats: {} }), 200, {
        "content-type": "application/json",
      });

      const app = createTestApp();
      const response = await request(app)
        .get("/pg/statistics/summary")
        .set(dbHeaders());

      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledWith(
        `${graphDbUrl}/pg/statistics/summary?mode=detailed`,
        expect.objectContaining({ method: "GET" }),
      );
    });
  });

  describe("GET /rdf/statistics/summary", () => {
    it("proxies to the RDF statistics summary endpoint", async () => {
      mockFetchOnce(JSON.stringify({ stats: {} }), 200, {
        "content-type": "application/json",
      });

      const app = createTestApp();
      const response = await request(app)
        .get("/rdf/statistics/summary")
        .set(dbHeaders());

      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledWith(
        `${graphDbUrl}/rdf/statistics/summary?mode=detailed`,
        expect.objectContaining({ method: "GET" }),
      );
    });
  });

  // ── IAM signing ───────────────────────────────────────────────────

  describe("IAM signing", () => {
    it("signs the request when aws-neptune-region header is present", async () => {
      mockFetchOnce();

      const app = createTestApp();
      await request(app)
        .post("/sparql")
        .set(
          dbHeaders({
            "aws-neptune-region": "us-east-1",
            "service-type": "neptune-db",
          }),
        )
        .send({ query: "SELECT 1" });

      // aws4 signing adds Authorization and X-Amz headers to the options
      const fetchOptions = mockFetch.mock.calls[0][1] as any;
      expect(fetchOptions.headers).toHaveProperty("Authorization");
    });

    it("uses only the mocked credentials, never real ones", async () => {
      mockFetchOnce();

      const app = createTestApp();
      await request(app)
        .post("/sparql")
        .set(
          dbHeaders({
            "aws-neptune-region": "us-east-1",
            "service-type": "neptune-db",
          }),
        )
        .send({ query: "SELECT 1" });

      const fetchOptions = mockFetch.mock.calls[0][1] as any;
      const authHeader: string = fetchOptions.headers["Authorization"];
      // The Authorization header must reference our fake credential, proving
      // the mock intercepted the credential provider chain.
      expect(
        authHeader.includes("Credential=test-key/"),
        "Authorization header should contain the mock credential",
      ).toBe(true);
      expect(
        authHeader.startsWith("AWS4-HMAC-SHA256"),
        "Authorization header should not contain a real AWS key",
      ).toBe(true);
    });

    it("does not sign the request when aws-neptune-region is absent", async () => {
      mockFetchOnce();

      const app = createTestApp();
      await request(app)
        .post("/sparql")
        .set(dbHeaders())
        .send({ query: "SELECT 1" });

      const fetchOptions = mockFetch.mock.calls[0][1] as any;
      expect(fetchOptions.headers).not.toHaveProperty("Authorization");
    });
  });

  // ── Query logging header ───────────────────────────────────────────

  describe("db-query-logging-enabled header", () => {
    it.each(["sparql", "gremlin", "openCypher"])(
      "POST /%s logs the query when db-query-logging-enabled is true",
      async route => {
        mockFetchOnce();

        const app = createTestApp();
        const logger = app.locals.logger;
        const debugSpy = vi.spyOn(logger, "debug");

        await request(app)
          .post(`/${route}`)
          .set(dbHeaders({ "db-query-logging-enabled": "true" }))
          .send({ query: "test query" });

        expect(debugSpy).toHaveBeenCalledWith(
          expect.stringContaining("Received database query"),
          "test query",
        );
      },
    );

    it.each(["sparql", "gremlin", "openCypher"])(
      "POST /%s does not log the query when db-query-logging-enabled is absent",
      async route => {
        mockFetchOnce();

        const app = createTestApp();
        const logger = app.locals.logger;
        const debugSpy = vi.spyOn(logger, "debug");

        await request(app)
          .post(`/${route}`)
          .set(dbHeaders())
          .send({ query: "test query" });

        expect(debugSpy).not.toHaveBeenCalledWith(
          expect.stringContaining("Received database query"),
          expect.anything(),
        );
      },
    );
  });

  // ── Service type default ──────────────────────────────────────────

  describe("service-type header default", () => {
    it("defaults service to neptune-db when IAM is enabled but service-type is absent", async () => {
      mockFetchOnce();

      const app = createTestApp();
      await request(app)
        .post("/sparql")
        .set(
          dbHeaders({
            "aws-neptune-region": "us-east-1",
          }),
        )
        .send({ query: "SELECT 1" });

      const fetchOptions = mockFetch.mock.calls[0][1] as any;
      expect(fetchOptions.service).toBe("neptune-db");
    });

    it("uses provided service-type when IAM is enabled", async () => {
      mockFetchOnce();

      const app = createTestApp();
      await request(app)
        .post("/sparql")
        .set(
          dbHeaders({
            "aws-neptune-region": "us-east-1",
            "service-type": "neptune-graph",
          }),
        )
        .send({ query: "SELECT 1" });

      const fetchOptions = mockFetch.mock.calls[0][1] as any;
      expect(fetchOptions.service).toBe("neptune-graph");
    });
  });

  // ── User-Agent header ───────────────────────────────────────────

  describe("User-Agent header", () => {
    it("sets User-Agent on outbound requests", async () => {
      mockFetchOnce();

      const app = createTestApp();
      await request(app)
        .post("/sparql")
        .set(dbHeaders())
        .send({ query: "SELECT 1" });

      const fetchOptions = mockFetch.mock.calls[0][1] as any;
      expect(fetchOptions.headers["User-Agent"]).toBe(
        `graph-explorer/${testVersion}`,
      );
    });

    it("falls back to 'graph-explorer' when version is not provided", async () => {
      mockFetchOnce();

      const app = createApp({
        configPath: ".",
        staticFilesVirtualPath: "/explorer",
        staticFilesPath: ".",
      });
      app.locals.logger = createLogger({
        HOST: "localhost",
        PROXY_SERVER_HTTPS_CONNECTION: false,
        PROXY_SERVER_HTTPS_PORT: 443,
        PROXY_SERVER_HTTP_PORT: 80,
        LOG_LEVEL: "silent",
        LOG_STYLE: "default",
      });

      await request(app)
        .post("/sparql")
        .set(dbHeaders())
        .send({ query: "SELECT 1" });

      const fetchOptions = mockFetch.mock.calls[0][1] as any;
      expect(fetchOptions.headers["User-Agent"]).toBe("graph-explorer");
    });

    it("preserves User-Agent after IAM signing", async () => {
      mockFetchOnce();

      const app = createTestApp();
      await request(app)
        .post("/sparql")
        .set(
          dbHeaders({
            "aws-neptune-region": "us-east-1",
            "service-type": "neptune-db",
          }),
        )
        .send({ query: "SELECT 1" });

      const fetchOptions = mockFetch.mock.calls[0][1] as any;
      expect(fetchOptions.headers["User-Agent"]).toBe(
        `graph-explorer/${testVersion}`,
      );
    });
  });

  // ── Fetch error handling ──────────────────────────────────────────

  describe("fetch error handling", () => {
    it("returns 500 when the upstream fetch throws", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Connection refused"));

      const app = createTestApp();
      const response = await request(app)
        .post("/sparql")
        .set(dbHeaders())
        .send({ query: "SELECT 1" });

      expect(response.status).toBe(500);
    });
  });
});
