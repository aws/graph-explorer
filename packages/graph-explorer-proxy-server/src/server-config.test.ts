import fs from "fs";
import path from "path";
import { describe, expect, it, vi } from "vite-plus/test";

import { type EnvironmentValues, parseEnvironmentValues } from "./env.ts";
import { clientRoot, proxyServerRoot } from "./paths.ts";
import {
  buildBaseUrl,
  logStartupWarnings,
  resolveServerConfig,
} from "./server-config.ts";
import { createTestEnvironment } from "./testing.ts";

const expectedKeyPath = path.join(proxyServerRoot, "cert-info/server.key");
const expectedCertPath = path.join(proxyServerRoot, "cert-info/server.crt");
const expectedStaticFilesPath = path.join(clientRoot, "dist");

describe("resolveServerConfig", () => {
  it("returns certificate paths relative to proxyServerRoot", () => {
    const config = resolveServerConfig(createTestEnvironment());

    expect(config.certificateKeyFilePath).toBe(expectedKeyPath);
    expect(config.certificateFilePath).toBe(expectedCertPath);
  });

  it("returns static file paths", () => {
    const config = resolveServerConfig(createTestEnvironment());

    expect(config.staticFilesVirtualPath).toBe("/explorer");
    expect(config.staticFilesPath).toBe(expectedStaticFilesPath);
  });

  describe("port", () => {
    function resolvePort(overrides: Partial<EnvironmentValues>) {
      vi.spyOn(fs, "existsSync").mockReturnValue(true);
      const { port, startupWarnings } = resolveServerConfig(
        createTestEnvironment(overrides),
      );
      return { port, startupWarnings };
    }

    it("defaults to 80 for HTTP with no warnings", () => {
      expect(resolvePort({})).toStrictEqual({ port: 80, startupWarnings: [] });
    });

    it("defaults to 443 for HTTPS with no warnings", () => {
      expect(
        resolvePort({ PROXY_SERVER_HTTPS_CONNECTION: true }),
      ).toStrictEqual({ port: 443, startupWarnings: [] });
    });

    it("uses PROXY_SERVER_PORT for HTTP", () => {
      expect(resolvePort({ PROXY_SERVER_PORT: 9250 })).toStrictEqual({
        port: 9250,
        startupWarnings: [],
      });
    });

    it("uses PROXY_SERVER_PORT for HTTPS", () => {
      expect(
        resolvePort({
          PROXY_SERVER_HTTPS_CONNECTION: true,
          PROXY_SERVER_PORT: 9250,
        }),
      ).toStrictEqual({ port: 9250, startupWarnings: [] });
    });

    it("prefers PROXY_SERVER_PORT and warns the old variable is ignored even when they match", () => {
      expect(
        resolvePort({ PROXY_SERVER_PORT: 9250, PROXY_SERVER_HTTP_PORT: 9250 }),
      ).toStrictEqual({
        port: 9250,
        startupWarnings: [
          "PROXY_SERVER_HTTP_PORT (9250) is ignored because PROXY_SERVER_PORT (9250) is set. PROXY_SERVER_HTTP_PORT is deprecated, remove it.",
        ],
      });
    });

    it("prefers PROXY_SERVER_PORT and warns about each old variable", () => {
      expect(
        resolvePort({
          PROXY_SERVER_HTTPS_CONNECTION: true,
          PROXY_SERVER_PORT: 9250,
          PROXY_SERVER_HTTP_PORT: 8080,
          PROXY_SERVER_HTTPS_PORT: 8443,
        }),
      ).toStrictEqual({
        port: 9250,
        startupWarnings: [
          "PROXY_SERVER_HTTPS_PORT (8443) is ignored because PROXY_SERVER_PORT (9250) is set. PROXY_SERVER_HTTPS_PORT is deprecated, remove it.",
          "PROXY_SERVER_HTTP_PORT has no effect while HTTPS is on. Remove it.",
        ],
      });
    });

    it("warns the HTTP variable has no effect while HTTPS is on, with or without PROXY_SERVER_PORT", () => {
      const warning =
        "PROXY_SERVER_HTTP_PORT has no effect while HTTPS is on. Remove it.";
      expect(
        resolvePort({
          PROXY_SERVER_HTTPS_CONNECTION: true,
          PROXY_SERVER_HTTP_PORT: 8080,
        }),
      ).toStrictEqual({ port: 443, startupWarnings: [warning] });
      expect(
        resolvePort({
          PROXY_SERVER_HTTPS_CONNECTION: true,
          PROXY_SERVER_PORT: 9250,
          PROXY_SERVER_HTTP_PORT: 8080,
        }),
      ).toStrictEqual({ port: 9250, startupWarnings: [warning] });
    });

    it("warns the HTTPS variable has no effect while HTTPS is off, with or without PROXY_SERVER_PORT", () => {
      const warning =
        "PROXY_SERVER_HTTPS_PORT has no effect while HTTPS is off. Remove it.";
      expect(resolvePort({ PROXY_SERVER_HTTPS_PORT: 8443 })).toStrictEqual({
        port: 80,
        startupWarnings: [warning],
      });
      expect(
        resolvePort({ PROXY_SERVER_PORT: 9250, PROXY_SERVER_HTTPS_PORT: 8443 }),
      ).toStrictEqual({ port: 9250, startupWarnings: [warning] });
    });

    it("builds the base URL from PROXY_SERVER_PORT", () => {
      const config = resolveServerConfig(
        createTestEnvironment({ HOST: "my-host", PROXY_SERVER_PORT: 9250 }),
      );

      expect(config.baseUrl).toBe("http://my-host:9250");
    });
  });

  /**
   * PROXY_SERVER_HTTP_PORT and PROXY_SERVER_HTTPS_PORT predate
   * PROXY_SERVER_PORT. Deployments, lifecycle scripts, and mounted `.env`
   * files still set them, and they must keep choosing the port, with a
   * deprecation warning, until a release removes them.
   *
   * These tests parse raw strings as the server does at startup, so they pin
   * what the old variables accept as well as the port they pick. Do not
   * delete them, or tighten the old variables' schema, without a release
   * that removes the variables.
   */
  describe("backward compatibility: deprecated PROXY_SERVER_HTTP_PORT / PROXY_SERVER_HTTPS_PORT", () => {
    function startWith(env: Record<string, string>) {
      vi.spyOn(fs, "existsSync").mockReturnValue(true);
      const { port, startupWarnings, baseUrl } = resolveServerConfig(
        parseEnvironmentValues({ HOST: "my-host", ...env }),
      );
      return { port, startupWarnings, baseUrl };
    }

    const httpDeprecated =
      "PROXY_SERVER_HTTP_PORT is deprecated. Use PROXY_SERVER_PORT instead.";
    const httpsDeprecated =
      "PROXY_SERVER_HTTPS_PORT is deprecated. Use PROXY_SERVER_PORT instead.";

    it("PROXY_SERVER_HTTP_PORT sets the HTTP port", () => {
      expect(startWith({ PROXY_SERVER_HTTP_PORT: "8080" })).toStrictEqual({
        port: 8080,
        startupWarnings: [httpDeprecated],
        baseUrl: "http://my-host:8080",
      });
    });

    it("PROXY_SERVER_HTTPS_PORT sets the HTTPS port", () => {
      expect(
        startWith({
          PROXY_SERVER_HTTPS_CONNECTION: "true",
          PROXY_SERVER_HTTPS_PORT: "8443",
        }),
      ).toStrictEqual({
        port: 8443,
        startupWarnings: [httpsDeprecated],
        baseUrl: "https://my-host:8443",
      });
    });

    it("each protocol reads only its own variable", () => {
      expect(
        startWith({
          PROXY_SERVER_HTTPS_CONNECTION: "true",
          PROXY_SERVER_HTTP_PORT: "8080",
          PROXY_SERVER_HTTPS_PORT: "8443",
        }).port,
      ).toBe(8443);
      expect(
        startWith({
          PROXY_SERVER_HTTP_PORT: "8080",
          PROXY_SERVER_HTTPS_PORT: "8443",
        }).port,
      ).toBe(8080);
    });

    it("the old variable of the listener that isn't running warns it has no effect", () => {
      expect(startWith({ PROXY_SERVER_HTTPS_PORT: "8443" })).toStrictEqual({
        port: 80,
        startupWarnings: [
          "PROXY_SERVER_HTTPS_PORT has no effect while HTTPS is off. Remove it.",
        ],
        baseUrl: "http://my-host",
      });
      expect(
        startWith({
          PROXY_SERVER_HTTPS_CONNECTION: "true",
          PROXY_SERVER_HTTP_PORT: "8080",
        }),
      ).toStrictEqual({
        port: 443,
        startupWarnings: [
          "PROXY_SERVER_HTTP_PORT has no effect while HTTPS is on. Remove it.",
        ],
        baseUrl: "https://my-host",
      });
    });

    // Port 0 asks the operating system for any free port. PROXY_SERVER_PORT
    // rejects these values, and the old variables keep accepting them.
    it.for(["", "0"])(
      "PROXY_SERVER_HTTP_PORT=%j still selects port 0",
      value => {
        expect(startWith({ PROXY_SERVER_HTTP_PORT: value })).toStrictEqual({
          port: 0,
          startupWarnings: [httpDeprecated],
          baseUrl: "http://my-host:0",
        });
      },
    );

    it.for(["", "0"])(
      "PROXY_SERVER_HTTPS_PORT=%j still selects port 0",
      value => {
        expect(
          startWith({
            PROXY_SERVER_HTTPS_CONNECTION: "true",
            PROXY_SERVER_HTTPS_PORT: value,
          }),
        ).toStrictEqual({
          port: 0,
          startupWarnings: [httpsDeprecated],
          baseUrl: "https://my-host:0",
        });
      },
    );

    it.for(["", "0"])(
      "PROXY_SERVER_HTTPS_PORT=%j still warns it has no effect while HTTPS is off",
      value => {
        expect(startWith({ PROXY_SERVER_HTTPS_PORT: value })).toStrictEqual({
          port: 80,
          startupWarnings: [
            "PROXY_SERVER_HTTPS_PORT has no effect while HTTPS is off. Remove it.",
          ],
          baseUrl: "http://my-host",
        });
      },
    );
  });

  it("sets useHttps to false when PROXY_SERVER_HTTPS_CONNECTION is false", () => {
    const config = resolveServerConfig(
      createTestEnvironment({ PROXY_SERVER_HTTPS_CONNECTION: false }),
    );

    expect(config.useHttps).toBe(false);
  });

  it("throws when HTTPS is enabled but cert files do not exist", () => {
    vi.spyOn(fs, "existsSync").mockReturnValue(false);

    expect(() =>
      resolveServerConfig(
        createTestEnvironment({ PROXY_SERVER_HTTPS_CONNECTION: true }),
      ),
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
      resolveServerConfig(
        createTestEnvironment({ PROXY_SERVER_HTTPS_CONNECTION: true }),
      ),
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
      resolveServerConfig(
        createTestEnvironment({ PROXY_SERVER_HTTPS_CONNECTION: true }),
      ),
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
      createTestEnvironment({ PROXY_SERVER_HTTPS_CONNECTION: true }),
    );

    expect(config.useHttps).toBe(true);
  });

  describe("ServerConfigError message content", () => {
    it("both files missing: message contains both paths", () => {
      vi.spyOn(fs, "existsSync").mockReturnValue(false);

      let message = "";
      try {
        resolveServerConfig(
          createTestEnvironment({ PROXY_SERVER_HTTPS_CONNECTION: true }),
        );
      } catch (e) {
        message = (e as Error).message;
      }

      expect(message).toContain("server.key");
      expect(message).toContain("server.crt");
    });

    it("only key missing: message contains key path but not cert path", () => {
      vi.spyOn(fs, "existsSync").mockImplementation(
        p => p === expectedCertPath,
      );

      let message = "";
      try {
        resolveServerConfig(
          createTestEnvironment({ PROXY_SERVER_HTTPS_CONNECTION: true }),
        );
      } catch (e) {
        message = (e as Error).message;
      }

      expect(message).toContain("server.key");
      expect(message).not.toContain("server.crt");
    });

    it("only cert missing: message contains cert path but not key path", () => {
      vi.spyOn(fs, "existsSync").mockImplementation(p => p === expectedKeyPath);

      let message = "";
      try {
        resolveServerConfig(
          createTestEnvironment({ PROXY_SERVER_HTTPS_CONNECTION: true }),
        );
      } catch (e) {
        message = (e as Error).message;
      }

      expect(message).toContain("server.crt");
      expect(message).not.toContain("server.key");
    });

    it("message includes the env var name", () => {
      vi.spyOn(fs, "existsSync").mockReturnValue(false);

      expect(() =>
        resolveServerConfig(
          createTestEnvironment({ PROXY_SERVER_HTTPS_CONNECTION: true }),
        ),
      ).toThrow(
        expect.objectContaining({
          message: expect.stringContaining("PROXY_SERVER_HTTPS_CONNECTION"),
        }),
      );
    });
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

describe("logStartupWarnings", () => {
  it("logs each warning once, in order", () => {
    const logger = { warn: vi.fn() };

    logStartupWarnings(["first", "second"], logger);

    expect(logger.warn.mock.calls).toStrictEqual([["first"], ["second"]]);
  });

  it("logs nothing without warnings", () => {
    const logger = { warn: vi.fn() };

    logStartupWarnings([], logger);

    expect(logger.warn).not.toHaveBeenCalled();
  });
});
