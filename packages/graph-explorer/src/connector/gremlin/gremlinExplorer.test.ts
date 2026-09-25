import type { FeatureFlags, NormalizedConnection } from "@/core";

import { DatabaseTimeoutError, FetchTimeoutError } from "@/utils";
import { abortableFetch } from "@/utils/testing";

import { createGremlinExplorer } from "./gremlinExplorer";

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

const emptyGremlinList = {
  result: {
    data: { "@type": "g:List", "@value": [{ "@type": "g:Map", "@value": [] }] },
  },
};

describe("createGremlinExplorer", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);
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
          Promise.resolve(jsonResponse(emptyGremlinList)),
        );

      const explorer = createGremlinExplorer(
        createConnection(),
        createFeatureFlags(),
      );
      await explorer.fetchSchema();

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:8182/pg/statistics/summary?mode=basic",
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
          Promise.resolve(jsonResponse(emptyGremlinList)),
        );

      const explorer = createGremlinExplorer(
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
    it("throws DatabaseTimeoutError for a Gremlin Server evaluation timeout", async () => {
      // Captured from a local `tinkerpop/gremlin-server:3.8` container after
      // a query exceeded the server's `evaluationTimeout`.
      mockFetch.mockResolvedValue(
        new Response(
          JSON.stringify({
            message:
              "Evaluation exceeded the configured 'evaluationTimeout' threshold of 30000 ms or evaluation was otherwise cancelled directly for request [...]",
            "Exception-Class": "java.util.concurrent.TimeoutException",
            exceptions: ["java.util.concurrent.TimeoutException"],
            requestId: "65a196b9-48a3-48c0-911a-b73ae7903f04",
          }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        ),
      );

      const explorer = createGremlinExplorer(
        createConnection(),
        createFeatureFlags(),
      );

      const error = await explorer
        .rawQuery({ query: "g.V().limit(10)" })
        .catch(e => e);

      expect(error).toBeInstanceOf(DatabaseTimeoutError);
      expect(error.databaseCode).toBe("java.util.concurrent.TimeoutException");
    });

    it("throws FetchTimeoutError when the connection's fetch timeout is exceeded", async () => {
      mockFetch.mockImplementation(abortableFetch);

      const explorer = createGremlinExplorer(
        createConnection({ fetchTimeoutMs: 1 }),
        createFeatureFlags(),
      );

      const error = await explorer
        .rawQuery({ query: "g.V().limit(10)" })
        .catch(e => e);

      expect(error).toBeInstanceOf(FetchTimeoutError);
      expect(error.timeoutMs).toBe(1);
    });
  });
});
