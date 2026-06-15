import type { FeatureFlags, NormalizedConnection } from "@/core";

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
});
