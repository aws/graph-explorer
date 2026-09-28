// @vitest-environment happy-dom
import type { FeatureFlags, NormalizedConnection } from "@/core";

import { DatabaseTimeoutError, FetchTimeoutError } from "@/utils";
import {
  abortableFetch,
  headersSentTo,
  stubDocumentUrl,
} from "@/utils/testing";

import { createSparqlExplorer } from "./sparqlExplorer";

function createConnection(
  overrides?: Partial<NormalizedConnection>,
): NormalizedConnection {
  return {
    queryEngine: "sparql",
    graphDbUrl: "https://my-neptune:8182",
    awsAuthEnabled: false,
    ...overrides,
  };
}

function createFeatureFlags(): FeatureFlags {
  return {
    showDebugActions: false,
    allowLoggingDbQuery: false,
  };
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("createSparqlExplorer", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);
    stubDocumentUrl();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("fetchSchema", () => {
    it("requests the summary API with mode=basic", async () => {
      const summaryResponse = {
        payload: {
          graphSummary: {
            numDistinctSubjects: 10,
            numQuads: 5,
            numClasses: 1,
            classes: ["http://example.org/Person"],
            predicates: [{ "http://example.org/knows": 5 }],
          },
        },
      };
      mockFetch
        .mockResolvedValueOnce(jsonResponse(summaryResponse))
        .mockImplementation(() =>
          Promise.resolve(jsonResponse({ results: { bindings: [] } })),
        );

      const explorer = createSparqlExplorer(
        createConnection(),
        createFeatureFlags(),
        new Map(),
      );
      await explorer.fetchSchema();

      expect(mockFetch).toHaveBeenCalledWith(
        new URL("http://localhost/rdf/statistics/summary?mode=basic"),
        expect.objectContaining({ method: "GET" }),
      );
    });

    it("falls back to query-based discovery when summary API fails", async () => {
      mockFetch
        .mockResolvedValueOnce(
          new Response("Not Found", {
            status: 404,
            headers: { "Content-Type": "text/plain" },
          }),
        )
        .mockImplementation(() =>
          Promise.resolve(jsonResponse({ results: { bindings: [] } })),
        );

      const explorer = createSparqlExplorer(
        createConnection(),
        createFeatureFlags(),
        new Map(),
      );
      const schema = await explorer.fetchSchema();

      expect(schema).toBeDefined();
      expect(schema).toHaveProperty("vertices");
      expect(schema).toHaveProperty("edges");
    });
  });

  describe("rawQuery", () => {
    it("throws DatabaseTimeoutError for a Neptune query timeout", async () => {
      mockFetch.mockResolvedValue(
        new Response(
          JSON.stringify({
            requestId: "abc-123",
            code: "TimeLimitExceededException",
            detailedMessage: "A timeout occurred during the request.",
          }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        ),
      );

      const explorer = createSparqlExplorer(
        createConnection(),
        createFeatureFlags(),
        new Map(),
      );

      const error = await explorer
        .rawQuery({ query: "SELECT * WHERE { ?s ?p ?o } LIMIT 10" })
        .catch(e => e);

      expect(error).toBeInstanceOf(DatabaseTimeoutError);
      expect(error.databaseCode).toBe("TimeLimitExceededException");
    });

    it("throws FetchTimeoutError when the connection's fetch timeout is exceeded", async () => {
      mockFetch.mockImplementation(abortableFetch);

      const explorer = createSparqlExplorer(
        createConnection({ fetchTimeoutMs: 1 }),
        createFeatureFlags(),
        new Map(),
      );

      const error = await explorer
        .rawQuery({ query: "SELECT * WHERE { ?s ?p ?o } LIMIT 10" })
        .catch(e => e);

      expect(error).toBeInstanceOf(FetchTimeoutError);
      expect(error.timeoutMs).toBe(1);
    });
  });
  describe("request routing", () => {
    it("sends a proxy connection's keyword search to the Graph Explorer server with a queryId", async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve(
          jsonResponse({ head: { vars: [] }, results: { bindings: [] } }),
        ),
      );

      const explorer = createSparqlExplorer(
        createConnection(),
        createFeatureFlags(),
        new Map(),
      );
      await explorer.keywordSearch({ searchTerm: "person" });

      expect(mockFetch).toHaveBeenCalledWith(
        new URL("http://localhost/sparql"),
        expect.objectContaining({
          headers: expect.objectContaining({
            "graph-db-connection-url": "https://my-neptune:8182",
            queryId: expect.any(String),
          }),
        }),
      );
    });

    it("sends a direct connection's keyword search to the database without proxy headers", async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve(
          jsonResponse({ head: { vars: [] }, results: { bindings: [] } }),
        ),
      );

      const explorer = createSparqlExplorer(
        createConnection({ proxyConnection: false }),
        createFeatureFlags(),
        new Map(),
      );
      await explorer.keywordSearch({ searchTerm: "person" });

      expect(
        headersSentTo(mockFetch, "https://my-neptune:8182/sparql"),
      ).toStrictEqual({
        accept: "application/sparql-results+json",
        "content-type": "application/x-www-form-urlencoded",
      });
    });

    it("requests a direct connection's summary from the database", async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve(
          jsonResponse({ head: { vars: [] }, results: { bindings: [] } }),
        ),
      );

      const explorer = createSparqlExplorer(
        createConnection({ proxyConnection: false }),
        createFeatureFlags(),
        new Map(),
      );
      await explorer.fetchSchema();

      expect(mockFetch).toHaveBeenCalledWith(
        new URL("https://my-neptune:8182/rdf/statistics/summary?mode=basic"),
        expect.objectContaining({ method: "GET" }),
      );
    });
  });
});
