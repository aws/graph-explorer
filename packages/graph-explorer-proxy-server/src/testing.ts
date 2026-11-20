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
    PROXY_SERVER_LISTEN_ADDRESS: "127.0.0.1",
    NEPTUNE_NOTEBOOK: false,
    PROXY_SERVER_HTTPS_CONNECTION: false,
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

/**
 * The exact bytes earlier versions appended to `.env` at each start, for tests that need an `.env` an upgrading operator has.
 */
export function legacyStartupBlock({
  neptuneNotebook,
  port,
  logStyle,
  https,
  graphExpHttps,
}: {
  neptuneNotebook: string;
  port?: "PROXY_SERVER_PORT" | "PROXY_SERVER_HTTP_PORT";
  logStyle?: true;
  https: string;
  graphExpHttps: string;
}) {
  return [
    `\nNEPTUNE_NOTEBOOK=${neptuneNotebook}\n`,
    port ? `\n${port}=9250\n` : "",
    logStyle ? "\nLOG_STYLE=cloudwatch\n" : "",
    `\nPROXY_SERVER_HTTPS_CONNECTION=${https}\n`,
    `\nGRAPH_EXP_HTTPS_CONNECTION=${graphExpHttps}\n`,
  ].join("");
}

/** `text` without its blank lines, as an operator who tidied `.env` leaves it. */
export function withoutBlankLines(text: string) {
  return text
    .split("\n")
    .filter(line => line.trim() !== "")
    .map(line => `${line}\n`)
    .join("");
}
