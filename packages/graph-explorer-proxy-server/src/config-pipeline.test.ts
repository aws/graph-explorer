import dotenv from "dotenv";
import fs from "fs";
import path from "path";

import { parseEnvironmentValues } from "./env.ts";
import { proxyServerRoot } from "./paths.ts";
import { resolveServerConfig, ServerConfigError } from "./server-config.ts";
import {
  createEntrypointWorkDir,
  readServerEnvironment,
  runEntrypoint,
} from "./testing.ts";

const expectedKeyPath = path.join(proxyServerRoot, "cert-info/server.key");
const expectedCertPath = path.join(proxyServerRoot, "cert-info/server.crt");

const processEnvScriptPath = path.resolve(
  import.meta.dirname,
  "../../../process-environment.sh",
);

const conflictMessage =
  "NEPTUNE_NOTEBOOK and PROXY_SERVER_HTTPS_CONNECTION are both true. " +
  "The Neptune Notebook preset serves Graph Explorer over HTTP and does " +
  "not generate TLS certificates, so this combination cannot start. " +
  "Either set PROXY_SERVER_HTTPS_CONNECTION to false or remove it " +
  "(from -e flags or config.json) to run under the notebook preset, " +
  "or set NEPTUNE_NOTEBOOK to false to run with TLS.";

/** What the server does at startup. */
type StartupOutcome =
  | { useHttps: boolean; port: number }
  /** The environment failed to parse. Holds the text logged to stderr. */
  | { parseError: string }
  | { serverConfigError: string };

/** Expects a parse failure at `key`, logging `message` when it is given. */
function parseFailureAt(key: string, message?: string): StartupOutcome {
  return {
    parseError: expect.stringContaining(
      message === undefined ? `→ at ${key}` : `✖ ${message}\n  → at ${key}`,
    ),
  };
}

const missingCertificates: StartupOutcome = {
  serverConfigError: expect.stringContaining(
    "PROXY_SERVER_HTTPS_CONNECTION is true but certificate files are missing",
  ),
};

type Deployment = {
  name: string;
  /** Values passed with `docker run -e`. */
  dockerEnv?: Record<string, string>;
  /**
   * config.json is a hand-edited file, so a boolean field there can hold
   * null, a number, or an arbitrary string instead of a JSON boolean.
   */
  configJson?: Record<string, boolean | string | number | null>;
  /** Lines already in `.env` before the first start, as an operator might mount. */
  existingEnvFile?: Record<string, string>;
  /** Every row sets HOST=localhost unless this is false or `-e` sets it. */
  host?: false;
  /**
   * Starts the same container a second time, as `docker restart` does. The
   * work dir, and the `.env` that process-environment.sh appended to, carry
   * over, and the second start has to behave the same way as the first,
   * except where `restartCertificatesGenerated` says otherwise.
   */
  restart?: true;
  /**
   * Whether certificates are (re)generated on the second start. Defaults to
   * matching the first start. Set this to `false` for a case where the
   * second start reuses the certificate files from the first instead of
   * regenerating them.
   */
  restartCertificatesGenerated?: boolean;
  /**
   * Makes the configuration folder, or a file in it, read-only before the
   * start, as a read-only mount does. A missing file is created empty first.
   */
  readOnly?: "configFolder" | ".env" | "defaultConnection.json";
  expected:
    | {
        envFile: Record<string, string>;
        certificatesGenerated: boolean;
        startup: StartupOutcome;
      }
    /**
     * The entrypoint exits before starting the server, printing this to
     * stderr and leaving the configuration folder untouched.
     */
    | { refusal: string };
};

/** Expects the refusal process-environment.sh prints when it can't write `file`. */
function cannotWrite(file: string) {
  return {
    refusal:
      `Graph Explorer can't start because it can't write ./packages/graph-explorer/${file}. ` +
      "The container writes its settings to the configuration folder at startup, " +
      "so ./packages/graph-explorer must be writable. " +
      "Check that it isn't mounted read-only.\n",
  };
}

/** Every file in `folder` by name, with its contents. */
function readFolder(folder: string) {
  return Object.fromEntries(
    fs
      .readdirSync(folder)
      .map(file => [file, fs.readFileSync(path.join(folder, file), "utf-8")]),
  );
}

const https = { useHttps: true, port: 443 };
const http = { useHttps: false, port: 80 };

const standardTls = {
  envFile: {
    NEPTUNE_NOTEBOOK: "false",
    PROXY_SERVER_HTTPS_CONNECTION: "true",
    GRAPH_EXP_HTTPS_CONNECTION: "true",
  },
  certificatesGenerated: true,
  startup: https,
};
const standardHttp = {
  envFile: {
    NEPTUNE_NOTEBOOK: "false",
    PROXY_SERVER_HTTPS_CONNECTION: "false",
    GRAPH_EXP_HTTPS_CONNECTION: "true",
  },
  certificatesGenerated: false,
  startup: http,
};
const notebookPreset = {
  envFile: {
    NEPTUNE_NOTEBOOK: "true",
    PROXY_SERVER_HTTPS_CONNECTION: "false",
    GRAPH_EXP_HTTPS_CONNECTION: "false",
    PROXY_SERVER_HTTP_PORT: "9250",
    LOG_STYLE: "cloudwatch",
  },
  certificatesGenerated: false,
  startup: { useHttps: false, port: 9250 },
};
const notebookConflict = {
  envFile: {
    NEPTUNE_NOTEBOOK: "true",
    PROXY_SERVER_HTTPS_CONNECTION: "true",
    GRAPH_EXP_HTTPS_CONNECTION: "false",
    PROXY_SERVER_HTTP_PORT: "9250",
    LOG_STYLE: "cloudwatch",
  },
  certificatesGenerated: false,
  startup: parseFailureAt("PROXY_SERVER_HTTPS_CONNECTION", conflictMessage),
};

/**
 * Startup scenarios for the one image the Dockerfile builds. Its `ENV` lines
 * set nothing the entrypoint reads, so the container's environment is `HOST`
 * plus the `-e` flags, and the notebook preset's port and log style come from
 * the `.env` lines process-environment.sh writes.
 */
const deployments: Deployment[] = [
  {
    name: "nothing about HTTPS set defaults to TLS",
    expected: standardTls,
  },
  {
    name: "-e PROXY_SERVER_HTTPS_CONNECTION=false serves HTTP",
    dockerEnv: { PROXY_SERVER_HTTPS_CONNECTION: "false" },
    expected: standardHttp,
  },
  {
    name: "-e PROXY_SERVER_HTTP_PORT=8080 and HTTPS off serves HTTP on 8080",
    dockerEnv: {
      PROXY_SERVER_HTTPS_CONNECTION: "false",
      PROXY_SERVER_HTTP_PORT: "8080",
    },
    expected: { ...standardHttp, startup: { useHttps: false, port: 8080 } },
  },
  {
    name: "PROXY_SERVER_HTTP_PORT=8080 already in .env and HTTPS off serves HTTP on 8080",
    existingEnvFile: { PROXY_SERVER_HTTP_PORT: "8080" },
    dockerEnv: { PROXY_SERVER_HTTPS_CONNECTION: "false" },
    expected: {
      envFile: { PROXY_SERVER_HTTP_PORT: "8080", ...standardHttp.envFile },
      certificatesGenerated: false,
      startup: { useHttps: false, port: 8080 },
    },
  },
  {
    name: "-e PROXY_SERVER_HTTPS_CONNECTION=true serves TLS",
    dockerEnv: { PROXY_SERVER_HTTPS_CONNECTION: "true" },
    expected: standardTls,
  },
  {
    // The entrypoint generates certificates only for an exact "true", but the
    // server reads HTTPS case-insensitively.
    name: "-e PROXY_SERVER_HTTPS_CONNECTION=TRUE skips certificates and fails on the missing certificates",
    dockerEnv: { PROXY_SERVER_HTTPS_CONNECTION: "TRUE" },
    expected: {
      envFile: {
        ...standardTls.envFile,
        PROXY_SERVER_HTTPS_CONNECTION: "TRUE",
      },
      certificatesGenerated: false,
      startup: missingCertificates,
    },
  },
  {
    name: "config.json HTTPS true serves TLS",
    configJson: { PROXY_SERVER_HTTPS_CONNECTION: true },
    expected: standardTls,
  },
  {
    name: "config.json HTTPS false serves HTTP",
    configJson: { PROXY_SERVER_HTTPS_CONNECTION: false },
    expected: standardHttp,
  },
  {
    // Known issue: config.json decides what the shell writes and whether
    // certificates are generated, while the -e value wins in the server.
    name: "config.json HTTPS true and -e HTTPS false generates certificates but serves HTTP",
    dockerEnv: { PROXY_SERVER_HTTPS_CONNECTION: "false" },
    configJson: { PROXY_SERVER_HTTPS_CONNECTION: true },
    expected: { ...standardTls, startup: http },
  },
  {
    name: "config.json HTTPS false and -e HTTPS true skips certificates and fails on the missing certificates",
    dockerEnv: { PROXY_SERVER_HTTPS_CONNECTION: "true" },
    configJson: { PROXY_SERVER_HTTPS_CONNECTION: false },
    expected: { ...standardHttp, startup: missingCertificates },
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=true applies the preset and serves HTTP on 9250 with cloudwatch logs",
    dockerEnv: { NEPTUNE_NOTEBOOK: "true" },
    expected: notebookPreset,
  },
  {
    // An explicit -e value beats the preset's .env write.
    name: "-e NEPTUNE_NOTEBOOK=true and -e PROXY_SERVER_HTTP_PORT=8080 serves HTTP on 8080",
    dockerEnv: { NEPTUNE_NOTEBOOK: "true", PROXY_SERVER_HTTP_PORT: "8080" },
    expected: {
      ...notebookPreset,
      envFile: {
        NEPTUNE_NOTEBOOK: "true",
        PROXY_SERVER_HTTPS_CONNECTION: "false",
        GRAPH_EXP_HTTPS_CONNECTION: "false",
        LOG_STYLE: "cloudwatch",
      },
      startup: { useHttps: false, port: 8080 },
    },
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=true and -e PROXY_SERVER_HTTPS_CONNECTION=true refuses with the conflict",
    dockerEnv: {
      NEPTUNE_NOTEBOOK: "true",
      PROXY_SERVER_HTTPS_CONNECTION: "true",
    },
    expected: notebookConflict,
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=true and -e PROXY_SERVER_HTTPS_CONNECTION=false, as the SageMaker lifecycle script runs it",
    dockerEnv: {
      NEPTUNE_NOTEBOOK: "true",
      PROXY_SERVER_HTTPS_CONNECTION: "false",
    },
    expected: notebookPreset,
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=false defaults to TLS",
    dockerEnv: { NEPTUNE_NOTEBOOK: "false" },
    expected: standardTls,
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=true and -e PROXY_SERVER_HTTPS_CONNECTION=TRUE refuses with the conflict",
    dockerEnv: {
      NEPTUNE_NOTEBOOK: "true",
      PROXY_SERVER_HTTPS_CONNECTION: "TRUE",
    },
    expected: {
      ...notebookConflict,
      envFile: {
        ...notebookConflict.envFile,
        PROXY_SERVER_HTTPS_CONNECTION: "TRUE",
      },
    },
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=true and -e PROXY_SERVER_HTTPS_CONNECTION=true and no HOST still reaches the conflict",
    dockerEnv: {
      NEPTUNE_NOTEBOOK: "true",
      PROXY_SERVER_HTTPS_CONNECTION: "true",
    },
    host: false,
    expected: notebookConflict,
  },
  {
    name: "notebook preset with config.json HTTPS true refuses with the conflict",
    dockerEnv: { NEPTUNE_NOTEBOOK: "true" },
    configJson: { NEPTUNE_NOTEBOOK: true, PROXY_SERVER_HTTPS_CONNECTION: true },
    expected: notebookConflict,
  },
  {
    name: "notebook preset with config.json HTTPS false serves HTTP on 9250",
    dockerEnv: { NEPTUNE_NOTEBOOK: "true" },
    configJson: {
      NEPTUNE_NOTEBOOK: true,
      PROXY_SERVER_HTTPS_CONNECTION: false,
    },
    expected: notebookPreset,
  },
  ...[null, "yes", 0].map((value): Deployment => ({
    name: `notebook preset with config.json HTTPS ${JSON.stringify(value)} serves HTTP on 9250`,
    dockerEnv: { NEPTUNE_NOTEBOOK: "true" },
    configJson: {
      NEPTUNE_NOTEBOOK: true,
      PROXY_SERVER_HTTPS_CONNECTION: value,
    },
    expected: notebookPreset,
  })),
  {
    // config.json can hold "TRUE" just as easily as the boolean true; both
    // read as a request for HTTPS under the preset.
    name: 'notebook preset with config.json HTTPS "TRUE" refuses with the conflict',
    dockerEnv: { NEPTUNE_NOTEBOOK: "true" },
    configJson: {
      NEPTUNE_NOTEBOOK: true,
      PROXY_SERVER_HTTPS_CONNECTION: "TRUE",
    },
    expected: {
      ...notebookConflict,
      envFile: {
        ...notebookConflict.envFile,
        PROXY_SERVER_HTTPS_CONNECTION: "TRUE",
      },
    },
  },
  {
    // -e always wins over .env in the real container, since dotenv never
    // overrides a variable already in the environment. An invalid -e value
    // fails the parse the same way under the preset as it does on main.
    name: "notebook preset with -e PROXY_SERVER_HTTPS_CONNECTION=yes fails the environment parse",
    dockerEnv: {
      NEPTUNE_NOTEBOOK: "true",
      PROXY_SERVER_HTTPS_CONNECTION: "yes",
    },
    expected: {
      ...notebookPreset,
      startup: parseFailureAt("PROXY_SERVER_HTTPS_CONNECTION"),
    },
  },
  {
    name: "notebook preset writes GRAPH_EXP_HTTPS_CONNECTION=false to .env over -e",
    dockerEnv: { NEPTUNE_NOTEBOOK: "true", GRAPH_EXP_HTTPS_CONNECTION: "true" },
    expected: notebookPreset,
  },
  {
    name: "notebook preset writes GRAPH_EXP_HTTPS_CONNECTION=false to .env over config.json",
    dockerEnv: { NEPTUNE_NOTEBOOK: "true" },
    configJson: { NEPTUNE_NOTEBOOK: true, GRAPH_EXP_HTTPS_CONNECTION: true },
    expected: notebookPreset,
  },
  ...["TRUE", "True", "1", "yes"].flatMap((value): Deployment[] => [
    {
      name: `-e NEPTUNE_NOTEBOOK=${value} is not the preset and defaults to TLS`,
      dockerEnv: { NEPTUNE_NOTEBOOK: value },
      expected: {
        ...standardTls,
        envFile: { ...standardTls.envFile, NEPTUNE_NOTEBOOK: value },
      },
    },
    {
      name: `-e NEPTUNE_NOTEBOOK=${value} with HTTPS off serves HTTP`,
      dockerEnv: {
        NEPTUNE_NOTEBOOK: value,
        PROXY_SERVER_HTTPS_CONNECTION: "false",
      },
      expected: {
        ...standardHttp,
        envFile: { ...standardHttp.envFile, NEPTUNE_NOTEBOOK: value },
      },
    },
  ]),
  {
    // The shell treats the empty value as unset and writes the TLS default,
    // but dotenv never overrides a variable already in the environment, so
    // the server reads the empty value directly and its schema rejects it.
    name: "-e PROXY_SERVER_HTTPS_CONNECTION= generates certificates but fails the environment parse",
    dockerEnv: { PROXY_SERVER_HTTPS_CONNECTION: "" },
    expected: {
      ...standardTls,
      startup: parseFailureAt("PROXY_SERVER_HTTPS_CONNECTION"),
    },
  },
  {
    // config.json replaces -e NEPTUNE_NOTEBOOK, and a missing key reads as
    // unset, so the preset is off.
    name: "-e NEPTUNE_NOTEBOOK=true with config.json HTTPS true and no NEPTUNE_NOTEBOOK key serves TLS",
    dockerEnv: { NEPTUNE_NOTEBOOK: "true" },
    configJson: { PROXY_SERVER_HTTPS_CONNECTION: true },
    expected: standardTls,
  },
  {
    // config.json replaces -e NEPTUNE_NOTEBOOK too, even when it lacks the
    // key.
    name: "-e NEPTUNE_NOTEBOOK=true and a config.json without the key drops the preset and defaults to TLS",
    dockerEnv: { NEPTUNE_NOTEBOOK: "true" },
    configJson: {},
    expected: standardTls,
  },
  {
    name: "config.json NEPTUNE_NOTEBOOK and HTTPS true and no HOST refuses with the conflict",
    configJson: { NEPTUNE_NOTEBOOK: true, PROXY_SERVER_HTTPS_CONNECTION: true },
    host: false,
    expected: notebookConflict,
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=true with config.json NEPTUNE_NOTEBOOK and HTTPS true and no HOST refuses with the conflict",
    dockerEnv: { NEPTUNE_NOTEBOOK: "true" },
    configJson: { NEPTUNE_NOTEBOOK: true, PROXY_SERVER_HTTPS_CONNECTION: true },
    host: false,
    expected: notebookConflict,
  },
  {
    name: "config.json NEPTUNE_NOTEBOOK and HTTPS true refuses with the conflict",
    configJson: { NEPTUNE_NOTEBOOK: true, PROXY_SERVER_HTTPS_CONNECTION: true },
    expected: notebookConflict,
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=true with config.json NEPTUNE_NOTEBOOK false defaults to TLS",
    dockerEnv: { NEPTUNE_NOTEBOOK: "true" },
    configJson: { NEPTUNE_NOTEBOOK: false },
    expected: standardTls,
  },
  {
    name: "config.json NEPTUNE_NOTEBOOK true applies the preset and serves HTTP on 9250 with cloudwatch logs",
    configJson: { NEPTUNE_NOTEBOOK: true },
    expected: notebookPreset,
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=true and -e PROXY_SERVER_HTTPS_CONNECTION=true still refuses with the conflict after a restart",
    dockerEnv: {
      NEPTUNE_NOTEBOOK: "true",
      PROXY_SERVER_HTTPS_CONNECTION: "true",
    },
    restart: true,
    expected: notebookConflict,
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=true run by the SageMaker lifecycle script still serves HTTP after a restart",
    dockerEnv: {
      HOST: "127.0.0.1",
      PROXY_SERVER_HTTPS_CONNECTION: "false",
      NEPTUNE_NOTEBOOK: "true",
    },
    restart: true,
    expected: notebookPreset,
  },
  {
    // The entrypoint reads PROXY_SERVER_HTTPS_CONNECTION by its first match,
    // not its last, so a restart's repeated "true" line doesn't re-trigger
    // setup-ssl.sh. The container keeps serving TLS on the certificate
    // generated at first start.
    name: "nothing about HTTPS set reuses its certificate and still serves TLS after a restart",
    restart: true,
    restartCertificatesGenerated: false,
    expected: standardTls,
  },
  {
    name: "a read-only configuration folder refuses to start",
    readOnly: "configFolder",
    expected: cannotWrite(".env"),
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=true with a read-only configuration folder refuses to start",
    dockerEnv: { NEPTUNE_NOTEBOOK: "true" },
    readOnly: "configFolder",
    expected: cannotWrite(".env"),
  },
  {
    name: "a read-only .env refuses to start",
    existingEnvFile: { LOG_LEVEL: "debug" },
    readOnly: ".env",
    expected: cannotWrite(".env"),
  },
  {
    name: "-e PUBLIC_OR_PROXY_ENDPOINT and a read-only defaultConnection.json refuses to start before writing .env",
    dockerEnv: { PUBLIC_OR_PROXY_ENDPOINT: "https://endpoint:8182" },
    readOnly: "defaultConnection.json",
    expected: cannotWrite("defaultConnection.json"),
  },
  {
    name: "-e GRAPH_CONNECTION_URL and a read-only defaultConnection.json refuses to start before writing .env",
    dockerEnv: { GRAPH_CONNECTION_URL: "https://endpoint:8182" },
    readOnly: "defaultConnection.json",
    expected: cannotWrite("defaultConnection.json"),
  },
  {
    // A proxied legacy connection resolves to GRAPH_CONNECTION_URL, which is
    // empty here, so there is no defaultConnection.json to write.
    name: "-e PUBLIC_OR_PROXY_ENDPOINT and -e USING_PROXY_SERVER=true without a GRAPH_CONNECTION_URL starts with a read-only defaultConnection.json",
    dockerEnv: {
      PUBLIC_OR_PROXY_ENDPOINT: "https://endpoint:8182",
      USING_PROXY_SERVER: "true",
    },
    readOnly: "defaultConnection.json",
    expected: standardTls,
  },
];

/**
 * Parses `serverEnv` and resolves the server config, as the server does at
 * startup, with the certificate files present only if `certificatesExist`.
 */
function startupOutcome(
  serverEnv: Record<string, string | undefined>,
  certificatesExist: boolean,
): StartupOutcome {
  const existsSync = fs.existsSync;
  const existsSpy = vi
    .spyOn(fs, "existsSync")
    .mockImplementation(p =>
      p === expectedKeyPath || p === expectedCertPath
        ? certificatesExist
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
    const { useHttps, port } = resolveServerConfig(
      parseEnvironmentValues(serverEnv),
    );
    return { useHttps, port };
  } catch (error) {
    if (error === exitSignal) {
      return { parseError: errorSpy.mock.calls.join("\n") };
    }
    if (error instanceof ServerConfigError) {
      return { serverConfigError: error.message };
    }
    throw error;
  } finally {
    existsSpy.mockRestore();
    errorSpy.mockRestore();
    exitSpy.mockRestore();
  }
}

describe("deployment scenarios: entrypoint → dotenv → Zod → server config", () => {
  let workDir: string;
  let configDir: string;
  let scriptPath: string;

  beforeEach(() => {
    ({ workDir, configDir, scriptPath } = createEntrypointWorkDir());
    const processEnvironment = path.join(workDir, "process-environment.sh");
    fs.copyFileSync(processEnvScriptPath, processEnvironment);
    fs.chmodSync(processEnvironment, 0o755);
  });

  afterEach(() => {
    fs.chmodSync(configDir, 0o755);
    fs.rmSync(workDir, { recursive: true, force: true });
  });

  // "%s" prints the whole name, where "$name" truncates it at 40 characters.
  it.for(deployments.map(deployment => [deployment.name, deployment] as const))(
    "%s",
    (
      [
        _name,
        {
          dockerEnv,
          configJson,
          existingEnvFile,
          host,
          restart,
          restartCertificatesGenerated,
          readOnly,
          expected,
        },
      ],
      { expect, skip },
    ) => {
      // Root ignores file permissions, so chmod can't make anything read-only.
      skip(readOnly !== undefined && process.getuid?.() === 0);

      if (configJson) {
        fs.writeFileSync(
          path.join(workDir, "config.json"),
          JSON.stringify(configJson),
        );
      }
      if (existingEnvFile) {
        fs.writeFileSync(
          path.join(configDir, ".env"),
          Object.entries(existingEnvFile)
            .map(([key, value]) => `${key}=${value}\n`)
            .join(""),
        );
      }
      const containerEnv = {
        ...(host === false ? {} : { HOST: "localhost" }),
        ...dockerEnv,
      };

      if (readOnly === "configFolder") {
        fs.chmodSync(configDir, 0o555);
      } else if (readOnly) {
        const readOnlyFile = path.join(configDir, readOnly);
        fs.appendFileSync(readOnlyFile, "");
        fs.chmodSync(readOnlyFile, 0o444);
      }

      if ("refusal" in expected) {
        const configFolderBefore = readFolder(configDir);
        const { exitCode, stdout, stderr } = runEntrypoint(
          workDir,
          scriptPath,
          containerEnv,
        );
        expect({
          exitCode,
          serverStarted: stdout.includes("SERVER_STARTED"),
          stderr,
          configFolder: readFolder(configDir),
        }).toStrictEqual({
          exitCode: 1,
          serverStarted: false,
          stderr: expected.refusal,
          configFolder: configFolderBefore,
        });
        return;
      }

      // Certificates stay on disk across a restart.
      let certificatesExist = false;

      function startContainer() {
        const sslCalled = path.join(workDir, "ssl-called");
        fs.rmSync(sslCalled, { force: true });

        const { exitCode, stdout } = runEntrypoint(
          workDir,
          scriptPath,
          containerEnv,
        );
        const envFile = dotenv.parse(
          fs.readFileSync(path.join(configDir, ".env"), "utf-8"),
        );
        const certificatesGenerated = fs.existsSync(sslCalled);
        certificatesExist ||= certificatesGenerated;
        const serverEnvironment = readServerEnvironment(workDir);

        return {
          exitCode,
          serverStarted: stdout.includes("SERVER_STARTED"),
          envFile,
          certificatesGenerated,
          serverNeptuneNotebook: serverEnvironment.NEPTUNE_NOTEBOOK,
          // dotenv.config() never overwrites a key already in process.env.
          startup: startupOutcome(
            { ...envFile, ...serverEnvironment },
            certificatesExist,
          ),
        };
      }

      const firstStart = startContainer();
      expect({
        exitCode: firstStart.exitCode,
        serverStarted: firstStart.serverStarted,
        envFile: firstStart.envFile,
        certificatesGenerated: firstStart.certificatesGenerated,
        startup: firstStart.startup,
      }).toStrictEqual({
        exitCode: 0,
        serverStarted: true,
        ...expected,
      });

      const lastStart = restart ? startContainer() : firstStart;
      expect(lastStart).toStrictEqual({
        ...firstStart,
        certificatesGenerated:
          restart && restartCertificatesGenerated !== undefined
            ? restartCertificatesGenerated
            : firstStart.certificatesGenerated,
      });
    },
  );
});
