import { execFileSync } from "child_process";
import dotenv from "dotenv";
import fs from "fs";
import os from "os";
import path from "path";

import { parseEnvironmentValues } from "./env.js";
import { proxyServerRoot } from "./paths.js";
import { resolveServerConfig, ServerConfigError } from "./server-config.js";

const expectedKeyPath = path.join(proxyServerRoot, "cert-info/server.key");
const expectedCertPath = path.join(proxyServerRoot, "cert-info/server.crt");

const processEnvScriptPath = path.resolve(
  import.meta.dirname,
  "../../../process-environment.sh",
);

function runPipeline(
  workDir: string,
  env: Record<string, string> = {},
  presetEnvVars: Record<string, string> = {},
) {
  const configFolder =
    env.CONFIGURATION_FOLDER_PATH ?? "./packages/graph-explorer/";
  const resolvedConfigFolder = path.resolve(workDir, configFolder);
  fs.mkdirSync(resolvedConfigFolder, { recursive: true });

  // Pre-seed .env with vars the shell script doesn't write
  if (Object.keys(presetEnvVars).length > 0) {
    const lines = Object.entries(presetEnvVars)
      .map(([k, v]) => `${k}=${v}`)
      .join("\n");
    fs.writeFileSync(path.join(resolvedConfigFolder, ".env"), lines + "\n");
  }

  execFileSync("sh", [processEnvScriptPath], {
    cwd: workDir,
    env: { ...env, PATH: process.env.PATH },
  });

  const envFilePath = path.join(resolvedConfigFolder, ".env");
  const envFileContent = fs.readFileSync(envFilePath, "utf-8");
  const parsed = dotenv.parse(envFileContent);
  return parseEnvironmentValues(parsed);
}

describe("config pipeline: shell → dotenv → Zod → server config", () => {
  let workDir: string;

  beforeEach(() => {
    workDir = fs.mkdtempSync(path.join(os.tmpdir(), "ge-pipeline-test-"));
  });

  afterEach(() => {
    fs.rmSync(workDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it("HTTPS enabled by default flows through to server config", () => {
    const env = runPipeline(workDir);
    expect(env.PROXY_SERVER_HTTPS_CONNECTION).toBe(true);

    vi.spyOn(fs, "existsSync").mockImplementation(
      p => p === expectedKeyPath || p === expectedCertPath,
    );
    const config = resolveServerConfig(env);
    expect(config.useHttps).toBe(true);
    expect(config.port).toBe(443);
  });

  it("HTTPS disabled flows through to HTTP config", () => {
    const env = runPipeline(workDir, {
      PROXY_SERVER_HTTPS_CONNECTION: "false",
    });

    const config = resolveServerConfig(env);
    expect(config.useHttps).toBe(false);
    expect(config.port).toBe(80);
  });

  it("Neptune Notebook forces HTTPS off", () => {
    const env = runPipeline(workDir, { NEPTUNE_NOTEBOOK: "true" });

    const config = resolveServerConfig(env);
    expect(config.useHttps).toBe(false);
  });

  it("HTTPS enabled but certs missing throws ServerConfigError", () => {
    const env = runPipeline(workDir);
    expect(env.PROXY_SERVER_HTTPS_CONNECTION).toBe(true);

    expect(() => resolveServerConfig(env)).toThrow(ServerConfigError);
  });

  it("custom HTTP port flows through", () => {
    const env = runPipeline(
      workDir,
      { PROXY_SERVER_HTTPS_CONNECTION: "false" },
      { PROXY_SERVER_HTTP_PORT: "8080" },
    );

    const config = resolveServerConfig(env);
    expect(config.port).toBe(8080);
  });
});
