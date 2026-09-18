// @vitest-environment happy-dom
import { stubDocumentUrl } from "@/utils/testing";

import { apiUrl } from "./apiUrl";

describe("apiUrl", () => {
  test("resolves a simple endpoint under the static mount, with a trailing slash", () => {
    stubDocumentUrl("http://localhost/explorer/");

    const result = apiUrl("gremlin");

    expect(result.href).toBe("http://localhost/gremlin");
  });

  test("resolves a simple endpoint under the static mount, without a trailing slash", () => {
    stubDocumentUrl("http://localhost/explorer");

    const result = apiUrl("gremlin");

    expect(result.href).toBe("http://localhost/gremlin");
  });

  test("resolves under a reverse-proxy prefix, with a trailing slash", () => {
    stubDocumentUrl("http://localhost/proxy/9250/explorer/");

    const result = apiUrl("gremlin");

    expect(result.href).toBe("http://localhost/proxy/9250/gremlin");
  });

  test("resolves under a reverse-proxy prefix, without a trailing slash", () => {
    stubDocumentUrl("http://localhost/proxy/9250/explorer");

    const result = apiUrl("gremlin");

    expect(result.href).toBe("http://localhost/proxy/9250/gremlin");
  });

  test("resolves when the document path names a file under the static mount", () => {
    stubDocumentUrl("http://localhost/explorer/index.html");

    const result = apiUrl("gremlin");

    expect(result.href).toBe("http://localhost/gremlin");
  });

  test("resolves from the last occurrence when the mount segment repeats in the path", () => {
    stubDocumentUrl("http://localhost/explorer/explorer/");

    const result = apiUrl("gremlin");

    expect(result.href).toBe("http://localhost/explorer/gremlin");
  });

  test("resolves against the document root when the static mount segment is absent, as in dev mode", () => {
    stubDocumentUrl("http://localhost/");

    const result = apiUrl("gremlin");

    expect(result.href).toBe("http://localhost/gremlin");
  });

  test("preserves the query string on the endpoint", () => {
    stubDocumentUrl("http://localhost/explorer/");

    const result = apiUrl("pg/statistics/summary?mode=detailed");

    expect(result.href).toBe(
      "http://localhost/pg/statistics/summary?mode=detailed",
    );
  });
});
