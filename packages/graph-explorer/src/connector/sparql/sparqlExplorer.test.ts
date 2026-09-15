// @vitest-environment happy-dom
import type { FeatureFlags, NormalizedConnection } from "@/core";

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
    document.head.innerHTML = '<base href="http://localhost/explorer/" />';
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
});
