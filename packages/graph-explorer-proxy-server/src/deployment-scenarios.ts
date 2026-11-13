import { expect } from "vite-plus/test";

import type { EnvironmentValues } from "./env.ts";

/** What `GET /defaultConnection` returned. */
export type DefaultConnectionResponse =
  | { status: 404 }
  | { status: 200; body: unknown }
  /** The response was served but isn't JSON. Holds its text. */
  | { status: 200; invalidJson: string };

/** A server that started, with everything an operator can observe about it. */
export type ServerStart = {
  /** Every field of the parsed EnvironmentValues that isn't undefined. */
  environment: Partial<EnvironmentValues>;
  listener: { protocol: "http" | "https"; port: number };
  /** Whether this start generated the self-signed certificate. */
  certificatesGenerated: boolean;
  defaultConnection: DefaultConnectionResponse;
  /** Every warning the start logged, in order. */
  warnings: string[];
  /**
   * The line the start logged when it skipped certificate generation for the
   * notebook preset or because HTTPS is off.
   */
  httpsNotice: string | undefined;
};

/**
 * What one start of the container does. `failed` holds the text the start
 * printed or threw: stderr for a refusal before the server runs, the logged
 * parse failure, or the server configuration error.
 */
export type StartupOutcome = { started: ServerStart } | { failed: string };

type DeploymentInputs = {
  /** Describes the inputs only, so it stays true when the outcome changes. */
  name: string;
  /** Values passed with `docker run -e`. */
  dockerEnv?: Record<string, string>;
  /**
   * config.json is a hand-edited file, so a boolean field there can hold
   * null, a number, or an arbitrary string instead of a JSON boolean. A
   * string is written as is, for text a reader has to handle.
   */
  configJson?: Record<string, boolean | string | number | null> | string;
  /**
   * Content already in `.env` before the first start, as an operator might
   * mount. A string is written as is.
   */
  existingEnvFile?: Record<string, string> | string;
  /** Content already in `.env.local`, which the server reads before `.env`. */
  existingEnvLocalFile?: string;
  /** Certificate files already in `cert-info` before the first start. */
  existingCertificates?: "all" | "server-only";
  /** A `defaultConnection.json` already in the configuration folder. */
  mountedDefaultConnection?: Record<string, unknown>;
  /** Every row sets HOST=localhost unless this is false or `-e` sets it. */
  host?: false;
  /**
   * Makes the configuration folder, or a file in it, read-only before the
   * start, as a read-only mount does. A missing file is created empty first.
   */
  readOnly?: "configFolder" | ".env" | "defaultConnection.json";
};

/**
 * A way to run the image, and what it does. A second start is a
 * `docker restart`, which keeps the container's files, or a new container
 * that mounts the same configuration folder and config.json.
 */
export type Deployment = DeploymentInputs &
  (
    | { secondStart?: undefined; expected: StartupOutcome }
    | {
        secondStart: "restart" | "new-container";
        expected: [first: StartupOutcome, second: StartupOutcome];
      }
  );

export const conflictMessage =
  "NEPTUNE_NOTEBOOK and PROXY_SERVER_HTTPS_CONNECTION are both true. " +
  "The Neptune Notebook preset serves Graph Explorer over HTTP and does " +
  "not generate TLS certificates, so this combination cannot start. " +
  "Either set PROXY_SERVER_HTTPS_CONNECTION to false or remove it " +
  "(from -e flags or config.json) to run under the notebook preset, " +
  "or set NEPTUNE_NOTEBOOK to false to run with TLS.";

/** Expects a parse failure at `key`, logging `message` when it is given. */
export function parseFailureAt(key: string, message?: string): StartupOutcome {
  return {
    failed: expect.stringContaining(
      message === undefined ? `→ at ${key}` : `✖ ${message}\n  → at ${key}`,
    ),
  };
}

export const missingCertificates: StartupOutcome = {
  failed: expect.stringContaining(
    "PROXY_SERVER_HTTPS_CONNECTION is true but certificate files are missing",
  ),
};

/** Expects the refusal process-environment.sh prints when it can't write `file`. */
export function cannotWrite(file: string): StartupOutcome {
  return {
    failed: expect.stringContaining(
      `Graph Explorer can't start because it can't write ./packages/graph-explorer/${file}. ` +
        "The container writes its settings to the configuration folder at startup, " +
        "so ./packages/graph-explorer must be writable. " +
        "Check that it isn't mounted read-only.",
    ),
  };
}

export function deprecated(name: string) {
  return `${name} is deprecated. Use PROXY_SERVER_PORT instead.`;
}

export function ignored(name: string, value: number, port: number) {
  return `${name} (${value}) is ignored because PROXY_SERVER_PORT (${port}) is set. ${name} is deprecated, remove it.`;
}

/** `environment` without the fields whose value is undefined. */
export function definedFields(
  environment: Partial<EnvironmentValues>,
): Partial<EnvironmentValues> {
  return Object.fromEntries(
    Object.entries(environment).filter(([, value]) => value !== undefined),
  );
}

const presetNotice =
  "Neptune Notebook preset enabled. Skipping self-signed certificate generation.";
const httpsOffNotice =
  "SSL disabled. Skipping self-signed certificate generation.";

export const https: ServerStart = {
  environment: {
    HOST: "localhost",
    PROXY_SERVER_LISTEN_ADDRESS: "127.0.0.1",
    NEPTUNE_NOTEBOOK: false,
    PROXY_SERVER_HTTPS_CONNECTION: true,
    LOG_LEVEL: "info",
    LOG_STYLE: "default",
  },
  listener: { protocol: "https", port: 443 },
  certificatesGenerated: true,
  defaultConnection: { status: 404 },
  warnings: [],
  httpsNotice: undefined,
};
export const http: ServerStart = {
  environment: { ...https.environment, PROXY_SERVER_HTTPS_CONNECTION: false },
  listener: { protocol: "http", port: 80 },
  certificatesGenerated: false,
  defaultConnection: { status: 404 },
  warnings: [],
  httpsNotice: httpsOffNotice,
};
export const notebook: ServerStart = {
  environment: {
    ...http.environment,
    NEPTUNE_NOTEBOOK: true,
    PROXY_SERVER_PORT: 9250,
    LOG_STYLE: "cloudwatch",
  },
  listener: { protocol: "http", port: 9250 },
  certificatesGenerated: false,
  defaultConnection: { status: 404 },
  warnings: [],
  httpsNotice: presetNotice,
};

/**
 * A start that serves like `base`, apart from `changes`. Their `environment`
 * merges over the base's, and a field set to undefined is removed.
 */
export function served(
  base: ServerStart,
  {
    environment = {},
    ...changes
  }: Partial<Omit<ServerStart, "environment">> & {
    environment?: Partial<EnvironmentValues>;
  } = {},
): StartupOutcome {
  return {
    started: {
      ...base,
      ...changes,
      environment: definedFields({ ...base.environment, ...environment }),
    },
  };
}

export const standardTls = served(https);
export const standardHttp = served(http);
export const notebookPreset = served(notebook);
export const notebookConflict = parseFailureAt(
  "PROXY_SERVER_HTTPS_CONNECTION",
  conflictMessage,
);

/**
 * Startup scenarios for the one image the Dockerfile builds. Its `ENV` lines
 * set nothing the startup reads, so the container's environment is `HOST`
 * plus the `-e` flags. The image's `PROXY_SERVER_LISTEN_ADDRESS=::` reaches
 * only the server, so the Docker build workflow checks it rather than this
 * table.
 */
export const deployments: Deployment[] = [
  {
    name: "nothing about HTTPS set",
    // HTTPS defaults to on, and HOST generates the certificate.
    expected: standardTls,
  },
  {
    name: "-e PROXY_SERVER_HTTPS_CONNECTION=false",
    dockerEnv: { PROXY_SERVER_HTTPS_CONNECTION: "false" },
    // HTTPS off serves HTTP on its default port, without a certificate.
    expected: standardHttp,
  },
  {
    name: "-e PROXY_SERVER_HTTP_PORT=8080 and HTTPS off",
    dockerEnv: {
      PROXY_SERVER_HTTPS_CONNECTION: "false",
      PROXY_SERVER_HTTP_PORT: "8080",
    },
    // The deprecated variable still sets the HTTP port, with a warning.
    expected: served(http, {
      environment: { PROXY_SERVER_HTTP_PORT: 8080 },
      listener: { protocol: "http", port: 8080 },
      warnings: [deprecated("PROXY_SERVER_HTTP_PORT")],
    }),
  },
  {
    name: "-e PROXY_SERVER_HTTPS_PORT=8443",
    dockerEnv: { PROXY_SERVER_HTTPS_PORT: "8443" },
    // The deprecated variable still sets the TLS port, with a warning.
    expected: served(https, {
      environment: { PROXY_SERVER_HTTPS_PORT: 8443 },
      listener: { protocol: "https", port: 8443 },
      warnings: [deprecated("PROXY_SERVER_HTTPS_PORT")],
    }),
  },
  {
    name: "-e PROXY_SERVER_PORT=8080 and HTTPS off",
    dockerEnv: {
      PROXY_SERVER_HTTPS_CONNECTION: "false",
      PROXY_SERVER_PORT: "8080",
    },
    // PROXY_SERVER_PORT sets the port for either protocol.
    expected: served(http, {
      environment: { PROXY_SERVER_PORT: 8080 },
      listener: { protocol: "http", port: 8080 },
    }),
  },
  {
    name: "-e PROXY_SERVER_PORT=8443",
    dockerEnv: { PROXY_SERVER_PORT: "8443" },
    // PROXY_SERVER_PORT sets the port for either protocol.
    expected: served(https, {
      environment: { PROXY_SERVER_PORT: 8443 },
      listener: { protocol: "https", port: 8443 },
    }),
  },
  {
    name: "-e PROXY_SERVER_PORT=9250 and -e PROXY_SERVER_HTTPS_PORT=8443",
    dockerEnv: {
      PROXY_SERVER_PORT: "9250",
      PROXY_SERVER_HTTPS_PORT: "8443",
    },
    // PROXY_SERVER_PORT beats the deprecated variable, which is ignored with a
    // warning.
    expected: served(https, {
      environment: { PROXY_SERVER_PORT: 9250, PROXY_SERVER_HTTPS_PORT: 8443 },
      listener: { protocol: "https", port: 9250 },
      warnings: [ignored("PROXY_SERVER_HTTPS_PORT", 8443, 9250)],
    }),
  },
  {
    name: "PROXY_SERVER_HTTP_PORT=8080 in .env with -e PROXY_SERVER_HTTPS_CONNECTION=false",
    existingEnvFile: { PROXY_SERVER_HTTP_PORT: "8080" },
    dockerEnv: { PROXY_SERVER_HTTPS_CONNECTION: "false" },
    // The server reads .env, so its deprecated port applies, with a warning.
    expected: served(http, {
      environment: { PROXY_SERVER_HTTP_PORT: 8080 },
      listener: { protocol: "http", port: 8080 },
      warnings: [deprecated("PROXY_SERVER_HTTP_PORT")],
    }),
  },
  {
    name: "PROXY_SERVER_PORT=8081 in .env with -e PROXY_SERVER_HTTPS_CONNECTION=false",
    existingEnvFile: { PROXY_SERVER_PORT: "8081" },
    dockerEnv: { PROXY_SERVER_HTTPS_CONNECTION: "false" },
    // The server reads .env, so its port applies.
    expected: served(http, {
      environment: { PROXY_SERVER_PORT: 8081 },
      listener: { protocol: "http", port: 8081 },
    }),
  },
  {
    name: "PROXY_SERVER_PORT=8081 in .env with -e PROXY_SERVER_HTTP_PORT=8080 and HTTPS off",
    existingEnvFile: { PROXY_SERVER_PORT: "8081" },
    dockerEnv: {
      PROXY_SERVER_HTTPS_CONNECTION: "false",
      PROXY_SERVER_HTTP_PORT: "8080",
    },
    // PROXY_SERVER_PORT beats the deprecated variable even though -e beats
    // .env for the same name.
    expected: served(http, {
      environment: { PROXY_SERVER_PORT: 8081, PROXY_SERVER_HTTP_PORT: 8080 },
      listener: { protocol: "http", port: 8081 },
      warnings: [ignored("PROXY_SERVER_HTTP_PORT", 8080, 8081)],
    }),
  },
  {
    name: "LOG_STYLE=cloudwatch in .env",
    existingEnvFile: { LOG_STYLE: "cloudwatch" },
    // The server reads .env. Earlier images set LOG_STYLE in their ENV, which
    // beat a mounted .env.
    expected: served(https, { environment: { LOG_STYLE: "cloudwatch" } }),
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=true with PROXY_SERVER_HTTP_PORT=8080 in .env",
    existingEnvFile: { PROXY_SERVER_HTTP_PORT: "8080" },
    dockerEnv: { NEPTUNE_NOTEBOOK: "true" },
    // The preset can't see the mounted line, so it still sets its port, and
    // PROXY_SERVER_PORT wins over the deprecated variable.
    expected: served(notebook, {
      environment: { PROXY_SERVER_HTTP_PORT: 8080 },
      warnings: [ignored("PROXY_SERVER_HTTP_PORT", 8080, 9250)],
    }),
  },
  {
    name: "-e PROXY_SERVER_HTTPS_CONNECTION=true",
    dockerEnv: { PROXY_SERVER_HTTPS_CONNECTION: "true" },
    // HTTPS on, and HOST generates the certificate.
    expected: standardTls,
  },
  {
    name: "-e PROXY_SERVER_HTTPS_CONNECTION=TRUE",
    dockerEnv: { PROXY_SERVER_HTTPS_CONNECTION: "TRUE" },
    // The entrypoint generates certificates only for an exact "true", but the
    // server reads HTTPS without regard to case, so it fails on the missing
    // certificates.
    expected: missingCertificates,
  },
  {
    name: "config.json HTTPS true",
    configJson: { PROXY_SERVER_HTTPS_CONNECTION: true },
    // config.json turns HTTPS on, and HOST generates the certificate.
    expected: standardTls,
  },
  {
    name: "config.json HTTPS false",
    configJson: { PROXY_SERVER_HTTPS_CONNECTION: false },
    // config.json turns HTTPS off.
    expected: standardHttp,
  },
  {
    name: "config.json HTTPS true and -e HTTPS false",
    dockerEnv: { PROXY_SERVER_HTTPS_CONNECTION: "false" },
    configJson: { PROXY_SERVER_HTTPS_CONNECTION: true },
    // config.json decides what the entrypoint reads, so it generates a
    // certificate, while the -e value wins in the server, which serves HTTP.
    expected: served(http, {
      certificatesGenerated: true,
      httpsNotice: undefined,
    }),
  },
  {
    name: "config.json HTTPS false and -e HTTPS true",
    dockerEnv: { PROXY_SERVER_HTTPS_CONNECTION: "true" },
    configJson: { PROXY_SERVER_HTTPS_CONNECTION: false },
    // config.json decides what the entrypoint reads, so it skips the
    // certificate, while the -e value wins in the server, which wants TLS and
    // fails on the missing certificates.
    expected: missingCertificates,
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=true",
    dockerEnv: { NEPTUNE_NOTEBOOK: "true" },
    // The preset serves HTTP on 9250 with cloudwatch logs.
    expected: notebookPreset,
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=true and -e PROXY_SERVER_HTTP_PORT=8080",
    dockerEnv: { NEPTUNE_NOTEBOOK: "true", PROXY_SERVER_HTTP_PORT: "8080" },
    // An explicit port keeps the preset from setting its own.
    expected: served(notebook, {
      environment: {
        PROXY_SERVER_PORT: undefined,
        PROXY_SERVER_HTTP_PORT: 8080,
      },
      listener: { protocol: "http", port: 8080 },
      warnings: [deprecated("PROXY_SERVER_HTTP_PORT")],
    }),
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=true and -e PROXY_SERVER_PORT=8080",
    dockerEnv: { NEPTUNE_NOTEBOOK: "true", PROXY_SERVER_PORT: "8080" },
    // An explicit port keeps the preset from setting its own.
    expected: served(notebook, {
      environment: { PROXY_SERVER_PORT: 8080 },
      listener: { protocol: "http", port: 8080 },
    }),
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=true with HTTPS off, PROXY_SERVER_PORT=9250, and PROXY_SERVER_HTTP_PORT=9250",
    dockerEnv: {
      NEPTUNE_NOTEBOOK: "true",
      PROXY_SERVER_HTTPS_CONNECTION: "false",
      PROXY_SERVER_PORT: "9250",
      PROXY_SERVER_HTTP_PORT: "9250",
    },
    // Notebook scripts set both port variables while older images ignore
    // PROXY_SERVER_PORT, so matching values start without a warning.
    expected: served(notebook, {
      environment: { PROXY_SERVER_HTTP_PORT: 9250 },
    }),
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=true and -e PROXY_SERVER_HTTPS_CONNECTION=true",
    dockerEnv: {
      NEPTUNE_NOTEBOOK: "true",
      PROXY_SERVER_HTTPS_CONNECTION: "true",
    },
    // The preset serves HTTP only, so it refuses an explicit HTTPS request.
    expected: notebookConflict,
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=true and -e PROXY_SERVER_HTTPS_CONNECTION=false",
    dockerEnv: {
      NEPTUNE_NOTEBOOK: "true",
      PROXY_SERVER_HTTPS_CONNECTION: "false",
    },
    // The preset with HTTPS off, as the SageMaker lifecycle script runs it.
    expected: notebookPreset,
  },
  {
    name: "a sagemaker-* tag without NEPTUNE_NOTEBOOK",
    // The sagemaker-* tags are aliases of the standard image, which bakes no
    // preset, so it starts like the standard image with TLS.
    expected: standardTls,
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=false",
    dockerEnv: { NEPTUNE_NOTEBOOK: "false" },
    // No preset, so HTTPS defaults to on.
    expected: standardTls,
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=true and -e PROXY_SERVER_HTTPS_CONNECTION=TRUE",
    dockerEnv: {
      NEPTUNE_NOTEBOOK: "true",
      PROXY_SERVER_HTTPS_CONNECTION: "TRUE",
    },
    // The server reads HTTPS without regard to case, so TRUE conflicts with
    // the preset.
    expected: notebookConflict,
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=true and -e PROXY_SERVER_HTTPS_CONNECTION=true without HOST",
    dockerEnv: {
      NEPTUNE_NOTEBOOK: "true",
      PROXY_SERVER_HTTPS_CONNECTION: "true",
    },
    host: false,
    // The preset skips certificates, so the start reaches the conflict
    // instead of stopping on the missing HOST.
    expected: notebookConflict,
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=true with config.json NEPTUNE_NOTEBOOK and HTTPS true",
    dockerEnv: { NEPTUNE_NOTEBOOK: "true" },
    configJson: { NEPTUNE_NOTEBOOK: true, PROXY_SERVER_HTTPS_CONNECTION: true },
    // config.json's HTTPS request conflicts with the preset.
    expected: notebookConflict,
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=true with config.json NEPTUNE_NOTEBOOK true and HTTPS false",
    dockerEnv: { NEPTUNE_NOTEBOOK: "true" },
    configJson: {
      NEPTUNE_NOTEBOOK: true,
      PROXY_SERVER_HTTPS_CONNECTION: false,
    },
    // config.json's HTTPS off matches the preset.
    expected: notebookPreset,
  },
  ...[null, "yes", 0].map((value): Deployment => ({
    name: `-e NEPTUNE_NOTEBOOK=true with config.json NEPTUNE_NOTEBOOK true and HTTPS ${JSON.stringify(value)}`,
    dockerEnv: { NEPTUNE_NOTEBOOK: "true" },
    configJson: {
      NEPTUNE_NOTEBOOK: true,
      PROXY_SERVER_HTTPS_CONNECTION: value,
    },
    // The preset replaces an HTTPS value that doesn't read as true with
    // false.
    expected: notebookPreset,
  })),
  {
    name: '-e NEPTUNE_NOTEBOOK=true with config.json NEPTUNE_NOTEBOOK true and HTTPS "TRUE"',
    dockerEnv: { NEPTUNE_NOTEBOOK: "true" },
    configJson: {
      NEPTUNE_NOTEBOOK: true,
      PROXY_SERVER_HTTPS_CONNECTION: "TRUE",
    },
    // config.json can hold "TRUE" just as easily as the boolean true; both
    // read as a request for HTTPS under the preset.
    expected: notebookConflict,
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=true and -e PROXY_SERVER_HTTPS_CONNECTION=yes",
    dockerEnv: {
      NEPTUNE_NOTEBOOK: "true",
      PROXY_SERVER_HTTPS_CONNECTION: "yes",
    },
    // -e always wins over .env, since dotenv never overrides a variable
    // already in the environment, so the invalid value fails the parse.
    expected: parseFailureAt("PROXY_SERVER_HTTPS_CONNECTION"),
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=true and -e GRAPH_EXP_HTTPS_CONNECTION=true",
    dockerEnv: { NEPTUNE_NOTEBOOK: "true", GRAPH_EXP_HTTPS_CONNECTION: "true" },
    // GRAPH_EXP_HTTPS_CONNECTION doesn't change how the server listens.
    expected: notebookPreset,
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=true with config.json NEPTUNE_NOTEBOOK and GRAPH_EXP_HTTPS_CONNECTION true",
    dockerEnv: { NEPTUNE_NOTEBOOK: "true" },
    configJson: { NEPTUNE_NOTEBOOK: true, GRAPH_EXP_HTTPS_CONNECTION: true },
    // GRAPH_EXP_HTTPS_CONNECTION doesn't change how the server listens.
    expected: notebookPreset,
  },
  ...["TRUE", "True", "1", "yes"].flatMap((value): Deployment[] => [
    {
      name: `-e NEPTUNE_NOTEBOOK=${value}`,
      dockerEnv: { NEPTUNE_NOTEBOOK: value },
      // Only an exact "true" applies the preset, so HTTPS defaults to on.
      expected: standardTls,
    },
    {
      name: `-e NEPTUNE_NOTEBOOK=${value} and -e PROXY_SERVER_HTTPS_CONNECTION=false`,
      dockerEnv: {
        NEPTUNE_NOTEBOOK: value,
        PROXY_SERVER_HTTPS_CONNECTION: "false",
      },
      // Only an exact "true" applies the preset, so it serves plain HTTP.
      expected: standardHttp,
    },
  ]),
  {
    name: "-e PROXY_SERVER_HTTPS_CONNECTION=",
    dockerEnv: { PROXY_SERVER_HTTPS_CONNECTION: "" },
    // The script treats the empty value as unset and writes the TLS default,
    // but dotenv never overrides a variable already in the environment, so
    // the server reads the empty value directly and its schema rejects it.
    expected: parseFailureAt("PROXY_SERVER_HTTPS_CONNECTION"),
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=true with config.json HTTPS true and no NEPTUNE_NOTEBOOK key",
    dockerEnv: { NEPTUNE_NOTEBOOK: "true" },
    configJson: { PROXY_SERVER_HTTPS_CONNECTION: true },
    // config.json replaces -e NEPTUNE_NOTEBOOK, and a missing key reads as
    // unset, so the preset is off and it serves TLS.
    expected: standardTls,
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=true and a config.json without the key",
    dockerEnv: { NEPTUNE_NOTEBOOK: "true" },
    configJson: {},
    // config.json replaces -e NEPTUNE_NOTEBOOK even when it lacks the key, so
    // the preset is off and it serves TLS.
    expected: standardTls,
  },
  {
    name: "config.json NEPTUNE_NOTEBOOK and HTTPS true without HOST",
    configJson: { NEPTUNE_NOTEBOOK: true, PROXY_SERVER_HTTPS_CONNECTION: true },
    host: false,
    // The preset skips certificates, so the start reaches the conflict
    // instead of stopping on the missing HOST.
    expected: notebookConflict,
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=true with config.json NEPTUNE_NOTEBOOK and HTTPS true without HOST",
    dockerEnv: { NEPTUNE_NOTEBOOK: "true" },
    configJson: { NEPTUNE_NOTEBOOK: true, PROXY_SERVER_HTTPS_CONNECTION: true },
    host: false,
    // The preset skips certificates, so the start reaches the conflict
    // instead of stopping on the missing HOST.
    expected: notebookConflict,
  },
  {
    name: "config.json NEPTUNE_NOTEBOOK and HTTPS true",
    configJson: { NEPTUNE_NOTEBOOK: true, PROXY_SERVER_HTTPS_CONNECTION: true },
    // config.json's HTTPS request conflicts with its own preset.
    expected: notebookConflict,
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=true with config.json NEPTUNE_NOTEBOOK false",
    dockerEnv: { NEPTUNE_NOTEBOOK: "true" },
    configJson: { NEPTUNE_NOTEBOOK: false },
    // config.json's false replaces -e NEPTUNE_NOTEBOOK, so it serves TLS.
    expected: standardTls,
  },
  {
    name: "config.json NEPTUNE_NOTEBOOK true",
    configJson: { NEPTUNE_NOTEBOOK: true },
    // config.json applies the preset.
    expected: notebookPreset,
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=true and -e PROXY_SERVER_HTTPS_CONNECTION=true, restarted",
    dockerEnv: {
      NEPTUNE_NOTEBOOK: "true",
      PROXY_SERVER_HTTPS_CONNECTION: "true",
    },
    secondStart: "restart",
    // The lines the first start appended don't hide the conflict.
    expected: [notebookConflict, notebookConflict],
  },
  {
    name: "the SageMaker lifecycle script's -e flags, restarted",
    dockerEnv: {
      HOST: "127.0.0.1",
      PROXY_SERVER_HTTPS_CONNECTION: "false",
      NEPTUNE_NOTEBOOK: "true",
    },
    secondStart: "restart",
    // The preset applies on every start.
    expected: [
      served(notebook, { environment: { HOST: "127.0.0.1" } }),
      served(notebook, { environment: { HOST: "127.0.0.1" } }),
    ],
  },
  {
    name: "nothing about HTTPS set, restarted",
    secondStart: "restart",
    // The entrypoint reads PROXY_SERVER_HTTPS_CONNECTION by its first match,
    // not its last, so a restart's repeated "true" line doesn't re-trigger
    // setup-ssl.sh. The container keeps serving TLS on the certificate
    // generated at first start, though the entrypoint logs that SSL is
    // disabled.
    expected: [
      standardTls,
      served(https, {
        certificatesGenerated: false,
        httpsNotice: httpsOffNotice,
      }),
    ],
  },
  {
    name: "a read-only configuration folder",
    readOnly: "configFolder",
    // The script writes .env at every start, so it refuses.
    expected: cannotWrite(".env"),
  },
  {
    name: "-e NEPTUNE_NOTEBOOK=true with a read-only configuration folder",
    dockerEnv: { NEPTUNE_NOTEBOOK: "true" },
    readOnly: "configFolder",
    // The script writes .env at every start, so it refuses.
    expected: cannotWrite(".env"),
  },
  {
    name: "LOG_LEVEL=debug in a read-only .env",
    existingEnvFile: { LOG_LEVEL: "debug" },
    readOnly: ".env",
    // The script writes .env at every start, so it refuses.
    expected: cannotWrite(".env"),
  },
  {
    name: "-e PUBLIC_OR_PROXY_ENDPOINT with a read-only defaultConnection.json",
    dockerEnv: { PUBLIC_OR_PROXY_ENDPOINT: "https://endpoint:8182" },
    readOnly: "defaultConnection.json",
    // A legacy direct connection resolves to PUBLIC_OR_PROXY_ENDPOINT, so the
    // script has a defaultConnection.json to write, and refuses before it
    // writes .env.
    expected: cannotWrite("defaultConnection.json"),
  },
  {
    name: "-e GRAPH_CONNECTION_URL with a read-only defaultConnection.json",
    dockerEnv: { GRAPH_CONNECTION_URL: "https://endpoint:8182" },
    readOnly: "defaultConnection.json",
    // The script has a defaultConnection.json to write, so it refuses before
    // it writes .env.
    expected: cannotWrite("defaultConnection.json"),
  },
  {
    name: "-e PUBLIC_OR_PROXY_ENDPOINT and -e USING_PROXY_SERVER=true with a read-only defaultConnection.json",
    dockerEnv: {
      PUBLIC_OR_PROXY_ENDPOINT: "https://endpoint:8182",
      USING_PROXY_SERVER: "true",
    },
    readOnly: "defaultConnection.json",
    // A proxied legacy connection resolves to GRAPH_CONNECTION_URL, which is
    // empty here, so there is no defaultConnection.json to write. The empty
    // file the row makes read-only is what the route serves.
    expected: served(https, {
      defaultConnection: { status: 200, invalidJson: "" },
    }),
  },
];
