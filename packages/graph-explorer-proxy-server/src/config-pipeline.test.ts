import { execFileSync } from "child_process";
import dotenv from "dotenv";
import fs from "fs";
import os from "os";
import path from "path";

import { type EnvironmentValues, parseEnvironmentValues } from "./env.ts";
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
  const parsedFromFile = dotenv.parse(envFileContent);
  // dotenv.config() never overwrites a key already in process.env, so a
  // variable passed to the container wins over whatever the shell script wrote
  // to .env for that key.
  return parseEnvironmentValues({ ...parsedFromFile, ...env });
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

    expect(env.NEPTUNE_NOTEBOOK).toBe(true);
    const config = resolveServerConfig(env);
    expect(config.useHttps).toBe(false);
  });

  it("Neptune Notebook conflicting with an explicit HTTPS request refuses to start with both variables named", () => {
    // Certificates present, so the conflict is the only thing that can fail.
    vi.spyOn(fs, "existsSync").mockReturnValue(true);

    const env = runPipeline(workDir, {
      NEPTUNE_NOTEBOOK: "true",
      PROXY_SERVER_HTTPS_CONNECTION: "true",
    });

    expect(env.NEPTUNE_NOTEBOOK).toBe(true);
    expect(env.PROXY_SERVER_HTTPS_CONNECTION).toBe(true);

    let message = "";
    expect(() => resolveServerConfig(env)).toThrow(ServerConfigError);
    try {
      resolveServerConfig(env);
    } catch (e) {
      message = (e as Error).message;
    }
    expect(message).toContain("NEPTUNE_NOTEBOOK");
    expect(message).toContain("PROXY_SERVER_HTTPS_CONNECTION");
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

const notebookHttpsConflict = new ServerConfigError(
  "NEPTUNE_NOTEBOOK and PROXY_SERVER_HTTPS_CONNECTION are both true. " +
    "The Neptune Notebook preset serves Graph Explorer over HTTP and does " +
    "not generate TLS certificates, so this combination cannot start. " +
    "Either drop PROXY_SERVER_HTTPS_CONNECTION to run under the notebook " +
    "preset, or set NEPTUNE_NOTEBOOK to false to run with TLS.",
);

type Deployment = {
  row: number;
  name: string;
  /** The container's environment before `-e`, from the image's `ENV` lines. */
  image: Record<string, string>;
  /** Values passed with `docker run -e`. */
  dockerEnv?: Record<string, string>;
  configJson?: Record<string, boolean>;
  /** Every row sets HOST=localhost unless this is false. */
  host?: false;
  expected: {
    envFile: Record<string, string>;
    certificatesGenerated: boolean;
    server:
      | { useHttps: boolean; port: number; logStyle: "default" | "cloudwatch" }
      | ServerConfigError
      | typeof environmentParseFailure;
  };
};

const https = { useHttps: true, port: 443, logStyle: "default" } as const;
const http = { useHttps: false, port: 80, logStyle: "default" } as const;
const notebookHttp = {
  useHttps: false,
  port: 9250,
  logStyle: "cloudwatch",
} as const;

/**
 * Sentinel for rows where the server never reaches {@link resolveServerConfig}
 * because {@link parseEnvironmentValues} itself exits(1) on an invalid value.
 */
const environmentParseFailure = "ENVIRONMENT_PARSE_FAILURE" as const;

const standardTls = {
  envFile: {
    NEPTUNE_NOTEBOOK: "false",
    PROXY_SERVER_HTTPS_CONNECTION: "true",
    GRAPH_EXP_HTTPS_CONNECTION: "true",
  },
  certificatesGenerated: true,
  server: https,
};
const standardHttp = {
  envFile: {
    NEPTUNE_NOTEBOOK: "false",
    PROXY_SERVER_HTTPS_CONNECTION: "false",
    GRAPH_EXP_HTTPS_CONNECTION: "true",
  },
  certificatesGenerated: false,
  server: http,
};
const notebookPreset = {
  envFile: {
    NEPTUNE_NOTEBOOK: "true",
    PROXY_SERVER_HTTPS_CONNECTION: "false",
    GRAPH_EXP_HTTPS_CONNECTION: "false",
  },
  certificatesGenerated: false,
  server: notebookHttp,
};
const notebookConflict = {
  envFile: {
    NEPTUNE_NOTEBOOK: "true",
    PROXY_SERVER_HTTPS_CONNECTION: "true",
    GRAPH_EXP_HTTPS_CONNECTION: "false",
  },
  certificatesGenerated: false,
  server: notebookHttpsConflict,
};

const deployments: Deployment[] = [
  {
    row: 1,
    name: "standard image with nothing about HTTPS set defaults to TLS",
    image: standardImage,
    expected: standardTls,
  },
  {
    row: 2,
    name: "standard image with -e PROXY_SERVER_HTTPS_CONNECTION=false serves HTTP",
    image: standardImage,
    dockerEnv: { PROXY_SERVER_HTTPS_CONNECTION: "false" },
    expected: standardHttp,
  },
  {
    row: 3,
    name: "standard image with -e PROXY_SERVER_HTTPS_CONNECTION=true serves TLS",
    image: standardImage,
    dockerEnv: { PROXY_SERVER_HTTPS_CONNECTION: "true" },
    expected: standardTls,
  },
  {
    row: 4,
    name: "standard image with config.json HTTPS true serves TLS",
    image: standardImage,
    configJson: { PROXY_SERVER_HTTPS_CONNECTION: true },
    expected: standardTls,
  },
  {
    row: 5,
    name: "standard image with config.json HTTPS false serves HTTP",
    image: standardImage,
    configJson: { PROXY_SERVER_HTTPS_CONNECTION: false },
    expected: standardHttp,
  },
  {
    row: 6,
    name: "NEPTUNE_NOTEBOOK entirely unset defaults to TLS",
    image: { PROXY_SERVER_HTTP_PORT: "80", LOG_STYLE: "default" },
    expected: standardTls,
  },
  {
    row: 7,
    name: "notebook image with nothing about HTTPS set serves HTTP on 9250",
    image: notebookImage,
    expected: notebookPreset,
  },
  {
    row: 7,
    name: "standard image with -e NEPTUNE_NOTEBOOK=true applies the preset but keeps port 80",
    image: standardImage,
    dockerEnv: { NEPTUNE_NOTEBOOK: "true" },
    expected: { ...notebookPreset, server: http },
  },
  {
    row: 8,
    name: "notebook image with -e PROXY_SERVER_HTTPS_CONNECTION=false, as the SageMaker lifecycle script runs it",
    image: notebookImage,
    dockerEnv: {
      NEPTUNE_NOTEBOOK: "true",
      PROXY_SERVER_HTTPS_CONNECTION: "false",
    },
    expected: notebookPreset,
  },
  {
    row: 9,
    name: "notebook image with -e PROXY_SERVER_HTTPS_CONNECTION=true refuses with the conflict",
    image: notebookImage,
    dockerEnv: { PROXY_SERVER_HTTPS_CONNECTION: "true" },
    expected: notebookConflict,
  },
  {
    row: 10,
    name: "notebook image with -e PROXY_SERVER_HTTPS_CONNECTION=true and no HOST still reaches the conflict",
    image: notebookImage,
    dockerEnv: { PROXY_SERVER_HTTPS_CONNECTION: "true" },
    host: false,
    expected: notebookConflict,
  },
  {
    row: 11,
    name: "notebook preset with config.json HTTPS true refuses with the conflict",
    image: notebookImage,
    configJson: { NEPTUNE_NOTEBOOK: true, PROXY_SERVER_HTTPS_CONNECTION: true },
    expected: notebookConflict,
  },
  {
    row: 12,
    name: "notebook preset with config.json HTTPS false serves HTTP on 9250",
    image: notebookImage,
    configJson: {
      NEPTUNE_NOTEBOOK: true,
      PROXY_SERVER_HTTPS_CONNECTION: false,
    },
    expected: notebookPreset,
  },
  {
    row: 13,
    name: "notebook preset forces GRAPH_EXP_HTTPS_CONNECTION=false over -e",
    image: notebookImage,
    dockerEnv: { GRAPH_EXP_HTTPS_CONNECTION: "true" },
    expected: notebookPreset,
  },
  {
    row: 13,
    name: "notebook preset forces GRAPH_EXP_HTTPS_CONNECTION=false over config.json",
    image: notebookImage,
    configJson: { NEPTUNE_NOTEBOOK: true, GRAPH_EXP_HTTPS_CONNECTION: true },
    expected: notebookPreset,
  },
  ...["TRUE", "True", "1", "yes"].flatMap((value): Deployment[] => [
    {
      row: 14,
      name: `-e NEPTUNE_NOTEBOOK=${value} is not the preset and defaults to TLS`,
      image: standardImage,
      dockerEnv: { NEPTUNE_NOTEBOOK: value },
      expected: {
        ...standardTls,
        envFile: { ...standardTls.envFile, NEPTUNE_NOTEBOOK: value },
      },
    },
    {
      row: 14,
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
    row: 15,
    // The shell treats the empty value as unset and writes the TLS default,
    // but dotenv never overrides a variable already in the environment, so
    // the server reads the empty value directly and its schema rejects it.
    name: "standard image with -e PROXY_SERVER_HTTPS_CONNECTION= generates certificates but fails the environment parse",
    image: standardImage,
    dockerEnv: { PROXY_SERVER_HTTPS_CONNECTION: "" },
    expected: { ...standardTls, server: environmentParseFailure },
  },
  {
    row: 16,
    // config.json replaces the image's NEPTUNE_NOTEBOOK, and a missing key
    // reads as unset, so the preset is off.
    name: "notebook image with config.json HTTPS true and no NEPTUNE_NOTEBOOK key serves TLS",
    image: notebookImage,
    configJson: { PROXY_SERVER_HTTPS_CONNECTION: true },
    expected: {
      ...standardTls,
      server: { ...https, logStyle: "cloudwatch" },
    },
  },
  {
    row: 17,
    name: "standard image with config.json NEPTUNE_NOTEBOOK and HTTPS true refuses with the conflict",
    image: standardImage,
    configJson: { NEPTUNE_NOTEBOOK: true, PROXY_SERVER_HTTPS_CONNECTION: true },
    expected: notebookConflict,
  },
  {
    row: 18,
    name: "notebook image with config.json NEPTUNE_NOTEBOOK false defaults to TLS",
    image: notebookImage,
    configJson: { NEPTUNE_NOTEBOOK: false },
    expected: {
      ...standardTls,
      server: { ...https, logStyle: "cloudwatch" },
    },
  },
  {
    row: 19,
    name: "standard image with config.json NEPTUNE_NOTEBOOK true applies the preset but keeps port 80",
    image: standardImage,
    configJson: { NEPTUNE_NOTEBOOK: true },
    expected: { ...notebookPreset, server: http },
  },
];

/** What the server does at startup: the listener it opens, or its refusal. */
function serverOutcome(env: EnvironmentValues) {
  try {
    const { useHttps, port } = resolveServerConfig(env);
    return { useHttps, port, logStyle: env.LOG_STYLE };
  } catch (error) {
    return error;
  }
}

/** Thrown by the mocked `process.exit` so a parse failure can be caught. */
class ProcessExitSignal extends Error {}

/**
 * What the server does at startup, including a failure to parse the
 * environment at all. Callers must mock `process.exit` to throw
 * {@link ProcessExitSignal} before calling this.
 */
function environmentOutcome(serverEnv: Record<string, string | undefined>) {
  try {
    return serverOutcome(parseEnvironmentValues(serverEnv));
  } catch (error) {
    if (error instanceof ProcessExitSignal) {
      return environmentParseFailure;
    }
    throw error;
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

  it.each(deployments)(
    "row $row: $name",
    ({ image, dockerEnv, configJson, host, expected }) => {
      if (configJson) {
        fs.writeFileSync(
          path.join(workDir, "config.json"),
          JSON.stringify(configJson),
        );
      }
      const containerEnv = {
        ...image,
        ...dockerEnv,
        ...(host === false ? {} : { HOST: "localhost" }),
      };

      const { exitCode, stdout } = runEntrypoint(
        workDir,
        scriptPath,
        containerEnv,
      );

      expect({
        exitCode,
        serverStarted: stdout.includes("SERVER_STARTED"),
      }).toStrictEqual({ exitCode: 0, serverStarted: true });

      const envFile = dotenv.parse(
        fs.readFileSync(path.join(configDir, ".env"), "utf-8"),
      );
      expect(envFile).toStrictEqual(expected.envFile);

      const certificatesGenerated = fs.existsSync(
        path.join(workDir, "ssl-called"),
      );
      expect(certificatesGenerated).toBe(expected.certificatesGenerated);

      // dotenv.config() never overwrites a key already in process.env.
      const serverEnv = {
        ...envFile,
        ...readServerEnvironment(workDir),
      };

      const existsSync = fs.existsSync;
      vi.spyOn(fs, "existsSync").mockImplementation(p =>
        p === expectedKeyPath || p === expectedCertPath
          ? certificatesGenerated
          : existsSync(p),
      );
      vi.spyOn(console, "error").mockImplementation(() => undefined);
      vi.spyOn(process, "exit").mockImplementation(() => {
        throw new ProcessExitSignal();
      });

      expect(environmentOutcome(serverEnv)).toStrictEqual(expected.server);
    },
  );
});
