import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import request from "supertest";
import { afterEach, beforeEach, describe, it, vi } from "vite-plus/test";

import { createApp } from "./app.ts";
import {
  type DefaultConnectionResponse,
  type Deployment,
  definedFields,
  deployments,
  type ServerStart,
  type StartupOutcome,
} from "./deployment-scenarios.ts";
import { parseEnvironmentValues } from "./env.ts";
import { createLogger } from "./logging.ts";
import { proxyServerRoot } from "./paths.ts";
import { resolveServerConfig, ServerConfigError } from "./server-config.ts";
import {
  createEntrypointWorkDir,
  createTestEnvironment,
  readServerEnvironment,
  runEntrypoint,
} from "./testing.ts";

const expectedKeyPath = path.join(proxyServerRoot, "cert-info/server.key");
const expectedCertPath = path.join(proxyServerRoot, "cert-info/server.crt");

const repoRoot = path.resolve(import.meta.dirname, "../../..");
const certTemplates = ["csr.conf", "cert.conf"];
const certificateFiles = [
  "rootCA.key",
  "rootCA.crt",
  "server.key",
  "server.csr",
  "server.crt",
];

/**
 * An openssl that records its arguments in `openssl-calls` and writes a
 * placeholder to each output file, so a run shows whether certificates were
 * generated without paying for real keys.
 */
const fakeOpenssl = [
  "#!/bin/sh",
  'echo "$*" >> "$(dirname "$0")/../openssl-calls"',
  "while [ $# -gt 0 ]; do",
  '  case "$1" in',
  '    -out|-keyout) printf placeholder > "$2"; shift ;;',
  "  esac",
  "  shift",
  "done",
  "",
].join("\n");

/** Every file in `folder` by name, with its contents. */
function readFolder(folder: string) {
  return Object.fromEntries(
    fs
      .readdirSync(folder)
      .map(file => [file, fs.readFileSync(path.join(folder, file), "utf-8")]),
  );
}

/** The variables in the dotenv file at `filePath`, or none when it doesn't exist. */
function parseEnvFileAt(filePath: string) {
  return fs.existsSync(filePath)
    ? dotenv.parse(fs.readFileSync(filePath, "utf-8"))
    : {};
}

async function requestDefaultConnection(
  configDir: string,
): Promise<DefaultConnectionResponse> {
  const app = createApp({
    configPath: configDir,
    defaultConnectionJson: undefined,
    staticFilesVirtualPath: "/explorer",
    staticFilesPath: ".",
    version: "test",
  });
  app.locals.logger = createLogger(createTestEnvironment());
  const response = await request(app)
    .get("/defaultConnection")
    .buffer(true)
    // Read the text, so a body that isn't JSON can be recorded.
    .parse((res, callback) => {
      let text = "";
      res.setEncoding("utf8");
      res.on("data", (chunk: string) => (text += chunk));
      res.on("end", () => callback(null, text));
    });
  if (response.status === 404) {
    return { status: 404 };
  }
  const text = response.body as string;
  try {
    return { status: 200, body: JSON.parse(text) };
  } catch {
    return { status: 200, invalidJson: text };
  }
}

/**
 * Parses `serverEnv` and resolves the server config, as the server does at
 * startup, with the certificate files read from `certDir`.
 */
function serverOutcome(
  serverEnv: Record<string, string | undefined>,
  certDir: string,
):
  | { failed: string }
  | Pick<ServerStart, "environment" | "listener" | "warnings"> {
  const existsSync = fs.existsSync;
  const existsSpy = vi
    .spyOn(fs, "existsSync")
    .mockImplementation(p =>
      p === expectedKeyPath || p === expectedCertPath
        ? existsSync(path.join(certDir, path.basename(String(p))))
        : existsSync(p),
    );
  const errorSpy = vi
    .spyOn(console, "error")
    .mockImplementation(() => undefined);
  const exitSignal = new Error("process.exit");
  const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
    throw exitSignal;
  });

  try {
    const environment = parseEnvironmentValues(serverEnv);
    const { useHttps, port, startupWarnings } =
      resolveServerConfig(environment);
    return {
      environment: definedFields(environment),
      listener: { protocol: useHttps ? "https" : "http", port },
      warnings: startupWarnings,
    };
  } catch (error) {
    if (error === exitSignal) {
      return { failed: errorSpy.mock.calls.join("\n") };
    }
    if (error instanceof ServerConfigError) {
      return { failed: error.message };
    }
    throw error;
  } finally {
    existsSpy.mockRestore();
    errorSpy.mockRestore();
    exitSpy.mockRestore();
  }
}

describe("deployment scenarios: shell startup", () => {
  let workDir: string;
  let configDir: string;
  let scriptPath: string;
  let certDir: string;
  let binDir: string;

  beforeEach(() => {
    ({ workDir, configDir, scriptPath } = createEntrypointWorkDir());
    for (const script of ["process-environment.sh", "setup-ssl.sh"]) {
      const target = path.join(workDir, script);
      fs.copyFileSync(path.join(repoRoot, script), target);
      fs.chmodSync(target, 0o755);
    }
    certDir = path.join(workDir, "cert-info");
    resetCertificateFolder();
    binDir = path.join(workDir, "bin");
    fs.mkdirSync(binDir);
    fs.writeFileSync(path.join(binDir, "openssl"), fakeOpenssl, {
      mode: 0o755,
    });
  });

  afterEach(() => {
    fs.chmodSync(configDir, 0o755);
    fs.rmSync(workDir, { recursive: true, force: true });
  });

  /** Leaves `cert-info` holding only the openssl templates, as a new container does. */
  function resetCertificateFolder() {
    fs.rmSync(certDir, { recursive: true, force: true });
    fs.mkdirSync(certDir);
    for (const template of certTemplates) {
      fs.copyFileSync(
        path.join(proxyServerRoot, "cert-info", template),
        path.join(certDir, template),
      );
    }
  }

  /** Lays out the files a deployment starts with, as mounts and the image do. */
  function arrange({
    configJson,
    existingEnvFile,
    existingEnvLocalFile,
    existingCertificates,
    mountedDefaultConnection,
    readOnly,
  }: Deployment) {
    if (configJson !== undefined) {
      fs.writeFileSync(
        path.join(workDir, "config.json"),
        typeof configJson === "string"
          ? configJson
          : JSON.stringify(configJson),
      );
    }
    if (existingEnvFile !== undefined) {
      fs.writeFileSync(
        path.join(configDir, ".env"),
        typeof existingEnvFile === "string"
          ? existingEnvFile
          : Object.entries(existingEnvFile)
              .map(([key, value]) => `${key}=${value}\n`)
              .join(""),
      );
    }
    if (existingEnvLocalFile !== undefined) {
      fs.writeFileSync(
        path.join(configDir, ".env.local"),
        existingEnvLocalFile,
      );
    }
    if (mountedDefaultConnection) {
      fs.writeFileSync(
        path.join(configDir, "defaultConnection.json"),
        JSON.stringify(mountedDefaultConnection),
      );
    }
    for (const file of existingCertificates === "all"
      ? certificateFiles
      : existingCertificates === "server-only"
        ? ["server.key", "server.crt"]
        : []) {
      fs.writeFileSync(path.join(certDir, file), "placeholder");
    }
    if (readOnly === "configFolder") {
      fs.chmodSync(configDir, 0o555);
    } else if (readOnly) {
      const readOnlyFile = path.join(configDir, readOnly);
      fs.appendFileSync(readOnlyFile, "");
      fs.chmodSync(readOnlyFile, 0o444);
    }
  }

  /** Starts the container once through docker-entrypoint.sh and reports what it did. */
  async function startShell({
    dockerEnv,
    host,
  }: Deployment): Promise<StartupOutcome> {
    fs.rmSync(path.join(workDir, "openssl-calls"), { force: true });

    const { exitCode, stdout, stderr } = runEntrypoint(workDir, scriptPath, {
      PATH: `${binDir}:${process.env.PATH}`,
      ...(host === false ? {} : { HOST: "localhost" }),
      ...dockerEnv,
    });
    if (exitCode !== 0 || !stdout.includes("SERVER_STARTED")) {
      return { failed: stderr };
    }

    // dotenv.config with [.env.local, .env] keeps the first file's value, and
    // never overrides a variable already in the environment.
    const server = serverOutcome(
      {
        ...parseEnvFileAt(path.join(configDir, ".env")),
        ...parseEnvFileAt(path.join(configDir, ".env.local")),
        ...readServerEnvironment(workDir),
      },
      certDir,
    );
    if ("failed" in server) {
      return server;
    }
    return {
      started: {
        ...server,
        certificatesGenerated: fs.existsSync(
          path.join(workDir, "openssl-calls"),
        ),
        defaultConnection: await requestDefaultConnection(configDir),
        httpsNotice: stdout
          .split("\n")
          .find(line =>
            line.endsWith("Skipping self-signed certificate generation."),
          ),
      },
    };
  }

  // "%s" prints the whole name, where "$name" truncates it at 40 characters.
  it.for(deployments.map(deployment => [deployment.name, deployment] as const))(
    "%s",
    async ([_name, deployment], { expect, skip }) => {
      // Root ignores file permissions, so chmod can't make anything read-only.
      skip(deployment.readOnly !== undefined && process.getuid?.() === 0);

      arrange(deployment);
      const configFolderBefore = readFolder(configDir);
      const first = await startShell(deployment);

      // A refusal to write leaves the folder as the operator mounted it.
      expect(
        deployment.readOnly && "failed" in first
          ? readFolder(configDir)
          : configFolderBefore,
      ).toStrictEqual(configFolderBefore);

      if (deployment.secondStart === undefined) {
        expect(first).toStrictEqual(deployment.expected);
        return;
      }
      if (deployment.secondStart === "new-container") {
        resetCertificateFolder();
      }
      const second = await startShell(deployment);
      expect([first, second]).toStrictEqual(deployment.expected);
    },
  );
});
