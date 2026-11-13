import { describe, expect, it } from "vite-plus/test";

import { EnvironmentValuesSchema, formatEnvironmentError } from "./env.ts";

/** The text logged for an environment that fails to parse. */
function parseFailure(env: Record<string, string>) {
  const result = EnvironmentValuesSchema.safeParse(env);
  if (result.success) {
    throw new Error("Expected the environment to fail to parse");
  }
  return formatEnvironmentError(result.error);
}

describe("EnvironmentValuesSchema", () => {
  it("returns defaults when env is empty", () => {
    const result = EnvironmentValuesSchema.parse({});

    expect(result.HOST).toBe("localhost");
    expect(result.PROXY_SERVER_LISTEN_ADDRESS).toBe("127.0.0.1");
    expect(result.NEPTUNE_NOTEBOOK).toBe(false);
    expect(result.PROXY_SERVER_HTTPS_CONNECTION).toBe(false);
    // The port defaults depend on HTTPS, so resolveServerConfig applies them.
    expect(result.PROXY_SERVER_PORT).toBeUndefined();
    expect(result.PROXY_SERVER_HTTPS_PORT).toBeUndefined();
    expect(result.PROXY_SERVER_HTTP_PORT).toBeUndefined();
    expect(result.LOG_LEVEL).toBe("info");
    expect(result.LOG_STYLE).toBe("default");
  });

  // The startup configuration applies the notebook preset only on an exact
  // `true`, as the shell scripts did. The server has to agree, or it would
  // refuse a server that has always run with HTTPS.
  describe("NEPTUNE_NOTEBOOK matches the exact-match rule", () => {
    it("is true only for the exact string true", () => {
      expect(
        EnvironmentValuesSchema.parse({ NEPTUNE_NOTEBOOK: "true" })
          .NEPTUNE_NOTEBOOK,
      ).toBe(true);
    });

    it("is false when unset", () => {
      expect(EnvironmentValuesSchema.parse({}).NEPTUNE_NOTEBOOK).toBe(false);
    });

    // `-e NEPTUNE_NOTEBOOK=` arrives set but empty.
    it.each(["", "false", "TRUE", "True", "1", "yes", "on", " true"])(
      "is false for %j without failing the parse",
      value => {
        const result = EnvironmentValuesSchema.safeParse({
          NEPTUNE_NOTEBOOK: value,
        });

        expect(result.data?.NEPTUNE_NOTEBOOK).toBe(false);
      },
    );
  });

  describe("NEPTUNE_NOTEBOOK conflicts with an explicit HTTPS request", () => {
    const conflictMessage =
      "NEPTUNE_NOTEBOOK and PROXY_SERVER_HTTPS_CONNECTION are both true. " +
      "The Neptune Notebook preset serves Graph Explorer over HTTP and does " +
      "not generate TLS certificates, so this combination cannot start. " +
      "Either set PROXY_SERVER_HTTPS_CONNECTION to false or remove it " +
      "(from -e flags or config.json) to run under the notebook preset, " +
      "or set NEPTUNE_NOTEBOOK to false to run with TLS.";

    // Failing the parse stops the server before it looks for certificates, so
    // the operator sees the conflict rather than a missing-certificate error.
    it("fails the parse at PROXY_SERVER_HTTPS_CONNECTION with the conflict", () => {
      const output = parseFailure({
        NEPTUNE_NOTEBOOK: "true",
        PROXY_SERVER_HTTPS_CONNECTION: "true",
      });

      expect(output).toContain(
        `✖ ${conflictMessage}\n  → at PROXY_SERVER_HTTPS_CONNECTION`,
      );
    });

    it("fails the parse for HTTPS in any case", () => {
      const output = parseFailure({
        NEPTUNE_NOTEBOOK: "true",
        PROXY_SERVER_HTTPS_CONNECTION: "TRUE",
      });

      expect(output).toContain(conflictMessage);
    });

    it("allows the notebook preset on its own", () => {
      const result = EnvironmentValuesSchema.parse({
        NEPTUNE_NOTEBOOK: "true",
        PROXY_SERVER_HTTPS_CONNECTION: "false",
      });

      expect(result.NEPTUNE_NOTEBOOK).toBe(true);
      expect(result.PROXY_SERVER_HTTPS_CONNECTION).toBe(false);
    });

    it("allows HTTPS on its own", () => {
      const result = EnvironmentValuesSchema.parse({
        NEPTUNE_NOTEBOOK: "false",
        PROXY_SERVER_HTTPS_CONNECTION: "true",
      });

      expect(result.NEPTUNE_NOTEBOOK).toBe(false);
      expect(result.PROXY_SERVER_HTTPS_CONNECTION).toBe(true);
    });
  });

  it("parses provided values", () => {
    const result = EnvironmentValuesSchema.parse({
      HOST: "my-server",
      PROXY_SERVER_HTTP_PORT: "8080",
      LOG_LEVEL: "error",
    });

    expect(result.HOST).toBe("my-server");
    expect(result.PROXY_SERVER_HTTP_PORT).toBe(8080);
    expect(result.LOG_LEVEL).toBe("error");
  });

  it("overrides all defaults", () => {
    const result = EnvironmentValuesSchema.parse({
      HOST: "my-server.example.com",
      PROXY_SERVER_LISTEN_ADDRESS: "192.0.2.10",
      PROXY_SERVER_HTTPS_CONNECTION: "true",
      PROXY_SERVER_HTTPS_PORT: "8443",
      PROXY_SERVER_HTTP_PORT: "8080",
      LOG_LEVEL: "error",
      LOG_STYLE: "cloudwatch",
    });

    expect(result.HOST).toBe("my-server.example.com");
    expect(result.PROXY_SERVER_LISTEN_ADDRESS).toBe("192.0.2.10");
    expect(result.PROXY_SERVER_HTTPS_CONNECTION).toBe(true);
    expect(result.PROXY_SERVER_HTTPS_PORT).toBe(8443);
    expect(result.PROXY_SERVER_HTTP_PORT).toBe(8080);
    expect(result.LOG_LEVEL).toBe("error");
    expect(result.LOG_STYLE).toBe("cloudwatch");
  });

  it("handles boolean values case-insensitively", () => {
    expect(
      EnvironmentValuesSchema.parse({ PROXY_SERVER_HTTPS_CONNECTION: "TRUE" })
        .PROXY_SERVER_HTTPS_CONNECTION,
    ).toBe(true);

    expect(
      EnvironmentValuesSchema.parse({ PROXY_SERVER_HTTPS_CONNECTION: "False" })
        .PROXY_SERVER_HTTPS_CONNECTION,
    ).toBe(false);
  });

  it("coerces port strings to numbers", () => {
    const result = EnvironmentValuesSchema.parse({
      PROXY_SERVER_HTTP_PORT: "3000",
      PROXY_SERVER_HTTPS_PORT: "3443",
    });

    expect(result.PROXY_SERVER_HTTP_PORT).toBe(3000);
    expect(result.PROXY_SERVER_HTTPS_PORT).toBe(3443);
  });

  it("parses PROXY_SERVER_PORT", () => {
    expect(
      EnvironmentValuesSchema.parse({ PROXY_SERVER_PORT: "9250" })
        .PROXY_SERVER_PORT,
    ).toBe(9250);
  });

  describe("validation failures", () => {
    it("fails on invalid PROXY_SERVER_HTTPS_CONNECTION", () => {
      expect(parseFailure({ PROXY_SERVER_HTTPS_CONNECTION: "yes" })).toContain(
        'Must be "true" or "false"',
      );
    });

    it("fails on an empty PROXY_SERVER_HTTPS_CONNECTION", () => {
      expect(parseFailure({ PROXY_SERVER_HTTPS_CONNECTION: "" })).toContain(
        'Must be "true" or "false"',
      );
    });

    // "tcp://…" is the value a Kubernetes Service named proxy-server injects.
    it.for(["", "abc", "0", "65536", "80.5", "-1", "tcp://10.43.0.5:80"])(
      "fails on PROXY_SERVER_PORT=%j",
      value => {
        const output = parseFailure({ PROXY_SERVER_PORT: value });

        expect(output).toContain("Must be a port number from 1 to 65535");
        expect(output).toContain("PROXY_SERVER_PORT");
      },
    );

    it("fails on invalid LOG_LEVEL", () => {
      expect(parseFailure({ LOG_LEVEL: "verbose" })).toContain("LOG_LEVEL");
    });

    it("fails on invalid LOG_STYLE", () => {
      expect(parseFailure({ LOG_STYLE: "json" })).toContain("LOG_STYLE");
    });

    it("fails when PROXY_SERVER_CORS_ORIGIN is missing the scheme", () => {
      expect(
        parseFailure({ PROXY_SERVER_CORS_ORIGIN: "my-app.example.com" }),
      ).toContain("Must be an HTTP or HTTPS URL");
    });

    it("fails when PROXY_SERVER_CORS_ORIGIN is a wildcard", () => {
      expect(parseFailure({ PROXY_SERVER_CORS_ORIGIN: "*" })).toContain(
        "PROXY_SERVER_CORS_ORIGIN",
      );
    });

    it("fails when PROXY_SERVER_CORS_ORIGIN has a trailing comma", () => {
      expect(
        parseFailure({ PROXY_SERVER_CORS_ORIGIN: "https://example.com," }),
      ).toContain("PROXY_SERVER_CORS_ORIGIN");
    });

    it("formats the error details on validation failure", () => {
      expect(parseFailure({ LOG_LEVEL: "verbose" })).toMatch(
        /^Failed to parse environment values\n.*LOG_LEVEL/s,
      );
    });
  });

  it("ignores unknown env vars", () => {
    const result = EnvironmentValuesSchema.parse({
      HOST: "my-server",
      SOME_OTHER_VAR: "ignored",
    });

    expect(result.HOST).toBe("my-server");
    expect(result).not.toHaveProperty("SOME_OTHER_VAR");
  });

  it("parses PROXY_SERVER_CORS_ORIGIN when provided", () => {
    const result = EnvironmentValuesSchema.parse({
      PROXY_SERVER_CORS_ORIGIN: "https://my-app.example.com",
    });

    expect(result.PROXY_SERVER_CORS_ORIGIN).toStrictEqual([
      "https://my-app.example.com",
    ]);
  });

  it("parses comma-separated PROXY_SERVER_CORS_ORIGIN values", () => {
    const result = EnvironmentValuesSchema.parse({
      PROXY_SERVER_CORS_ORIGIN:
        "https://app-a.example.com,https://app-b.example.com",
    });

    expect(result.PROXY_SERVER_CORS_ORIGIN).toStrictEqual([
      "https://app-a.example.com",
      "https://app-b.example.com",
    ]);
  });

  it("trims whitespace around comma-separated PROXY_SERVER_CORS_ORIGIN values", () => {
    const result = EnvironmentValuesSchema.parse({
      PROXY_SERVER_CORS_ORIGIN:
        "https://app-a.example.com , https://app-b.example.com",
    });

    expect(result.PROXY_SERVER_CORS_ORIGIN).toStrictEqual([
      "https://app-a.example.com",
      "https://app-b.example.com",
    ]);
  });

  it("defaults PROXY_SERVER_CORS_ORIGIN to undefined when not provided", () => {
    const result = EnvironmentValuesSchema.parse({});

    expect(result.PROXY_SERVER_CORS_ORIGIN).toBeUndefined();
  });

  it("treats empty PROXY_SERVER_CORS_ORIGIN as unset", () => {
    const result = EnvironmentValuesSchema.parse({
      PROXY_SERVER_CORS_ORIGIN: "",
    });

    expect(result.PROXY_SERVER_CORS_ORIGIN).toBeUndefined();
  });

  it("strips trailing slash from PROXY_SERVER_CORS_ORIGIN", () => {
    const result = EnvironmentValuesSchema.parse({
      PROXY_SERVER_CORS_ORIGIN: "https://my-app.example.com/",
    });

    expect(result.PROXY_SERVER_CORS_ORIGIN).toStrictEqual([
      "https://my-app.example.com",
    ]);
  });

  it("strips path from PROXY_SERVER_CORS_ORIGIN", () => {
    const result = EnvironmentValuesSchema.parse({
      PROXY_SERVER_CORS_ORIGIN: "https://my-app.example.com/app",
    });

    expect(result.PROXY_SERVER_CORS_ORIGIN).toStrictEqual([
      "https://my-app.example.com",
    ]);
  });

  describe("PROXY_SERVER_LISTEN_ADDRESS", () => {
    it.each([
      "127.0.0.1",
      "0.0.0.0",
      "192.0.2.10",
      "::",
      "::1",
      "2001:db8::10",
    ])("accepts the IP literal %s", address => {
      expect(
        EnvironmentValuesSchema.parse({ PROXY_SERVER_LISTEN_ADDRESS: address })
          .PROXY_SERVER_LISTEN_ADDRESS,
      ).toBe(address);
    });
  });

  describe("PROXY_SERVER_LISTEN_ADDRESS validation failures", () => {
    it.each([
      "",
      "localhost",
      "graph-explorer.example.com",
      "[::1]",
      "127.0.0.1:8080",
    ])("fails naming the variable for %j", value => {
      const output = parseFailure({ PROXY_SERVER_LISTEN_ADDRESS: value });

      expect(output).toContain("→ at PROXY_SERVER_LISTEN_ADDRESS");
      expect(output).toContain(
        "Must be an IP address such as 127.0.0.1 or ::. An empty value and a hostname are not accepted. Remove the variable to use the default.",
      );
    });
  });

  describe("PROXY_SERVER_ALLOWED_DB_ORIGINS", () => {
    it("defaults to undefined when not provided", () => {
      const result = EnvironmentValuesSchema.parse({});
      expect(result.PROXY_SERVER_ALLOWED_DB_ORIGINS).toBeUndefined();
    });

    it("treats empty string as unset", () => {
      const result = EnvironmentValuesSchema.parse({
        PROXY_SERVER_ALLOWED_DB_ORIGINS: "",
      });
      expect(result.PROXY_SERVER_ALLOWED_DB_ORIGINS).toBeUndefined();
    });

    it("parses a single origin into a Set", () => {
      const result = EnvironmentValuesSchema.parse({
        PROXY_SERVER_ALLOWED_DB_ORIGINS: "https://neptune:8182",
      });
      expect(result.PROXY_SERVER_ALLOWED_DB_ORIGINS).toEqual(
        new Set(["https://neptune:8182"]),
      );
    });

    it("parses comma-separated origins into a Set", () => {
      const result = EnvironmentValuesSchema.parse({
        PROXY_SERVER_ALLOWED_DB_ORIGINS:
          "https://neptune:8182,https://other-db:8182",
      });
      expect(result.PROXY_SERVER_ALLOWED_DB_ORIGINS).toEqual(
        new Set(["https://neptune:8182", "https://other-db:8182"]),
      );
    });

    it("trims whitespace around values", () => {
      const result = EnvironmentValuesSchema.parse({
        PROXY_SERVER_ALLOWED_DB_ORIGINS:
          " https://neptune:8182 , https://other:8182 ",
      });
      expect(result.PROXY_SERVER_ALLOWED_DB_ORIGINS).toEqual(
        new Set(["https://neptune:8182", "https://other:8182"]),
      );
    });

    it("accepts a trailing slash (treated as no path)", () => {
      const result = EnvironmentValuesSchema.parse({
        PROXY_SERVER_ALLOWED_DB_ORIGINS: "https://neptune:8182/",
      });
      expect(result.PROXY_SERVER_ALLOWED_DB_ORIGINS).toEqual(
        new Set(["https://neptune:8182"]),
      );
    });

    it("normalizes case to lowercase", () => {
      const result = EnvironmentValuesSchema.parse({
        PROXY_SERVER_ALLOWED_DB_ORIGINS: "HTTPS://Neptune:8182",
      });
      expect(result.PROXY_SERVER_ALLOWED_DB_ORIGINS).toEqual(
        new Set(["https://neptune:8182"]),
      );
    });

    it("deduplicates entries", () => {
      const result = EnvironmentValuesSchema.parse({
        PROXY_SERVER_ALLOWED_DB_ORIGINS:
          "https://neptune:8182,https://neptune:8182",
      });
      expect(result.PROXY_SERVER_ALLOWED_DB_ORIGINS).toEqual(
        new Set(["https://neptune:8182"]),
      );
      expect(result.PROXY_SERVER_ALLOWED_DB_ORIGINS!.size).toBe(1);
    });
  });

  describe("PROXY_SERVER_ALLOWED_DB_ORIGINS validation failures", () => {
    it("fails when value is not a valid URL", () => {
      expect(
        parseFailure({ PROXY_SERVER_ALLOWED_DB_ORIGINS: "not-a-url" }),
      ).toContain("PROXY_SERVER_ALLOWED_DB_ORIGINS");
    });

    it("fails when value has a trailing comma", () => {
      expect(
        parseFailure({
          PROXY_SERVER_ALLOWED_DB_ORIGINS: "https://neptune:8182,",
        }),
      ).toContain("PROXY_SERVER_ALLOWED_DB_ORIGINS");
    });

    it("fails when value contains a path", () => {
      expect(
        parseFailure({
          PROXY_SERVER_ALLOWED_DB_ORIGINS: "https://neptune:8182/some/path",
        }),
      ).toContain("origin only");
    });
  });
});
