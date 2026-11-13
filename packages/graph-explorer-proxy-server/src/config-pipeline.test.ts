import fs from "fs";
import os from "os";
import path from "path";
import request from "supertest";
import { afterEach, beforeEach, describe, it, vi } from "vite-plus/test";

import type { EnvironmentValues } from "./env.ts";

import { createApp } from "./app.ts";
import { CertificateError } from "./certificates.ts";
import { createLogger } from "./logging.ts";
import { certificateDir } from "./paths.ts";
import { setUpImageCertificates } from "./run-server.ts";
import { resolveServerConfig, ServerConfigError } from "./server-config.ts";
import { loadStartup, StartupError } from "./startup-config.ts";
import { createTestEnvironment } from "./testing.ts";
import {
  type DefaultConnectionResponse,
  type Deployment,
  definedFields,
  deployments,
  type ServerStart,
  type StartupOutcome,
  workDirToken,
} from "./testing/deployment-scenarios.ts";

const expectedKeyPath = path.join(certificateDir, "server.key");
const expectedCertPath = path.join(certificateDir, "server.crt");

const certTemplates = ["csr.conf", "cert.conf"];
const certificateFiles = [
  "rootCA.key",
  "rootCA.crt",
  "server.key",
  "server.csr",
  "server.crt",
];

/** The start of the message of an environment that fails the server's parse. */
const environmentParseFailure = "Failed to parse environment values";

/** Every file in `folder` by name, with its contents. */
function readFolder(folder: string) {
  return Object.fromEntries(
    fs
      .readdirSync(folder)
      .map(file => [file, fs.readFileSync(path.join(folder, file), "utf-8")]),
  );
}

async function requestDefaultConnection(
  configDir: string,
  defaultConnectionJson: string | undefined,
): Promise<DefaultConnectionResponse> {
  const app = createApp({
    configPath: configDir,
    defaultConnectionJson,
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
 * Resolves the server config for `environment`, as the server does at
 * startup, with the certificate files read from `certDir`.
 */
function serverOutcome(
  environment: EnvironmentValues,
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

  try {
    const { useHttps, port, startupWarnings } =
      resolveServerConfig(environment);
    return {
      environment: definedFields(environment),
      listener: { protocol: useHttps ? "https" : "http", port },
      warnings: startupWarnings,
    };
  } catch (error) {
    if (error instanceof ServerConfigError) {
      return { failed: error.message };
    }
    throw error;
  } finally {
    existsSpy.mockRestore();
  }
}

describe("deployment scenarios: TypeScript startup", () => {
  let workDir: string;
  let configDir: string;
  let certDir: string;
  let configJsonPath: string;
  let markerPath: string;

  beforeEach(() => {
    workDir = fs.mkdtempSync(path.join(os.tmpdir(), "ge-scenario-test-"));
    configDir = path.join(workDir, "config");
    fs.mkdirSync(configDir);
    certDir = path.join(workDir, "cert-info");
    resetCertificateFolder();
    configJsonPath = path.join(workDir, "config.json");
    markerPath = path.join(workDir, ".container-started");
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
        path.join(certificateDir, template),
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
        configJsonPath,
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

  function writePlaceholderCertificates() {
    for (const file of certificateFiles) {
      fs.writeFileSync(path.join(certDir, file), "placeholder");
    }
  }

  /**
   * Starts the server through the TypeScript startup and reports what it did.
   * The container's start marker sits in `workDir`, outside the configuration
   * folder, as it sits outside the image's.
   *
   * There is no separate entrypoint process, so a refusal is the stop of the
   * startup's own files and certificate setup. The environment's parse
   * failure is the server's, as it was in the shell startup, though the
   * startup now makes it before it sets up a certificate.
   */
  async function startServer({
    dockerEnv,
    host,
  }: Deployment): Promise<StartupOutcome> {
    let certificatesGenerated = false;
    try {
      const { env, startup } = loadStartup({
        processEnv: {
          ...(host === false ? {} : { HOST: "localhost" }),
          ...dockerEnv,
        },
        configPath: configDir,
        configJsonPath,
        image: true,
        startedBefore: fs.existsSync(markerPath),
      });
      setUpImageCertificates(startup, {
        markerPath,
        certDir,
        generate: () => {
          certificatesGenerated = true;
          writePlaceholderCertificates();
        },
        logger: { info: () => undefined, warn: () => undefined },
      });

      const server = serverOutcome(env, certDir);
      if ("failed" in server) {
        return { serverFailed: server.failed, certificatesGenerated };
      }
      return {
        started: {
          ...server,
          warnings: [...startup.warnings, ...server.warnings],
          httpsNotice: startup.httpsNotice,
          certificatesGenerated,
          defaultConnection: await requestDefaultConnection(
            configDir,
            startup.defaultConnectionJson,
          ),
        },
      };
    } catch (error) {
      if (error instanceof StartupError || error instanceof CertificateError) {
        const message = error.message.replaceAll(workDir, workDirToken);
        return message.startsWith(environmentParseFailure)
          ? { serverFailed: message, certificatesGenerated }
          : { refused: message, certificatesGenerated };
      }
      throw error;
    }
  }

  // "%s" prints the whole name, where "$name" truncates it at 40 characters.
  it.for(deployments.map(deployment => [deployment.name, deployment] as const))(
    "%s",
    async ([_name, deployment], { expect, skip }) => {
      // Root ignores file permissions, so chmod can't make anything read-only.
      skip(deployment.readOnly !== undefined && process.getuid?.() === 0);

      arrange(deployment);
      const configFolderBefore = readFolder(configDir);
      const first = await startServer(deployment);
      // The startup never writes to the configuration folder.
      expect(readFolder(configDir)).toStrictEqual(configFolderBefore);

      if (deployment.secondStart === undefined) {
        expect(first).toStrictEqual(deployment.expected);
        return;
      }
      if (deployment.secondStart === "new-container") {
        resetCertificateFolder();
        fs.rmSync(markerPath, { force: true });
      }
      const second = await startServer(deployment);
      expect(readFolder(configDir)).toStrictEqual(configFolderBefore);
      expect([first, second]).toStrictEqual(deployment.expected);
    },
  );
});
