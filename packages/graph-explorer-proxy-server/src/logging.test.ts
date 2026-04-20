import type { Request, Response } from "express";

import type { EnvironmentValues } from "./env.js";

import {
  createLogger,
  getRequestLoggerPrefix,
  logRequestAndResponse,
  requestLoggingMiddleware,
} from "./logging.js";

function createMockEnv(
  overrides: Partial<EnvironmentValues> = {},
): EnvironmentValues {
  return {
    HOST: "localhost",
    PROXY_SERVER_HTTPS_CONNECTION: false,
    PROXY_SERVER_HTTPS_PORT: 443,
    PROXY_SERVER_HTTP_PORT: 80,
    LOG_LEVEL: "silent",
    LOG_STYLE: "default",
    ...overrides,
  };
}

const sharedLogger = createLogger(createMockEnv());

function createMockRequest(overrides: Partial<Request> = {}) {
  return {
    method: "GET",
    path: "/test",
    app: {
      locals: {
        logger: sharedLogger,
      },
    },
    ...overrides,
  } as unknown as Request;
}

function createMockResponse(statusCode: number) {
  return {
    statusCode,
    statusMessage: "OK",
    on: vi.fn(),
    writableFinished: true,
  } as unknown as Response;
}

describe("createLogger", () => {
  it("creates a logger with the configured log level", () => {
    const logger = createLogger(createMockEnv({ LOG_LEVEL: "warn" }));
    expect(logger.level).toBe("warn");
  });

  it("creates a logger with debug level by default", () => {
    const logger = createLogger(createMockEnv({ LOG_LEVEL: "debug" }));
    expect(logger.level).toBe("debug");
  });

  it("supports all valid log levels", () => {
    const levels = [
      "fatal",
      "error",
      "warn",
      "info",
      "debug",
      "trace",
      "silent",
    ] as const;
    for (const level of levels) {
      const logger = createLogger(createMockEnv({ LOG_LEVEL: level }));
      expect(logger.level).toBe(level);
    }
  });
});

describe("getRequestLoggerPrefix", () => {
  it("formats GET request", () => {
    const req = createMockRequest({ method: "GET", path: "/sparql" });
    expect(getRequestLoggerPrefix(req)).toBe("GET /sparql");
  });

  it("formats POST request", () => {
    const req = createMockRequest({ method: "POST", path: "/gremlin" });
    expect(getRequestLoggerPrefix(req)).toBe("POST /gremlin");
  });
});

describe("logRequestAndResponse", () => {
  it("logs 2xx responses at debug level", () => {
    const req = createMockRequest();
    const logger = req.app.locals.logger;
    const debugSpy = vi.spyOn(logger, "debug");

    logRequestAndResponse(req, createMockResponse(200));

    expect(debugSpy).toHaveBeenCalledWith(
      expect.stringContaining("Response 200"),
    );
  });

  it("logs 3xx responses at debug level", () => {
    const req = createMockRequest();
    const logger = req.app.locals.logger;
    const debugSpy = vi.spyOn(logger, "debug");

    logRequestAndResponse(req, createMockResponse(301));

    expect(debugSpy).toHaveBeenCalledWith(
      expect.stringContaining("Response 301"),
    );
  });

  it("logs 4xx responses at warn level", () => {
    const req = createMockRequest();
    const logger = req.app.locals.logger;
    const warnSpy = vi.spyOn(logger, "warn");

    logRequestAndResponse(req, createMockResponse(404));

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Response 404"),
    );
  });

  it("logs 5xx responses at error level", () => {
    const req = createMockRequest();
    const logger = req.app.locals.logger;
    const errorSpy = vi.spyOn(logger, "error");

    logRequestAndResponse(req, createMockResponse(500));

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Response 500"),
    );
  });

  it("includes request method and path in log message", () => {
    const req = createMockRequest({ method: "POST", path: "/sparql" });
    const logger = req.app.locals.logger;
    const debugSpy = vi.spyOn(logger, "debug");

    logRequestAndResponse(req, createMockResponse(200));

    expect(debugSpy).toHaveBeenCalledWith(
      expect.stringContaining("[POST /sparql]"),
    );
  });
});

describe("requestLoggingMiddleware", () => {
  it("calls next for normal requests", () => {
    const middleware = requestLoggingMiddleware();
    const req = createMockRequest({ method: "GET", path: "/sparql" });
    const res = createMockResponse(200);
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("skips logging for /logger endpoint", () => {
    const middleware = requestLoggingMiddleware();
    const req = createMockRequest({ method: "POST", path: "/logger" });
    const logger = req.app.locals.logger;
    const traceSpy = vi.spyOn(logger, "trace");
    const res = createMockResponse(200);
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(traceSpy).not.toHaveBeenCalled();
  });

  it("skips logging for OPTIONS requests", () => {
    const middleware = requestLoggingMiddleware();
    const req = createMockRequest({ method: "OPTIONS", path: "/sparql" });
    const logger = req.app.locals.logger;
    const traceSpy = vi.spyOn(logger, "trace");
    const res = createMockResponse(200);
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(traceSpy).not.toHaveBeenCalled();
  });

  it("registers a finish listener on the response", () => {
    const middleware = requestLoggingMiddleware();
    const req = createMockRequest({ method: "GET", path: "/sparql" });
    const res = createMockResponse(200);
    const next = vi.fn();

    middleware(req, res, next);

    expect(res.on).toHaveBeenCalledWith("finish", expect.any(Function));
  });
});
