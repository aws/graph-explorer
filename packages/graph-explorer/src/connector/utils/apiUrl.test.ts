// @vitest-environment happy-dom
import { stubApiBaseUri } from "@/utils/testing";

import { apiUrl } from "./apiUrl";

describe("apiUrl", () => {
  test("resolves a simple endpoint relative to baseURI", () => {
    stubApiBaseUri("http://localhost/explorer/");

    const result = apiUrl("gremlin");

    expect(result.href).toBe("http://localhost/gremlin");
  });

  test("resolves endpoint with nested base path", () => {
    stubApiBaseUri("http://localhost/proxy/9250/explorer/");

    const result = apiUrl("gremlin");

    expect(result.href).toBe("http://localhost/proxy/9250/gremlin");
  });

  test("resolves endpoint with query parameters", () => {
    stubApiBaseUri("http://localhost/explorer/");

    const result = apiUrl("pg/statistics/summary?mode=detailed");

    expect(result.href).toBe(
      "http://localhost/pg/statistics/summary?mode=detailed",
    );
  });
});
