import type { EnvironmentValues } from "./env.ts";

/**
 * Builds a complete {@link EnvironmentValues} for tests, so a new schema field
 * only has to be defaulted here rather than at every call site.
 */
export function createTestEnvironment(
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
