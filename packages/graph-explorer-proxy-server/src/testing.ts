import type { Request } from "express";

import { execFileSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

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

const entrypointPath = path.resolve(
  import.meta.dirname,
  "../../../docker-entrypoint.sh",
);

const serverStartLine =
  "cd /graph-explorer/packages/graph-explorer-proxy-server && NODE_ENV=production node src/node-server.ts";

/**
 * Lays out a temp directory that runs docker-entrypoint.sh as the image does,
 * with the server start replaced by an `echo SERVER_STARTED`. The sibling
 * scripts are stubs: process-environment.sh does nothing, and setup-ssl.sh
 * records the call in `ssl-called` and exits nonzero without HOST, as the
 * real script does when no certificates exist yet.
 */
export function createEntrypointWorkDir() {
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "ge-entrypoint-test-"));
  const configDir = path.join(workDir, "packages", "graph-explorer");
  fs.mkdirSync(configDir, { recursive: true });

  const script = fs.readFileSync(entrypointPath, "utf-8");
  if (!script.includes(serverStartLine)) {
    throw new Error(
      "docker-entrypoint.sh no longer contains the expected server start line. Update the test stub.",
    );
  }
  const scriptPath = path.join(workDir, "docker-entrypoint.sh");
  fs.writeFileSync(
    scriptPath,
    script.replace(serverStartLine, 'echo "SERVER_STARTED"'),
    { mode: 0o755 },
  );

  fs.writeFileSync(
    path.join(workDir, "process-environment.sh"),
    "#!/bin/sh\nexit 0\n",
    { mode: 0o755 },
  );
  fs.writeFileSync(
    path.join(workDir, "setup-ssl.sh"),
    [
      "#!/bin/sh",
      "touch ./ssl-called",
      'echo "$HOST" > ./host-value',
      '[ -n "$HOST" ] || { echo "specify --env HOST" >&2; exit 1; }',
      "",
    ].join("\n"),
    { mode: 0o755 },
  );

  return { workDir, configDir, scriptPath };
}

/** Runs the entrypoint from {@link createEntrypointWorkDir} with only `env` and PATH set. */
export function runEntrypoint(
  workDir: string,
  scriptPath: string,
  env: Record<string, string> = {},
): { exitCode: number; stdout: string; stderr: string } {
  try {
    const stdout = execFileSync("sh", [scriptPath], {
      cwd: workDir,
      env: { PATH: process.env.PATH, ...env },
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return { exitCode: 0, stdout, stderr: "" };
  } catch (error: unknown) {
    const e = error as { status: number; stdout: string; stderr: string };
    return {
      exitCode: e.status,
      stdout: e.stdout ?? "",
      stderr: e.stderr ?? "",
    };
  }
}
