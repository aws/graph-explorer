import fs from "fs";
import path from "path";

import type { EnvironmentValues } from "./env.js";

import { clientRoot, proxyServerRoot } from "./paths.js";
import { buildBaseUrl, resolveServerConfig } from "./server-config.js";

const expectedKeyPath = path.join(proxyServerRoot, "cert-info/server.key");
const expectedCertPath = path.join(proxyServerRoot, "cert-info/server.crt");
const expectedStaticFilesPath = path.join(clientRoot, "dist");

function createEnv(
  overrides: Partial<EnvironmentValues> = {},
): EnvironmentValues {
  return {
    HOST: "localhost",
    PROXY_SERVER_HTTPS_CONNECTION: false,
    PROXY_SERVER_HTTPS_PORT: 443,
    PROXY_SERVER_HTTP_PORT: 80,
    LOG_LEVEL: "debug",
    LOG_STYLE: "default",
    ...overrides,
  };
}

describe("resolveServerConfig", () => {
  it("returns certificate paths relative to proxyServerRoot", () => {
    const config = resolveServerConfig(createEnv());

    expect(config.certificateKeyFilePath).toBe(expectedKeyPath);
    expect(config.certificateFilePath).toBe(expectedCertPath);
  });

  it("returns static file paths", () => {
    const config = resolveServerConfig(createEnv());

    expect(config.staticFilesVirtualPath).toBe("/explorer");
    expect(config.staticFilesPath).toBe(expectedStaticFilesPath);
  });

  it("passes through host and port values from env", () => {
    const config = resolveServerConfig(
      createEnv({
        HOST: "my-host",
        PROXY_SERVER_HTTP_PORT: 8080,
      }),
    );

    expect(config.host).toBe("my-host");
    expect(config.port).toBe(8080);
    expect(config.baseUrl).toBe("http://my-host:8080");
  });

  it("returns HTTPS port and baseUrl when useHttps is true", () => {
    vi.spyOn(fs, "existsSync").mockReturnValue(true);

    const config = resolveServerConfig(
      createEnv({
        HOST: "my-host",
        PROXY_SERVER_HTTPS_CONNECTION: true,
        PROXY_SERVER_HTTP_PORT: 8080,
        PROXY_SERVER_HTTPS_PORT: 8443,
      }),
    );

    expect(config.port).toBe(8443);
    expect(config.baseUrl).toBe("https://my-host:8443");
  });

  it("sets useHttps to false when PROXY_SERVER_HTTPS_CONNECTION is false", () => {
    const config = resolveServerConfig(
      createEnv({ PROXY_SERVER_HTTPS_CONNECTION: false }),
    );

    expect(config.useHttps).toBe(false);
  });

  it("throws when HTTPS is enabled but cert files do not exist", () => {
    vi.spyOn(fs, "existsSync").mockReturnValue(false);

    expect(() =>
      resolveServerConfig(createEnv({ PROXY_SERVER_HTTPS_CONNECTION: true })),
    ).toThrow(
      expect.objectContaining({
        name: "ServerConfigError",
        message: expect.stringContaining(expectedKeyPath),
      }),
    );
  });

  it("throws when HTTPS is enabled but only the key file exists", () => {
    vi.spyOn(fs, "existsSync").mockImplementation(p => p === expectedKeyPath);

    expect(() =>
      resolveServerConfig(createEnv({ PROXY_SERVER_HTTPS_CONNECTION: true })),
    ).toThrow(
      expect.objectContaining({
        name: "ServerConfigError",
        message: expect.stringContaining(expectedCertPath),
      }),
    );
  });

  it("throws when HTTPS is enabled but only the cert file exists", () => {
    vi.spyOn(fs, "existsSync").mockImplementation(p => p === expectedCertPath);

    expect(() =>
      resolveServerConfig(createEnv({ PROXY_SERVER_HTTPS_CONNECTION: true })),
    ).toThrow(
      expect.objectContaining({
        name: "ServerConfigError",
        message: expect.stringContaining(expectedKeyPath),
      }),
    );
  });

  it("sets useHttps to true when HTTPS is enabled and both cert files exist", () => {
    vi.spyOn(fs, "existsSync").mockReturnValue(true);

    const config = resolveServerConfig(
      createEnv({ PROXY_SERVER_HTTPS_CONNECTION: true }),
    );

    expect(config.useHttps).toBe(true);
  });
});

describe("buildBaseUrl", () => {
  it("returns http URL with custom port", () => {
    expect(buildBaseUrl(false, "localhost", 8080)).toBe(
      "http://localhost:8080",
    );
  });

  it("omits port 80 for http", () => {
    expect(buildBaseUrl(false, "localhost", 80)).toBe("http://localhost");
  });

  it("returns https URL with custom port", () => {
    expect(buildBaseUrl(true, "localhost", 8443)).toBe(
      "https://localhost:8443",
    );
  });

  it("omits port 443 for https", () => {
    expect(buildBaseUrl(true, "localhost", 443)).toBe("https://localhost");
  });
});
