import { apiUrl } from "./apiUrl";

describe("apiUrl", () => {
  test("resolves a simple endpoint relative to baseURI", () => {
    const result = apiUrl("gremlin", "http://localhost/explorer/");
    expect(result.href).toBe("http://localhost/gremlin");
  });

  test("resolves sparql endpoint", () => {
    const result = apiUrl("sparql", "http://localhost/explorer/");
    expect(result.href).toBe("http://localhost/sparql");
  });

  test("resolves openCypher endpoint", () => {
    const result = apiUrl("openCypher", "http://localhost/explorer/");
    expect(result.href).toBe("http://localhost/openCypher");
  });

  test("resolves endpoint with nested base path", () => {
    const result = apiUrl("gremlin", "http://localhost/proxy/9250/explorer/");
    expect(result.href).toBe("http://localhost/proxy/9250/gremlin");
  });

  test("resolves endpoint with query parameters", () => {
    const result = apiUrl(
      "pg/statistics/summary?mode=detailed",
      "http://localhost/explorer/",
    );
    expect(result.href).toBe(
      "http://localhost/pg/statistics/summary?mode=detailed",
    );
  });

  test("resolves logger endpoint", () => {
    const result = apiUrl("logger", "http://localhost/explorer/");
    expect(result.href).toBe("http://localhost/logger");
  });

  test("resolves defaultConnection endpoint", () => {
    const result = apiUrl("defaultConnection", "http://localhost/explorer/");
    expect(result.href).toBe("http://localhost/defaultConnection");
  });
});
