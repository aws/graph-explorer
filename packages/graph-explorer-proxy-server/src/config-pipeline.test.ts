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

/**
 * The environment each image bakes in through the Dockerfile's `ENV` lines.
 * The Dockerfile derives the port and log style from the NEPTUNE_NOTEBOOK
 * build argument at build time, so `-e NEPTUNE_NOTEBOOK=true` on the standard
 * image changes neither.
 */
const standardImage = {
  NEPTUNE_NOTEBOOK: "",
  PROXY_SERVER_HTTP_PORT: "80",
  LOG_STYLE: "default",
};
const notebookImage = {
  NEPTUNE_NOTEBOOK: "true",
  PROXY_SERVER_HTTP_PORT: "9250",
  LOG_STYLE: "cloudwatch",
};

const conflictMessage =
  "NEPTUNE_NOTEBOOK and PROXY_SERVER_HTTPS_CONNECTION are both true. " +
  "The Neptune Notebook preset serves Graph Explorer over HTTP and does " +
  "not generate TLS certificates, so this combination cannot start. " +
  "Either drop PROXY_SERVER_HTTPS_CONNECTION to run under the notebook " +
  "preset, or set NEPTUNE_NOTEBOOK to false to run with TLS.";

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
  /** The container's environment before `-e`, from the image's `ENV` lines. */
  image: Record<string, string>;
  /** Values passed with `docker run -e`. */
  dockerEnv?: Record<string, string>;
  configJson?: Record<string, boolean>;
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
  expected: {
    envFile: Record<string, string>;
    certificatesGenerated: boolean;
    startup: StartupOutcome;
  };
};

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
  },
  certificatesGenerated: false,
  startup: { useHttps: false, port: 9250 },
};
const notebookConflict = {
  envFile: {
    NEPTUNE_NOTEBOOK: "true",
    PROXY_SERVER_HTTPS_CONNECTION: "true",
    GRAPH_EXP_HTTPS_CONNECTION: "false",
  },
  certificatesGenerated: false,
  startup: parseFailureAt("PROXY_SERVER_HTTPS_CONNECTION", conflictMessage),
};

const deployments: Deployment[] = [
  {
    name: "standard image with nothing about HTTPS set defaults to TLS",
    image: standardImage,
    expected: standardTls,
  },
  {
    name: "standard image with -e PROXY_SERVER_HTTPS_CONNECTION=false serves HTTP",
    image: standardImage,
    dockerEnv: { PROXY_SERVER_HTTPS_CONNECTION: "false" },
    expected: standardHttp,
  },
  {
    name: "standard image with -e PROXY_SERVER_HTTP_PORT=8080 and HTTPS off serves HTTP on 8080",
    image: standardImage,
    dockerEnv: {
      PROXY_SERVER_HTTPS_CONNECTION: "false",
      PROXY_SERVER_HTTP_PORT: "8080",
    },
    expected: { ...standardHttp, startup: { useHttps: false, port: 8080 } },
  },
  {
    name: "standard image with -e PROXY_SERVER_HTTPS_CONNECTION=true serves TLS",
    image: standardImage,
    dockerEnv: { PROXY_SERVER_HTTPS_CONNECTION: "true" },
    expected: standardTls,
  },
  {
    // The entrypoint generates certificates only for an exact "true", but the
    // server reads HTTPS case-insensitively.
    name: "standard image with -e PROXY_SERVER_HTTPS_CONNECTION=TRUE skips certificates and fails on the missing certificates",
    image: standardImage,
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
    name: "standard image with config.json HTTPS true serves TLS",
    image: standardImage,
    configJson: { PROXY_SERVER_HTTPS_CONNECTION: true },
    expected: standardTls,
  },
  {
    name: "standard image with config.json HTTPS false serves HTTP",
    image: standardImage,
    configJson: { PROXY_SERVER_HTTPS_CONNECTION: false },
    expected: standardHttp,
  },
  {
    // Known issue: config.json decides what the shell writes and whether
    // certificates are generated, while the -e value wins in the server.
    name: "standard image with config.json HTTPS true and -e HTTPS false generates certificates but serves HTTP",
    image: standardImage,
    dockerEnv: { PROXY_SERVER_HTTPS_CONNECTION: "false" },
    configJson: { PROXY_SERVER_HTTPS_CONNECTION: true },
    expected: { ...standardTls, startup: http },
  },
  {
    name: "standard image with config.json HTTPS false and -e HTTPS true skips certificates and fails on the missing certificates",
    image: standardImage,
    dockerEnv: { PROXY_SERVER_HTTPS_CONNECTION: "true" },
    configJson: { PROXY_SERVER_HTTPS_CONNECTION: false },
    expected: { ...standardHttp, startup: missingCertificates },
  },
  {
    name: "NEPTUNE_NOTEBOOK entirely unset defaults to TLS",
    image: { PROXY_SERVER_HTTP_PORT: "80", LOG_STYLE: "default" },
    expected: standardTls,
  },
  {
    name: "notebook image with nothing about HTTPS set serves HTTP on 9250",
    image: notebookImage,
    expected: notebookPreset,
  },
  {
    name: "standard image with -e NEPTUNE_NOTEBOOK=true applies the preset but keeps port 80",
    image: standardImage,
    dockerEnv: { NEPTUNE_NOTEBOOK: "true" },
    expected: { ...notebookPreset, startup: http },
  },
  {
    name: "standard image with -e NEPTUNE_NOTEBOOK=true and -e PROXY_SERVER_HTTPS_CONNECTION=true refuses with the conflict",
    image: standardImage,
    dockerEnv: {
      NEPTUNE_NOTEBOOK: "true",
      PROXY_SERVER_HTTPS_CONNECTION: "true",
    },
    expected: notebookConflict,
  },
  {
    name: "notebook image with -e PROXY_SERVER_HTTPS_CONNECTION=false, as the SageMaker lifecycle script runs it",
    image: notebookImage,
    dockerEnv: {
      NEPTUNE_NOTEBOOK: "true",
      PROXY_SERVER_HTTPS_CONNECTION: "false",
    },
    expected: notebookPreset,
  },
  {
    name: "notebook image with -e NEPTUNE_NOTEBOOK=false drops the preset and defaults to TLS",
    image: notebookImage,
    dockerEnv: { NEPTUNE_NOTEBOOK: "false" },
    expected: standardTls,
  },
  {
    name: "notebook image with -e PROXY_SERVER_HTTPS_CONNECTION=true refuses with the conflict",
    image: notebookImage,
    dockerEnv: { PROXY_SERVER_HTTPS_CONNECTION: "true" },
    expected: notebookConflict,
  },
  {
    name: "notebook image with -e PROXY_SERVER_HTTPS_CONNECTION=TRUE refuses with the conflict",
    image: notebookImage,
    dockerEnv: { PROXY_SERVER_HTTPS_CONNECTION: "TRUE" },
    expected: {
      ...notebookConflict,
      envFile: {
        ...notebookConflict.envFile,
        PROXY_SERVER_HTTPS_CONNECTION: "TRUE",
      },
    },
  },
  {
    name: "notebook image with -e PROXY_SERVER_HTTPS_CONNECTION=true and no HOST still reaches the conflict",
    image: notebookImage,
    dockerEnv: { PROXY_SERVER_HTTPS_CONNECTION: "true" },
    host: false,
    expected: notebookConflict,
  },
  {
    name: "notebook preset with config.json HTTPS true refuses with the conflict",
    image: notebookImage,
    configJson: { NEPTUNE_NOTEBOOK: true, PROXY_SERVER_HTTPS_CONNECTION: true },
    expected: notebookConflict,
  },
  {
    name: "notebook preset with config.json HTTPS false serves HTTP on 9250",
    image: notebookImage,
    configJson: {
      NEPTUNE_NOTEBOOK: true,
      PROXY_SERVER_HTTPS_CONNECTION: false,
    },
    expected: notebookPreset,
  },
  {
    name: "notebook preset writes GRAPH_EXP_HTTPS_CONNECTION=false to .env over -e",
    image: notebookImage,
    dockerEnv: { GRAPH_EXP_HTTPS_CONNECTION: "true" },
    expected: notebookPreset,
  },
  {
    name: "notebook preset writes GRAPH_EXP_HTTPS_CONNECTION=false to .env over config.json",
    image: notebookImage,
    configJson: { NEPTUNE_NOTEBOOK: true, GRAPH_EXP_HTTPS_CONNECTION: true },
    expected: notebookPreset,
  },
  ...["TRUE", "True", "1", "yes"].flatMap((value): Deployment[] => [
    {
      name: `-e NEPTUNE_NOTEBOOK=${value} is not the preset and defaults to TLS`,
      image: standardImage,
      dockerEnv: { NEPTUNE_NOTEBOOK: value },
      expected: {
        ...standardTls,
        envFile: { ...standardTls.envFile, NEPTUNE_NOTEBOOK: value },
      },
    },
    {
      name: `-e NEPTUNE_NOTEBOOK=${value} with HTTPS off serves HTTP`,
      image: standardImage,
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
    name: "standard image with -e PROXY_SERVER_HTTPS_CONNECTION= generates certificates but fails the environment parse",
    image: standardImage,
    dockerEnv: { PROXY_SERVER_HTTPS_CONNECTION: "" },
    expected: {
      ...standardTls,
      startup: parseFailureAt("PROXY_SERVER_HTTPS_CONNECTION"),
    },
  },
  {
    // config.json replaces the image's NEPTUNE_NOTEBOOK, and a missing key
    // reads as unset, so the preset is off.
    name: "notebook image with config.json HTTPS true and no NEPTUNE_NOTEBOOK key serves TLS",
    image: notebookImage,
    configJson: { PROXY_SERVER_HTTPS_CONNECTION: true },
    expected: standardTls,
  },
  ...[
    { image: standardImage, imageName: "standard" },
    { image: notebookImage, imageName: "notebook" },
  ].flatMap(({ image, imageName }): Deployment[] => [
    {
      // config.json replaces -e NEPTUNE_NOTEBOOK too, even when it lacks the
      // key.
      name: `${imageName} image with -e NEPTUNE_NOTEBOOK=true and a config.json without the key drops the preset and defaults to TLS`,
      image,
      dockerEnv: { NEPTUNE_NOTEBOOK: "true" },
      configJson: {},
      expected: standardTls,
    },
    {
      name: `${imageName} image with config.json NEPTUNE_NOTEBOOK and HTTPS true and no HOST refuses with the conflict`,
      image,
      configJson: {
        NEPTUNE_NOTEBOOK: true,
        PROXY_SERVER_HTTPS_CONNECTION: true,
      },
      host: false,
      expected: notebookConflict,
    },
  ]),
  {
    name: "standard image with config.json NEPTUNE_NOTEBOOK and HTTPS true refuses with the conflict",
    image: standardImage,
    configJson: { NEPTUNE_NOTEBOOK: true, PROXY_SERVER_HTTPS_CONNECTION: true },
    expected: notebookConflict,
  },
  {
    name: "notebook image with config.json NEPTUNE_NOTEBOOK false defaults to TLS",
    image: notebookImage,
    configJson: { NEPTUNE_NOTEBOOK: false },
    expected: standardTls,
  },
  {
    name: "standard image with config.json NEPTUNE_NOTEBOOK true applies the preset but keeps port 80",
    image: standardImage,
    configJson: { NEPTUNE_NOTEBOOK: true },
    expected: { ...notebookPreset, startup: http },
  },
  {
    name: "notebook image with -e PROXY_SERVER_HTTPS_CONNECTION=true still refuses with the conflict after a restart",
    image: notebookImage,
    dockerEnv: { PROXY_SERVER_HTTPS_CONNECTION: "true" },
    restart: true,
    expected: notebookConflict,
  },
  {
    name: "notebook image run by the SageMaker lifecycle script still serves HTTP after a restart",
    image: notebookImage,
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
    name: "standard image with nothing about HTTPS set reuses its certificate and still serves TLS after a restart",
    image: standardImage,
    restart: true,
    restartCertificatesGenerated: false,
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
    fs.rmSync(workDir, { recursive: true, force: true });
  });

  // "%s" prints the whole name, where "$name" truncates it at 40 characters.
  it.each(
    deployments.map(deployment => [deployment.name, deployment] as const),
  )(
    "%s",
    (
      _name,
      {
        image,
        dockerEnv,
        configJson,
        host,
        restart,
        restartCertificatesGenerated,
        expected,
      },
    ) => {
      if (configJson) {
        fs.writeFileSync(
          path.join(workDir, "config.json"),
          JSON.stringify(configJson),
        );
      }
      const containerEnv = {
        ...(host === false ? {} : { HOST: "localhost" }),
        ...image,
        ...dockerEnv,
      };
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
