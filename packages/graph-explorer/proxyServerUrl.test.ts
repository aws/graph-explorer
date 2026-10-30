import { describe, expect, it } from "vite-plus/test";

import { proxyServerUrl } from "./proxyServerUrl";

describe("proxyServerUrl", () => {
  it("uses PROXY_SERVER_PORT", () => {
    expect(proxyServerUrl({ PROXY_SERVER_PORT: "9250" })).toBe(
      "http://localhost:9250",
    );
  });

  it("falls back to the deprecated PROXY_SERVER_HTTP_PORT", () => {
    expect(proxyServerUrl({ PROXY_SERVER_HTTP_PORT: "8080" })).toBe(
      "http://localhost:8080",
    );
  });

  it("prefers PROXY_SERVER_PORT over PROXY_SERVER_HTTP_PORT", () => {
    expect(
      proxyServerUrl({
        PROXY_SERVER_PORT: "9250",
        PROXY_SERVER_HTTP_PORT: "8080",
      }),
    ).toBe("http://localhost:9250");
  });

  it("defaults to port 80, which the URL omits", () => {
    expect(proxyServerUrl({})).toBe("http://localhost");
  });

  it("omits an explicit port 80", () => {
    expect(proxyServerUrl({ PROXY_SERVER_PORT: "80" })).toBe(
      "http://localhost",
    );
  });
});
