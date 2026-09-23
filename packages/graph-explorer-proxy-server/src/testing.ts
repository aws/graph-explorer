import type { Request } from "express";

import type { EnvironmentValues } from "./env.ts";

import { createLogger } from "./logging.ts";

/**
 * Builds a complete {@link EnvironmentValues} for tests, so a new schema field
 * only has to be defaulted here rather than at every call site.
 */
export function createTestEnvironment(
  overrides: Partial<EnvironmentValues> = {},
): EnvironmentValues {
  return {
    HOST: "localhost",
    NEPTUNE_NOTEBOOK: false,
    PROXY_SERVER_HTTPS_CONNECTION: false,
    PROXY_SERVER_HTTPS_PORT: 443,
    PROXY_SERVER_HTTP_PORT: 80,
    LOG_LEVEL: "silent",
    LOG_STYLE: "default",
    ...overrides,
  };
}

/**
 * Builds an Express {@link Request} carrying the fields the logging and error
 * handling middleware read. Each request gets its own silent logger, so a test
 * can spy on `request.app.locals.logger` without leaking onto other tests.
 */
export function createMockRequest(overrides: Partial<Request> = {}) {
  return {
    method: "GET",
    path: "/test",
    headers: {},
    app: {
      locals: {
        logger: createLogger(createTestEnvironment()),
      },
    },
    ...overrides,
  } as unknown as Request;
}
