import { parseEnvironmentValues } from "./env.ts";

describe("parseEnvironmentValues", () => {
  it("returns defaults when env is empty", () => {
    const result = parseEnvironmentValues({});

    expect(result.HOST).toBe("localhost");
    expect(result.PROXY_SERVER_HTTPS_CONNECTION).toBe(false);
    expect(result.PROXY_SERVER_HTTPS_PORT).toBe(443);
    expect(result.PROXY_SERVER_HTTP_PORT).toBe(80);
    expect(result.LOG_LEVEL).toBe("debug");
    expect(result.LOG_STYLE).toBe("default");
  });

  it("parses provided values", () => {
    const result = parseEnvironmentValues({
      HOST: "my-server",
      PROXY_SERVER_HTTP_PORT: "8080",
      LOG_LEVEL: "error",
    });

    expect(result.HOST).toBe("my-server");
    expect(result.PROXY_SERVER_HTTP_PORT).toBe(8080);
    expect(result.LOG_LEVEL).toBe("error");
  });

  it("overrides all defaults", () => {
    const result = parseEnvironmentValues({
      HOST: "my-server.example.com",
      PROXY_SERVER_HTTPS_CONNECTION: "true",
      PROXY_SERVER_HTTPS_PORT: "8443",
      PROXY_SERVER_HTTP_PORT: "8080",
      LOG_LEVEL: "error",
      LOG_STYLE: "cloudwatch",
    });

    expect(result.HOST).toBe("my-server.example.com");
    expect(result.PROXY_SERVER_HTTPS_CONNECTION).toBe(true);
    expect(result.PROXY_SERVER_HTTPS_PORT).toBe(8443);
    expect(result.PROXY_SERVER_HTTP_PORT).toBe(8080);
    expect(result.LOG_LEVEL).toBe("error");
    expect(result.LOG_STYLE).toBe("cloudwatch");
  });

  it("handles boolean values case-insensitively", () => {
    expect(
      parseEnvironmentValues({ PROXY_SERVER_HTTPS_CONNECTION: "TRUE" })
        .PROXY_SERVER_HTTPS_CONNECTION,
    ).toBe(true);

    expect(
      parseEnvironmentValues({ PROXY_SERVER_HTTPS_CONNECTION: "False" })
        .PROXY_SERVER_HTTPS_CONNECTION,
    ).toBe(false);
  });

  it("coerces port strings to numbers", () => {
    const result = parseEnvironmentValues({
      PROXY_SERVER_HTTP_PORT: "3000",
      PROXY_SERVER_HTTPS_PORT: "3443",
    });

    expect(result.PROXY_SERVER_HTTP_PORT).toBe(3000);
    expect(result.PROXY_SERVER_HTTPS_PORT).toBe(3443);
  });

  describe("validation failures", () => {
    beforeEach(() => {
      vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
      vi.spyOn(console, "error").mockImplementation(() => undefined);
    });

    it("exits process on invalid PROXY_SERVER_HTTPS_CONNECTION", () => {
      parseEnvironmentValues({ PROXY_SERVER_HTTPS_CONNECTION: "yes" });
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it("exits process on invalid LOG_LEVEL", () => {
      parseEnvironmentValues({ LOG_LEVEL: "verbose" });
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it("exits process on invalid LOG_STYLE", () => {
      parseEnvironmentValues({ LOG_STYLE: "json" });
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it("exits process when PROXY_SERVER_CORS_ORIGIN is missing the scheme", () => {
      parseEnvironmentValues({
        PROXY_SERVER_CORS_ORIGIN: "my-app.example.com",
      });
      expect(process.exit).toHaveBeenCalledWith(1);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("Must be an HTTP or HTTPS URL"),
      );
    });

    it("exits process when PROXY_SERVER_CORS_ORIGIN is a wildcard", () => {
      parseEnvironmentValues({ PROXY_SERVER_CORS_ORIGIN: "*" });
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it("exits process when PROXY_SERVER_CORS_ORIGIN has a trailing comma", () => {
      parseEnvironmentValues({
        PROXY_SERVER_CORS_ORIGIN: "https://example.com,",
      });
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it("logs error details on validation failure", () => {
      parseEnvironmentValues({ LOG_LEVEL: "verbose" });
      expect(console.error).toHaveBeenCalledWith(
        "Failed to parse environment values",
      );
    });
  });

  it("ignores unknown env vars", () => {
    const result = parseEnvironmentValues({
      HOST: "my-server",
      SOME_OTHER_VAR: "ignored",
    });

    expect(result.HOST).toBe("my-server");
    expect(result).not.toHaveProperty("SOME_OTHER_VAR");
  });

  it("parses PROXY_SERVER_CORS_ORIGIN when provided", () => {
    const result = parseEnvironmentValues({
      PROXY_SERVER_CORS_ORIGIN: "https://my-app.example.com",
    });

    expect(result.PROXY_SERVER_CORS_ORIGIN).toStrictEqual([
      "https://my-app.example.com",
    ]);
  });

  it("parses comma-separated PROXY_SERVER_CORS_ORIGIN values", () => {
    const result = parseEnvironmentValues({
      PROXY_SERVER_CORS_ORIGIN:
        "https://app-a.example.com,https://app-b.example.com",
    });

    expect(result.PROXY_SERVER_CORS_ORIGIN).toStrictEqual([
      "https://app-a.example.com",
      "https://app-b.example.com",
    ]);
  });

  it("trims whitespace around comma-separated PROXY_SERVER_CORS_ORIGIN values", () => {
    const result = parseEnvironmentValues({
      PROXY_SERVER_CORS_ORIGIN:
        "https://app-a.example.com , https://app-b.example.com",
    });

    expect(result.PROXY_SERVER_CORS_ORIGIN).toStrictEqual([
      "https://app-a.example.com",
      "https://app-b.example.com",
    ]);
  });

  it("defaults PROXY_SERVER_CORS_ORIGIN to undefined when not provided", () => {
    const result = parseEnvironmentValues({});

    expect(result.PROXY_SERVER_CORS_ORIGIN).toBeUndefined();
  });

  it("treats empty PROXY_SERVER_CORS_ORIGIN as unset", () => {
    const result = parseEnvironmentValues({ PROXY_SERVER_CORS_ORIGIN: "" });

    expect(result.PROXY_SERVER_CORS_ORIGIN).toBeUndefined();
  });

  it("strips trailing slash from PROXY_SERVER_CORS_ORIGIN", () => {
    const result = parseEnvironmentValues({
      PROXY_SERVER_CORS_ORIGIN: "https://my-app.example.com/",
    });

    expect(result.PROXY_SERVER_CORS_ORIGIN).toStrictEqual([
      "https://my-app.example.com",
    ]);
  });

  it("strips path from PROXY_SERVER_CORS_ORIGIN", () => {
    const result = parseEnvironmentValues({
      PROXY_SERVER_CORS_ORIGIN: "https://my-app.example.com/app",
    });

    expect(result.PROXY_SERVER_CORS_ORIGIN).toStrictEqual([
      "https://my-app.example.com",
    ]);
  });

  describe("PROXY_SERVER_ALLOWED_DB_ORIGINS", () => {
    it("defaults to undefined when not provided", () => {
      const result = parseEnvironmentValues({});
      expect(result.PROXY_SERVER_ALLOWED_DB_ORIGINS).toBeUndefined();
    });

    it("treats empty string as unset", () => {
      const result = parseEnvironmentValues({
        PROXY_SERVER_ALLOWED_DB_ORIGINS: "",
      });
      expect(result.PROXY_SERVER_ALLOWED_DB_ORIGINS).toBeUndefined();
    });

    it("parses a single origin into a Set", () => {
      const result = parseEnvironmentValues({
        PROXY_SERVER_ALLOWED_DB_ORIGINS: "https://neptune:8182",
      });
      expect(result.PROXY_SERVER_ALLOWED_DB_ORIGINS).toEqual(
        new Set(["https://neptune:8182"]),
      );
    });

    it("parses comma-separated origins into a Set", () => {
      const result = parseEnvironmentValues({
        PROXY_SERVER_ALLOWED_DB_ORIGINS:
          "https://neptune:8182,https://other-db:8182",
      });
      expect(result.PROXY_SERVER_ALLOWED_DB_ORIGINS).toEqual(
        new Set(["https://neptune:8182", "https://other-db:8182"]),
      );
    });

    it("trims whitespace around values", () => {
      const result = parseEnvironmentValues({
        PROXY_SERVER_ALLOWED_DB_ORIGINS:
          " https://neptune:8182 , https://other:8182 ",
      });
      expect(result.PROXY_SERVER_ALLOWED_DB_ORIGINS).toEqual(
        new Set(["https://neptune:8182", "https://other:8182"]),
      );
    });

    it("accepts a trailing slash (treated as no path)", () => {
      const result = parseEnvironmentValues({
        PROXY_SERVER_ALLOWED_DB_ORIGINS: "https://neptune:8182/",
      });
      expect(result.PROXY_SERVER_ALLOWED_DB_ORIGINS).toEqual(
        new Set(["https://neptune:8182"]),
      );
    });

    it("normalizes case to lowercase", () => {
      const result = parseEnvironmentValues({
        PROXY_SERVER_ALLOWED_DB_ORIGINS: "HTTPS://Neptune:8182",
      });
      expect(result.PROXY_SERVER_ALLOWED_DB_ORIGINS).toEqual(
        new Set(["https://neptune:8182"]),
      );
    });

    it("deduplicates entries", () => {
      const result = parseEnvironmentValues({
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
    beforeEach(() => {
      vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
      vi.spyOn(console, "error").mockImplementation(() => undefined);
    });

    it("exits process when value is not a valid URL", () => {
      parseEnvironmentValues({
        PROXY_SERVER_ALLOWED_DB_ORIGINS: "not-a-url",
      });
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it("exits process when value has a trailing comma", () => {
      parseEnvironmentValues({
        PROXY_SERVER_ALLOWED_DB_ORIGINS: "https://neptune:8182,",
      });
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it("exits process when value contains a path", () => {
      parseEnvironmentValues({
        PROXY_SERVER_ALLOWED_DB_ORIGINS: "https://neptune:8182/some/path",
      });
      expect(process.exit).toHaveBeenCalledWith(1);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("origin only"),
      );
    });
  });
});
