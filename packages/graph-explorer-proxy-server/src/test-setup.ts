/**
 * CREDENTIAL SAFETY
 *
 * These mocks prevent any test from accidentally using real AWS credentials
 * or making real HTTP requests. They apply to every test file in this package.
 *
 * - @aws-sdk/credential-providers: Returns fake credentials so the real
 *   credential provider chain (env vars, ~/.aws, IMDS) is never consulted.
 * - node-fetch: Returns a no-op mock so no HTTP request ever leaves the process.
 *
 * DO NOT remove these mocks without understanding the security implications.
 */

vi.mock("@aws-sdk/credential-providers", () => ({
  fromNodeProviderChain: () => () =>
    Promise.resolve({
      accessKeyId: "test-key",
      secretAccessKey: "test-secret",
      sessionToken: "test-token",
    }),
}));

vi.mock("node-fetch", () => ({
  __esModule: true,
  default: vi.fn(),
  Headers: Map,
}));

// Each test creates a fresh Express app which adds process-level listeners,
// exceeding the default limit of 10 and producing a noisy warning.
process.setMaxListeners(0);
