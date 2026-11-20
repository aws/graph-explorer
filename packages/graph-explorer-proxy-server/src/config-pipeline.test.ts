import fs from "fs";
import os from "os";
import path from "path";
import request from "supertest";
import { afterEach, beforeEach, describe, it, vi } from "vite-plus/test";

import type { EnvironmentValues } from "./env.ts";

import { createApp } from "./app.ts";
import {
  type CertificateSummary,
  CertificateError,
  certificateDnsName,
  prepareCertificates,
} from "./certificates.ts";
import { createLogger } from "./logging.ts";
import { certificateDir } from "./paths.ts";
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
} from "./testing/deployment-scenarios.ts";

/**
 * The HOST every row sets unless it says otherwise. The certificates a row
 * starts with name it, as a volume kept from an earlier run with that HOST does.
 */
const defaultHost = "localhost";

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

  beforeEach(() => {
    workDir = fs.mkdtempSync(path.join(os.tmpdir(), "ge-scenario-test-"));
    configDir = path.join(workDir, "config");
    fs.mkdirSync(configDir);
    certDir = path.join(workDir, "cert-info");
    resetContainer();
    configJsonPath = path.join(workDir, "config.json");
  });

  afterEach(() => {
    fs.chmodSync(configDir, 0o755);
    fs.rmSync(workDir, { recursive: true, force: true });
  });

  /**
   * Leaves the container's own files as a new container has them: `cert-info`
   * holding only the openssl templates. The mounted configuration folder and
   * config.json stay.
   */
  function resetContainer() {
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
      writePlaceholderCertificate(file, defaultHost);
    }
    if (readOnly === "configFolder") {
      fs.chmodSync(configDir, 0o555);
    } else if (readOnly) {
      const readOnlyFile = path.join(configDir, readOnly);
      fs.appendFileSync(readOnlyFile, "");
      fs.chmodSync(readOnlyFile, 0o444);
    }
  }

  function writePlaceholderCertificate(file: string, host: string) {
    fs.writeFileSync(
      path.join(certDir, file),
      file === "server.crt" ? host : "placeholder",
    );
  }

  /** Writes the certificate files with a `server.crt` that names `host`. */
  function writePlaceholderCertificates(_certDir: string, host: string) {
    for (const file of certificateFiles) {
      writePlaceholderCertificate(file, host);
    }
  }

  /** Reads the host a placeholder `server.crt` names, which never expires. */
  function readPlaceholderCertificate(_certDir: string): CertificateSummary {
    return {
      dnsNames: [
        certificateDnsName(
          fs.readFileSync(path.join(certDir, "server.crt"), "utf-8"),
        ),
      ],
      expiresAt: new Date("9999-12-31T00:00:00Z"),
    };
  }

  /** Starts the server through the TypeScript startup and reports what it did. */
  async function startServer({
    dockerEnv,
    host,
  }: Deployment): Promise<StartupOutcome> {
    try {
      const { env, startup } = loadStartup({
        processEnv: {
          ...(host === false ? {} : { HOST: defaultHost }),
          ...dockerEnv,
        },
        configPath: configDir,
        configJsonPath,
        image: true,
      });
      const certificates = env.PROXY_SERVER_HTTPS_CONNECTION
        ? prepareCertificates({
            certDir,
            host: startup.certificateHost,
            generate: writePlaceholderCertificates,
            readCertificate: readPlaceholderCertificate,
            logger: { info: () => undefined },
          })
        : "unused";

      const server = serverOutcome(env, certDir);
      if ("failed" in server) {
        return server;
      }
      return {
        started: {
          ...server,
          warnings: [...startup.warnings, ...server.warnings],
          httpsNotice: startup.httpsNotice,
          certificatesGenerated: certificates === "generated",
          defaultConnection: await requestDefaultConnection(
            configDir,
            startup.defaultConnectionJson,
          ),
        },
      };
    } catch (error) {
      if (error instanceof StartupError || error instanceof CertificateError) {
        return { failed: error.message };
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
        resetContainer();
      }
      const second = await startServer(deployment);
      expect(readFolder(configDir)).toStrictEqual(configFolderBefore);
      expect([first, second]).toStrictEqual(deployment.expected);
    },
  );
});
