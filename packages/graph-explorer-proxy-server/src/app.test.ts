import type { Express } from "express";
import type { Server } from "http";

import fs from "fs";
import os from "os";
import path from "path";
import { Readable } from "stream";
import request from "supertest";

import { createApp, resolveEndpointUrl } from "./app.ts";
import { createLogger } from "./logging.ts";
import { createTestEnvironment } from "./testing.ts";

// node-fetch is globally mocked in test-setup.ts
const { default: fetch } = await import("node-fetch");
const mockFetch = vi.mocked(fetch);

const testVersion = "1.2.3";

function createTestApp(
  configPath = ".",
  corsOrigin?: string[],
  allowedDbOrigins?: Set<string>,
) {
  const app = createApp({
    configPath,
    staticFilesVirtualPath: "/explorer",
    staticFilesPath: ".",
    version: testVersion,
    corsOrigin,
    allowedDbOrigins,
  });
  app.locals.logger = createLogger(createTestEnvironment());
  return app;
}

const servers = new WeakMap<Express, Server>();
const openServers: Server[] = [];

/**
 * Starts the app on an ephemeral port and keeps that port bound until the file
 * finishes.
 *
 * Handed to supertest instead of the app because supertest opens its own server
 * per request and closes it the moment the response ends. Binding a fresh
 * ephemeral port that fast means the kernel can hand a port back while the
 * previous client socket is still closing, which surfaces as ECONNRESET or an
 * HTTP parse error once CI runs suites in parallel (#2109).
 */
function serve(app: Express): Server {
  const existing = servers.get(app);
  if (existing) {
    return existing;
  }
  const server = app.listen(0);
  servers.set(app, server);
  openServers.push(server);
  return server;
}

afterAll(() => {
  for (const server of openServers) {
    server.close();
  }
});

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

/**
 * Returns the request options of the single outbound fetch to the given path.
 *
 * Selected by URL rather than by call index because a query cancellation from
 * an abandoned request can be recorded after the test that triggered it,
 * landing in `mock.calls[0]` for whichever test runs next.
 *
 * The length assertion is what makes this stricter than the indexing it
 * replaced: it fails on a missing call and on an unexpected second call to the
 * same path, where reading an index silently accepted both.
 */
function fetchOptionsFor(endpointPath: string): any {
  const url = `${graphDbUrl}/${endpointPath}`;
  // The proxy always passes url.href, so anything else is a test setup mistake
  const calledUrls = mockFetch.mock.calls.map(([calledUrl]) =>
    typeof calledUrl === "string" ? calledUrl : "(non-string url)",
  );
  const matches = mockFetch.mock.calls.filter(
    (_, index) =>
      calledUrls[index] === url || calledUrls[index].startsWith(`${url}?`),
  );
  expect(
    matches,
    `expected exactly one fetch to ${url}, called: ${calledUrls.join(", ") || "(none)"}`,
  ).toHaveLength(1);
  return matches[0][1];
}

describe("createApp", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  // ── CORS ────────────────────────────────────────────────────────────

  describe("CORS", () => {
    it("does not allow cross-origin requests by default", async () => {
      const app = createTestApp();
      const response = await request(serve(app))
        .get("/status")
        .set("Origin", "http://example.com");

      expect(response.headers["access-control-allow-origin"]).toBeUndefined();
    });

    it("does not set CORS headers on preflight by default", async () => {
      const app = createTestApp();
      const response = await request(serve(app))
        .options("/status")
        .set("Origin", "http://example.com")
        .set("Access-Control-Request-Method", "POST");

      expect(response.headers["access-control-allow-origin"]).toBeUndefined();
    });

    it("does not set origin header when request has no Origin", async () => {
      const app = createTestApp();
      const response = await request(serve(app)).get("/status");

      expect(response.headers["access-control-allow-origin"]).toBeUndefined();
    });

    it("sets the configured corsOrigin when provided", async () => {
      const app = createTestApp(".", ["https://my-app.example.com"]);
      const response = await request(serve(app))
        .get("/status")
        .set("Origin", "https://my-app.example.com");

      expect(response.headers["access-control-allow-origin"]).toBe(
        "https://my-app.example.com",
      );
    });

    it("sets the configured origin as a fixed header for single-origin config", async () => {
      const app = createTestApp(".", ["https://my-app.example.com"]);
      const response = await request(serve(app))
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
      const response = await request(serve(app))
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
      const response = await request(serve(app))
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
      const response = await request(serve(app))
        .get("/status")
        .set("Origin", "https://evil.example.com");

      expect(response.headers["access-control-allow-origin"]).toBeUndefined();
    });

    it("only allows GET and POST methods when corsOrigin is configured", async () => {
      const app = createTestApp(".", ["http://example.com"]);
      const response = await request(serve(app))
        .options("/status")
        .set("Origin", "http://example.com")
        .set("Access-Control-Request-Method", "DELETE");

      expect(response.headers["access-control-allow-methods"]).toBe("GET,POST");
    });

    it("sets preflight max-age cache header when corsOrigin is configured", async () => {
      const app = createTestApp(".", ["http://example.com"]);
      const response = await request(serve(app))
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
      const response = await request(serve(app))
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
    const response = await request(serve(app)).get("/status");
    expect(response.status).toBe(200);
    expect(response.text).toBe("OK");
  });

  it("unknown routes return 404", async () => {
    const app = createTestApp();
    const response = await request(serve(app)).get("/nonexistent");
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
      const response = await request(serve(app)).get("/defaultConnection");
      expect(response.status).toBe(200);
      expect(response.body).toEqual(connectionData);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  // ── Static mount redirect ─────────────────────────────────────────

  describe("static mount redirect", () => {
    let tmpDir: string;

    beforeEach(() => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ge-static-test-"));
      fs.writeFileSync(
        path.join(tmpDir, "index.html"),
        "<html>explorer</html>",
      );
      fs.mkdirSync(path.join(tmpDir, "assets"));
      fs.writeFileSync(
        path.join(tmpDir, "assets", "app.js"),
        "console.log('ok');",
      );
    });

    afterEach(() => {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    function createStaticTestApp(staticFilesVirtualPath = "/explorer") {
      const app = createApp({
        configPath: ".",
        staticFilesVirtualPath,
        staticFilesPath: tmpDir,
        version: testVersion,
      });
      app.locals.logger = createLogger(createTestEnvironment());
      return app;
    }

    it("redirects the bare mount path with a relative Location", async () => {
      const response = await request(createStaticTestApp()).get("/explorer");

      expect(response.status).toBe(301);
      expect(response.headers["location"]).toBe("explorer/");
    });

    it("uses the last segment of a multi-segment mount path", async () => {
      const response = await request(createStaticTestApp("/ui/graph")).get(
        "/ui/graph",
      );

      expect(response.status).toBe(301);
      // Resolved against "/ui/graph" this gives "/ui/graph/".
      expect(response.headers["location"]).toBe("graph/");
    });

    it("serves index.html for a multi-segment mount path", async () => {
      const response = await request(createStaticTestApp("/ui/graph")).get(
        "/ui/graph/",
      );

      expect(response.status).toBe(200);
      expect(response.text).toContain("explorer");
    });

    it("serves index.html for the trailing-slash form without redirecting", async () => {
      const response = await request(createStaticTestApp()).get("/explorer/");

      expect(response.status).toBe(200);
      expect(response.text).toContain("explorer");
    });

    it("serves an asset beneath the mount path", async () => {
      const response = await request(createStaticTestApp()).get(
        "/explorer/assets/app.js",
      );

      expect(response.status).toBe(200);
      expect(response.text).toContain("console.log");
    });

    it("does not shadow an API route mounted at root", async () => {
      const response = await request(createStaticTestApp()).get("/status");

      expect(response.status).toBe(200);
      expect(response.text).toBe("OK");
    });
  });

  // ── Logger route ───────────────────────────────────────────────────

  it("POST /logger returns error when level header is missing", async () => {
    const app = createTestApp();
    const response = await request(serve(app))
      .post("/logger")
      .set("message", JSON.stringify("test message"));
    expect(response.status).toBe(500);
  });

  it("POST /logger returns error when message header is missing", async () => {
    const app = createTestApp();
    const response = await request(serve(app))
      .post("/logger")
      .set("level", "info");
    expect(response.status).toBe(500);
  });

  it("POST /logger succeeds with valid level and message", async () => {
    const app = createTestApp();
    const response = await request(serve(app))
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
      const response = await request(serve(app))
        .post("/logger")
        .set("level", level)
        .set("message", JSON.stringify("msg"));
      expect(response.status).toBe(200);
    },
  );

  it("POST /logger returns error for unknown log level", async () => {
    const app = createTestApp();
    const response = await request(serve(app))
      .post("/logger")
      .set("level", "verbose")
      .set("message", JSON.stringify("msg"));
    expect(response.status).toBe(500);
  });

  // ── Error handling middleware ──────────────────────────────────────

  it("error handling middleware sends structured error response", async () => {
    const app = createTestApp();
    const response = await request(serve(app))
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
        const response = await request(serve(app))
          .post(`/${route}`)
          .set(dbHeaders())
          .send({});
        expect(response.status).toBe(400);
      });

      it("returns 400 when neither query nor db headers are present", async () => {
        const app = createTestApp();
        const response = await request(serve(app)).post(`/${route}`).send({});
        expect(response.status).toBe(400);
      });

      it("returns 400 when query is present but db connection header is missing", async () => {
        mockFetchOnce();

        const app = createTestApp();
        const response = await request(serve(app))
          .post(`/${route}`)
          .send({ query: "test query" });
        expect(response.status).toBe(400);
      });

      it("returns 400 when graph-db-connection-url is not a valid HTTP URL", async () => {
        const app = createTestApp();
        const response = await request(serve(app))
          .post(`/${route}`)
          .set({ "graph-db-connection-url": "ftp://not-http.example.com" })
          .send({ query: "test query" });
        expect(response.status).toBe(400);
      });
    },
  );

  // ── Database URLs carrying userinfo ───────────────────────────────

  describe("graph-db-connection-url with embedded credentials", () => {
    const credentialedUrl = `https://someone:hunter2@my-graph-db.example.com:8182`;

    it.each([
      { method: "post", route: "/sparql", body: { query: "test" } },
      { method: "post", route: "/gremlin", body: { query: "test" } },
      { method: "post", route: "/openCypher", body: { query: "test" } },
      { method: "get", route: "/summary", body: undefined },
      { method: "get", route: "/pg/statistics/summary", body: undefined },
      { method: "get", route: "/rdf/statistics/summary", body: undefined },
    ] as const)(
      "$method $route returns 400 without fetching",
      async ({ method, route, body }) => {
        const app = createTestApp();
        const req = request(app)
          [method](route)
          .set(dbHeaders({ "graph-db-connection-url": credentialedUrl }));
        const response = body ? await req.send(body) : await req;

        expect(response.status).toBe(400);
        expect(response.body.error.message).toContain(
          "Must not include a username or password",
        );
        expect(mockFetch).not.toHaveBeenCalledWith(
          expect.stringContaining("my-graph-db.example.com"),
          expect.anything(),
        );
      },
    );

    it("rejects a URL carrying only a username", async () => {
      const app = createTestApp();
      const response = await request(app)
        .post("/gremlin")
        .set({
          "graph-db-connection-url": "https://someone@my-graph-db.example.com",
        })
        .send({ query: "test" });

      expect(response.status).toBe(400);
    });

    it("does not echo the rejected value back to the client", async () => {
      const app = createTestApp();
      const response = await request(app)
        .post("/gremlin")
        .set(dbHeaders({ "graph-db-connection-url": credentialedUrl }))
        .send({ query: "test" });

      expect(JSON.stringify(response.body)).not.toContain("hunter2");
    });

    it("still accepts a URL without userinfo", async () => {
      mockFetchOnce();

      const app = createTestApp();
      const response = await request(app)
        .post("/gremlin")
        .set(dbHeaders())
        .send({ query: "test" });

      expect(response.status).toBe(200);
      expect(fetchOptionsFor("gremlin")).toBeDefined();
    });
  });

  // ── SPARQL happy path ─────────────────────────────────────────────

  describe("POST /sparql", () => {
    it("proxies query to the graph database", async () => {
      mockFetchOnce(JSON.stringify({ results: [] }), 200, {
        "content-type": "application/sparql-results+json",
      });

      const app = createTestApp();
      const response = await request(serve(app))
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
      await request(serve(app))
        .post("/sparql")
        .set(dbHeaders())
        .send({ query });

      const fetchOptions = fetchOptionsFor("sparql");
      expect(fetchOptions.headers["content-type"]).toBe(
        "application/x-www-form-urlencoded",
      );
      expect(fetchOptions.body).toContain(`query=${encodeURIComponent(query)}`);
    });

    it("includes queryId in the body when provided", async () => {
      mockFetchOnce();

      const app = createTestApp();
      await request(serve(app))
        .post("/sparql")
        .set(dbHeaders({ queryid: "q-123" }))
        .send({ query: "SELECT 1" });

      const fetchOptions = fetchOptionsFor("sparql");
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
      const response = await request(serve(app))
        .post("/sparql")
        .set(dbHeaders())
        .send({ query: "SELECT 1" });

      expect(response.status).toBe(200);
      expect(response.text).toBe(upstreamBody);
    });

    it("forwards non-200 status from the upstream database", async () => {
      mockFetchOnce("Bad Request", 400);

      const app = createTestApp();
      const response = await request(serve(app))
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
      const response = await request(serve(app))
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
      await request(serve(app))
        .post("/gremlin")
        .set(dbHeaders())
        .send({ query });

      const fetchOptions = fetchOptionsFor("gremlin");
      const body = JSON.parse(fetchOptions.body);
      expect(body.gremlin).toBe(query);
    });

    it("includes queryId in the JSON body when provided", async () => {
      mockFetchOnce();

      const app = createTestApp();
      await request(serve(app))
        .post("/gremlin")
        .set(dbHeaders({ queryid: "q-456" }))
        .send({ query: "g.V()" });

      const fetchOptions = fetchOptionsFor("gremlin");
      const body = JSON.parse(fetchOptions.body);
      expect(body.queryId).toBe("q-456");
    });

    it("forwards non-200 status from the upstream database", async () => {
      mockFetchOnce("Server Error", 500);

      const app = createTestApp();
      const response = await request(serve(app))
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
      const response = await request(serve(app))
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
      await request(serve(app))
        .post("/openCypher")
        .set(dbHeaders())
        .send({ query });

      const fetchOptions = fetchOptionsFor("openCypher");
      expect(fetchOptions.headers["content-type"]).toBe(
        "application/x-www-form-urlencoded",
      );
      expect(fetchOptions.body).toBe(`query=${encodeURIComponent(query)}`);
    });

    it("forwards non-200 status from the upstream database", async () => {
      mockFetchOnce("Not Found", 404);

      const app = createTestApp();
      const response = await request(serve(app))
        .post("/openCypher")
        .set(dbHeaders())
        .send({ query: "MATCH (n) RETURN n" });

      expect(response.status).toBe(404);
    });
  });

  // ── Summary routes ────────────────────────────────────────────────

  describe("GET /summary", () => {
    it("proxies to the graph database summary endpoint with mode=basic", async () => {
      mockFetchOnce(JSON.stringify({ graphSummary: {} }), 200, {
        "content-type": "application/json",
      });

      const app = createTestApp();
      const response = await request(serve(app))
        .get("/summary")
        .set(dbHeaders());

      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledWith(
        `${graphDbUrl}/summary?mode=basic`,
        expect.objectContaining({ method: "GET" }),
      );
    });
  });

  describe("GET /pg/statistics/summary", () => {
    it("proxies to the PG statistics summary endpoint with mode=basic", async () => {
      mockFetchOnce(JSON.stringify({ stats: {} }), 200, {
        "content-type": "application/json",
      });

      const app = createTestApp();
      const response = await request(serve(app))
        .get("/pg/statistics/summary")
        .set(dbHeaders());

      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledWith(
        `${graphDbUrl}/pg/statistics/summary?mode=basic`,
        expect.objectContaining({ method: "GET" }),
      );
    });
  });

  describe("GET /rdf/statistics/summary", () => {
    it("proxies to the RDF statistics summary endpoint with mode=basic", async () => {
      mockFetchOnce(JSON.stringify({ stats: {} }), 200, {
        "content-type": "application/json",
      });

      const app = createTestApp();
      const response = await request(serve(app))
        .get("/rdf/statistics/summary")
        .set(dbHeaders());

      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledWith(
        `${graphDbUrl}/rdf/statistics/summary?mode=basic`,
        expect.objectContaining({ method: "GET" }),
      );
    });
  });

  // ── IAM signing ───────────────────────────────────────────────────

  describe("IAM signing", () => {
    it("signs the request when aws-neptune-region header is present", async () => {
      mockFetchOnce();

      const app = createTestApp();
      await request(serve(app))
        .post("/sparql")
        .set(
          dbHeaders({
            "aws-neptune-region": "us-east-1",
            "service-type": "neptune-db",
          }),
        )
        .send({ query: "SELECT 1" });

      // SigV4 signing adds the authorization and x-amz-* headers to the options
      const fetchOptions = fetchOptionsFor("sparql");
      expect(fetchOptions.headers).toHaveProperty("authorization");
    });

    it("uses only the mocked credentials, never real ones", async () => {
      mockFetchOnce();

      const app = createTestApp();
      await request(serve(app))
        .post("/sparql")
        .set(
          dbHeaders({
            "aws-neptune-region": "us-east-1",
            "service-type": "neptune-db",
          }),
        )
        .send({ query: "SELECT 1" });

      const fetchOptions = fetchOptionsFor("sparql");
      const authHeader: string = fetchOptions.headers["authorization"];
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
      await request(serve(app))
        .post("/sparql")
        .set(dbHeaders())
        .send({ query: "SELECT 1" });

      const fetchOptions = fetchOptionsFor("sparql");
      expect(fetchOptions.headers).not.toHaveProperty("authorization");
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

        await request(serve(app))
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

        await request(serve(app))
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
      await request(serve(app))
        .post("/sparql")
        .set(
          dbHeaders({
            "aws-neptune-region": "us-east-1",
          }),
        )
        .send({ query: "SELECT 1" });

      const fetchOptions = fetchOptionsFor("sparql");
      // The service appears in the SigV4 credential scope, not on the request.
      expect(fetchOptions.headers["authorization"]).toContain(
        "/us-east-1/neptune-db/aws4_request",
      );
    });

    it("uses provided service-type when IAM is enabled", async () => {
      mockFetchOnce();

      const app = createTestApp();
      await request(serve(app))
        .post("/sparql")
        .set(
          dbHeaders({
            "aws-neptune-region": "us-east-1",
            "service-type": "neptune-graph",
          }),
        )
        .send({ query: "SELECT 1" });

      const fetchOptions = fetchOptionsFor("sparql");
      expect(fetchOptions.headers["authorization"]).toContain(
        "/us-east-1/neptune-graph/aws4_request",
      );
    });
  });

  // ── User-Agent header ───────────────────────────────────────────

  describe("User-Agent header", () => {
    it("sets User-Agent on outbound requests", async () => {
      mockFetchOnce();

      const app = createTestApp();
      await request(serve(app))
        .post("/sparql")
        .set(dbHeaders())
        .send({ query: "SELECT 1" });

      const fetchOptions = fetchOptionsFor("sparql");
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
      app.locals.logger = createLogger(createTestEnvironment());

      await request(serve(app))
        .post("/sparql")
        .set(dbHeaders())
        .send({ query: "SELECT 1" });

      const fetchOptions = fetchOptionsFor("sparql");
      expect(fetchOptions.headers["User-Agent"]).toBe("graph-explorer");
    });

    it("preserves User-Agent after IAM signing", async () => {
      mockFetchOnce();

      const app = createTestApp();
      await request(serve(app))
        .post("/sparql")
        .set(
          dbHeaders({
            "aws-neptune-region": "us-east-1",
            "service-type": "neptune-db",
          }),
        )
        .send({ query: "SELECT 1" });

      const fetchOptions = fetchOptionsFor("sparql");
      expect(fetchOptions.headers["User-Agent"]).toBe(
        `graph-explorer/${testVersion}`,
      );
    });

    it("preserves request-specific headers after IAM signing", async () => {
      mockFetchOnce();

      const app = createTestApp();
      await request(serve(app))
        .post("/sparql")
        .set(
          dbHeaders({
            "aws-neptune-region": "us-east-1",
            "service-type": "neptune-db",
          }),
        )
        .send({ query: "SELECT 1" });

      const fetchOptions = fetchOptionsFor("sparql");
      expect(fetchOptions.headers["content-type"]).toBe(
        "application/x-www-form-urlencoded",
      );
      expect(fetchOptions.headers["accept"]).toBe(
        "application/sparql-results+json",
      );
      expect(fetchOptions.headers["authorization"]).toBeDefined();
    });
  });

  // ── URL path preservation ────────────────────────────────────────

  describe("preserves base URL path for non-root endpoints", () => {
    const blazegraphUrl = "http://blazegraph:9999/blazegraph/namespace/kb";

    function blazegraphHeaders(overrides: Record<string, string> = {}) {
      return {
        "graph-db-connection-url": blazegraphUrl,
        ...overrides,
      };
    }

    it("POST /sparql appends to the base URL path", async () => {
      mockFetchOnce();

      const app = createTestApp();
      await request(serve(app))
        .post("/sparql")
        .set(blazegraphHeaders())
        .send({ query: "SELECT 1" });

      expect(mockFetch).toHaveBeenCalledWith(
        `${blazegraphUrl}/sparql`,
        expect.anything(),
      );
    });

    it("POST /gremlin appends to the base URL path", async () => {
      mockFetchOnce();

      const app = createTestApp();
      await request(serve(app))
        .post("/gremlin")
        .set(blazegraphHeaders())
        .send({ query: "g.V()" });

      expect(mockFetch).toHaveBeenCalledWith(
        `${blazegraphUrl}/gremlin`,
        expect.anything(),
      );
    });

    it("POST /openCypher appends to the base URL path", async () => {
      mockFetchOnce();

      const app = createTestApp();
      await request(serve(app))
        .post("/openCypher")
        .set(blazegraphHeaders())
        .send({ query: "MATCH (n) RETURN n" });

      expect(mockFetch).toHaveBeenCalledWith(
        `${blazegraphUrl}/openCypher`,
        expect.anything(),
      );
    });

    it("GET /summary appends to the base URL path", async () => {
      mockFetchOnce();

      const app = createTestApp();
      await request(serve(app)).get("/summary").set(blazegraphHeaders());

      expect(mockFetch).toHaveBeenCalledWith(
        `${blazegraphUrl}/summary?mode=basic`,
        expect.anything(),
      );
    });

    it("GET /pg/statistics/summary appends to the base URL path", async () => {
      mockFetchOnce();

      const app = createTestApp();
      await request(serve(app))
        .get("/pg/statistics/summary")
        .set(blazegraphHeaders());

      expect(mockFetch).toHaveBeenCalledWith(
        `${blazegraphUrl}/pg/statistics/summary?mode=basic`,
        expect.anything(),
      );
    });

    it("GET /rdf/statistics/summary appends to the base URL path", async () => {
      mockFetchOnce();

      const app = createTestApp();
      await request(serve(app))
        .get("/rdf/statistics/summary")
        .set(blazegraphHeaders());

      expect(mockFetch).toHaveBeenCalledWith(
        `${blazegraphUrl}/rdf/statistics/summary?mode=basic`,
        expect.anything(),
      );
    });
  });

  // ── Fetch error handling ──────────────────────────────────────────

  describe("fetch error handling", () => {
    it("returns 500 when the upstream fetch throws", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Connection refused"));

      const app = createTestApp();
      const response = await request(serve(app))
        .post("/sparql")
        .set(dbHeaders())
        .send({ query: "SELECT 1" });

      expect(response.status).toBe(500);
    });

    it("disables HTTP redirects on outbound requests", async () => {
      mockFetchOnce();

      const app = createTestApp();
      await request(serve(app))
        .post("/sparql")
        .set(dbHeaders())
        .send({ query: "SELECT 1" });

      const fetchOptions = fetchOptionsFor("sparql");
      expect(fetchOptions.redirect).toBe("error");
    });
  });

  // ── Allowed DB origins ─────────────────────────────────────────────

  describe("PROXY_SERVER_ALLOWED_DB_ORIGINS", () => {
    const allowedOrigins = new Set(["https://my-graph-db.example.com:8182"]);

    it("allows requests when the origin is in the allowlist", async () => {
      mockFetchOnce(JSON.stringify({ results: [] }), 200, {
        "content-type": "application/json",
      });

      const app = createTestApp(".", undefined, allowedOrigins);
      const response = await request(serve(app))
        .post("/sparql")
        .set(dbHeaders())
        .send({ query: "SELECT 1" });

      expect(response.status).toBe(200);
    });

    it("allows all requests when allowlist is not configured", async () => {
      mockFetchOnce();

      const app = createTestApp();
      const response = await request(serve(app))
        .post("/sparql")
        .set(dbHeaders())
        .send({ query: "SELECT 1" });

      expect(response.status).toBe(200);
    });

    it.each([
      { method: "post", route: "/sparql", body: { query: "test" } },
      { method: "post", route: "/gremlin", body: { query: "test" } },
      { method: "post", route: "/openCypher", body: { query: "test" } },
      { method: "get", route: "/summary", body: undefined },
      { method: "get", route: "/pg/statistics/summary", body: undefined },
      { method: "get", route: "/rdf/statistics/summary", body: undefined },
    ] as const)(
      "$method $route returns 403 without fetching the disallowed origin",
      async ({ method, route, body }) => {
        const app = createTestApp(".", undefined, allowedOrigins);
        const req = request(serve(app))
          [method](route)
          .set(
            dbHeaders({ "graph-db-connection-url": "https://blocked:8182" }),
          );
        const response = body ? await req.send(body) : await req;

        expect(response.status).toBe(403);
        expect(response.body.error.message).toContain("allowed origins list");
        expect(mockFetch).not.toHaveBeenCalledWith(
          expect.stringContaining("https://blocked:8182"),
          expect.anything(),
        );
      },
    );
  });
});

describe("resolveEndpointUrl", () => {
  it("appends a relative endpoint to the base path", () => {
    const url = resolveEndpointUrl(
      "https://neptune:8182",
      "pg/statistics/summary",
    );
    expect(url.href).toBe("https://neptune:8182/pg/statistics/summary");
  });

  it("preserves the base path when appending", () => {
    const url = resolveEndpointUrl("https://neptune:8182/blazegraph", "sparql");
    expect(url.href).toBe("https://neptune:8182/blazegraph/sparql");
  });

  it("preserves query params from the endpoint", () => {
    const url = resolveEndpointUrl(
      "https://neptune:8182",
      "pg/statistics/summary?mode=basic&foo=bar",
    );
    expect(url.href).toBe(
      "https://neptune:8182/pg/statistics/summary?mode=basic&foo=bar",
    );
  });

  it("throws if the resolved URL escapes the base origin", () => {
    expect(() =>
      resolveEndpointUrl("https://neptune:8182", "https://other-host.com/data"),
    ).toThrow(/does not match base/);
  });

  it("does not allow protocol-relative URLs to escape the origin", () => {
    expect(() =>
      // @ts-expect-error Testing runtime SSRF guard with input rejected by type
      resolveEndpointUrl("https://neptune:8182", "//other-host.com/data"),
    ).toThrow(/does not match base/);
  });
});
