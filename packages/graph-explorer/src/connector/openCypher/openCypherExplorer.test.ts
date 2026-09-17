// @vitest-environment happy-dom
import type { FeatureFlags, NormalizedConnection } from "@/core";

import { DatabaseTimeoutError, FetchTimeoutError } from "@/utils";
import { abortableFetch, stubApiBaseUri } from "@/utils/testing";

import { createOpenCypherExplorer } from "./openCypherExplorer";

function createConnection(
  overrides?: Partial<NormalizedConnection>,
): NormalizedConnection {
  return {
    queryEngine: "openCypher",
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

describe("createOpenCypherExplorer", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);
    stubApiBaseUri();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("fetchSchema", () => {
    it("requests the summary API with mode=basic", async () => {
      const summaryResponse = {
        payload: {
          graphSummary: {
            numNodes: 10,
            numEdges: 5,
            nodeLabels: ["Person"],
            edgeLabels: ["knows"],
          },
        },
      };
      mockFetch
        .mockResolvedValueOnce(jsonResponse(summaryResponse))
        .mockImplementation(() =>
          Promise.resolve(jsonResponse({ results: [] })),
        );

      const explorer = createOpenCypherExplorer(
        createConnection(),
        createFeatureFlags(),
      );
      await explorer.fetchSchema();

      expect(mockFetch).toHaveBeenCalledWith(
        new URL("http://localhost/pg/statistics/summary?mode=basic"),
        expect.objectContaining({ method: "GET" }),
      );
    });

    it("requests the summary API from non-standard endpoint for neptune-graph service type", async () => {
      const summaryResponse = {
        graphSummary: {
          numNodes: 10,
          numEdges: 5,
          nodeLabels: ["Person"],
          edgeLabels: ["knows"],
        },
      };
      mockFetch
        .mockResolvedValueOnce(jsonResponse(summaryResponse))
        .mockImplementation(() =>
          Promise.resolve(jsonResponse({ results: [] })),
        );

      const explorer = createOpenCypherExplorer(
        createConnection({ serviceType: "neptune-graph" }),
        createFeatureFlags(),
      );
      await explorer.fetchSchema();

      expect(mockFetch).toHaveBeenCalledWith(
        new URL("http://localhost/summary?mode=basic"),
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
          Promise.resolve(jsonResponse({ results: [] })),
        );

      const explorer = createOpenCypherExplorer(
        createConnection(),
        createFeatureFlags(),
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

      const explorer = createOpenCypherExplorer(
        createConnection(),
        createFeatureFlags(),
      );

      const error = await explorer
        .rawQuery({ query: "MATCH (n) RETURN n LIMIT 10" })
        .catch(e => e);

      expect(error).toBeInstanceOf(DatabaseTimeoutError);
      expect(error.databaseCode).toBe("TimeLimitExceededException");
    });

    it("throws FetchTimeoutError when the connection's fetch timeout is exceeded", async () => {
      mockFetch.mockImplementation(abortableFetch);

      const explorer = createOpenCypherExplorer(
        createConnection({ fetchTimeoutMs: 1 }),
        createFeatureFlags(),
      );

      const error = await explorer
        .rawQuery({ query: "MATCH (n) RETURN n LIMIT 10" })
        .catch(e => e);

      expect(error).toBeInstanceOf(FetchTimeoutError);
      expect(error.timeoutMs).toBe(1);
    });
  });
});
