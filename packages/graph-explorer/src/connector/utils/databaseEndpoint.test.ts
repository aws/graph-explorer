// @vitest-environment happy-dom
import type { NormalizedConnection } from "@/core";

import { MissingDatabaseUrlError } from "@/utils";
import { stubDocumentUrl } from "@/utils/testing";

import { databaseEndpoint } from "./databaseEndpoint";

function createConnection(
  overrides?: Partial<NormalizedConnection>,
): NormalizedConnection {
  return {
    queryEngine: "gremlin",
    graphDbUrl: "https://db.example.com:8182",
    awsAuthEnabled: false,
    ...overrides,
  };
}

describe("databaseEndpoint", () => {
  beforeEach(() => {
    stubDocumentUrl();
  });

  test("resolves against the Graph Explorer server for a proxy connection", () => {
    const result = databaseEndpoint(createConnection(), "gremlin");

    expect(result.href).toBe("http://localhost/gremlin");
  });

  test("resolves against the Graph Explorer server when proxyConnection is true", () => {
    const result = databaseEndpoint(
      createConnection({ proxyConnection: true }),
      "sparql",
    );

    expect(result.href).toBe("http://localhost/sparql");
  });

  test("resolves against graphDbUrl for a direct connection", () => {
    const result = databaseEndpoint(
      createConnection({ proxyConnection: false }),
      "openCypher",
    );

    expect(result.href).toBe("https://db.example.com:8182/openCypher");
  });

  test("keeps the path of graphDbUrl for a direct connection", () => {
    const result = databaseEndpoint(
      createConnection({
        graphDbUrl: "http://blazegraph:9999/blazegraph/namespace/kb",
        proxyConnection: false,
      }),
      "sparql",
    );

    expect(result.href).toBe(
      "http://blazegraph:9999/blazegraph/namespace/kb/sparql",
    );
  });

  test("keeps the query string for a direct connection", () => {
    const result = databaseEndpoint(
      createConnection({ proxyConnection: false }),
      "rdf/statistics/summary?mode=basic",
    );

    expect(result.href).toBe(
      "https://db.example.com:8182/rdf/statistics/summary?mode=basic",
    );
  });

  test("throws MissingDatabaseUrlError for a direct connection without a URL", () => {
    expect(() =>
      databaseEndpoint(
        createConnection({ graphDbUrl: "", proxyConnection: false }),
        "gremlin",
      ),
    ).toThrow(new MissingDatabaseUrlError());
  });
});
