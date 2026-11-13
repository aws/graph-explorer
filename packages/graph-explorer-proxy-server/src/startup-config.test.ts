import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";

import { parseConfigJson } from "./config-json.ts";
import { conflictMessage } from "./deployment-scenarios.ts";
import { EnvFileError } from "./env-file.ts";
import {
  loadStartup,
  resolveStartupConfig,
  StartupError,
  type TextFile,
} from "./startup-config.ts";
import { legacyStartupBlock, withoutBlankLines } from "./testing.ts";

type Inputs = {
  processEnv?: Record<string, string | undefined>;
  dotEnv?: string;
  dotEnvLocal?: string;
  configJson?: Record<string, unknown>;
  image?: boolean;
};

function textFile(
  name: string,
  text: string | undefined,
): TextFile | undefined {
  return text === undefined ? undefined : { path: `/config/${name}`, text };
}

/** Resolves the startup configuration of the image unless `image` says otherwise. */
function resolve({
  processEnv = {},
  dotEnv,
  dotEnvLocal,
  configJson,
  image = true,
}: Inputs = {}) {
  return resolveStartupConfig({
    processEnv,
    dotEnv: textFile(".env", dotEnv),
    dotEnvLocal: textFile(".env.local", dotEnvLocal),
    configJson: configJson && {
      path: "config.json",
      ...parseConfigJson(JSON.stringify(configJson), "config.json"),
    },
    image,
  });
}

const db = "https://db:8182";

describe("resolveStartupConfig", () => {
  describe("SSL defaults", () => {
    it("defaults PROXY_SERVER_HTTPS_CONNECTION to true in the image", () => {
      expect(resolve().serverEnv.PROXY_SERVER_HTTPS_CONNECTION).toBe("true");
    });

    it("leaves PROXY_SERVER_HTTPS_CONNECTION to the server's default from source", () => {
      expect(
        resolve({ image: false }).serverEnv.PROXY_SERVER_HTTPS_CONNECTION,
      ).toBeUndefined();
    });

    it("respects PROXY_SERVER_HTTPS_CONNECTION=false", () => {
      expect(
        resolve({ processEnv: { PROXY_SERVER_HTTPS_CONNECTION: "false" } })
          .serverEnv.PROXY_SERVER_HTTPS_CONNECTION,
      ).toBe("false");
    });

    // #2504: the .env value, not a default appended after it, decides.
    it("takes PROXY_SERVER_HTTPS_CONNECTION from .env", () => {
      expect(
        resolve({ dotEnv: "PROXY_SERVER_HTTPS_CONNECTION=false\n" }).serverEnv
          .PROXY_SERVER_HTTPS_CONNECTION,
      ).toBe("false");
    });

    it("treats an empty PROXY_SERVER_HTTPS_CONNECTION as unset", () => {
      expect(
        resolve({ processEnv: { PROXY_SERVER_HTTPS_CONNECTION: "" } }).serverEnv
          .PROXY_SERVER_HTTPS_CONNECTION,
      ).toBe("true");
    });
  });

  describe("precedence of PROXY_SERVER_HTTPS_CONNECTION", () => {
    const sources = {
      processEnv: { PROXY_SERVER_HTTPS_CONNECTION: "env" },
      configJson: { PROXY_SERVER_HTTPS_CONNECTION: "config" },
      dotEnv: "PROXY_SERVER_HTTPS_CONNECTION=dotenv\n",
      dotEnvLocal: "PROXY_SERVER_HTTPS_CONNECTION=local\n",
    };

    it.for([
      ["the environment", sources, "env"],
      [
        ".env.local over config.json",
        {
          dotEnvLocal: sources.dotEnvLocal,
          configJson: sources.configJson,
          dotEnv: sources.dotEnv,
        },
        "local",
      ],
      [
        "config.json over .env",
        { configJson: sources.configJson, dotEnv: sources.dotEnv },
        "config",
      ],
      ["a .env file", { dotEnv: sources.dotEnv }, "dotenv"],
    ] as const)("%s", ([_name, inputs, expected]) => {
      expect(resolve(inputs).serverEnv.PROXY_SERVER_HTTPS_CONNECTION).toBe(
        expected,
      );
    });
  });

  describe("NEPTUNE_NOTEBOOK=true", () => {
    const preset = { processEnv: { NEPTUNE_NOTEBOOK: "true" } };

    it("serves HTTP on port 9250 with CloudWatch-style logs", () => {
      const { serverEnv } = resolve(preset);

      expect(serverEnv).toMatchObject({
        NEPTUNE_NOTEBOOK: "true",
        PROXY_SERVER_HTTPS_CONNECTION: "false",
        PROXY_SERVER_PORT: "9250",
        LOG_STYLE: "cloudwatch",
      });
      // The old variable would make the server warn on every start.
      expect(serverEnv.PROXY_SERVER_HTTP_PORT).toBeUndefined();
    });

    it.for(["PROXY_SERVER_HTTP_PORT", "PROXY_SERVER_PORT"])(
      "respects an explicit %s",
      port => {
        const { serverEnv } = resolve({
          processEnv: { NEPTUNE_NOTEBOOK: "true", [port]: "8080" },
        });

        expect(serverEnv[port]).toBe("8080");
        expect(
          port === "PROXY_SERVER_PORT"
            ? serverEnv.PROXY_SERVER_HTTP_PORT
            : serverEnv.PROXY_SERVER_PORT,
        ).toBeUndefined();
      },
    );

    it("respects an explicit LOG_STYLE", () => {
      expect(
        resolve({
          processEnv: { NEPTUNE_NOTEBOOK: "true", LOG_STYLE: "default" },
        }).serverEnv.LOG_STYLE,
      ).toBe("default");
    });

    it("beats a port and log style in .env, as the lines the shell appended did", () => {
      expect(
        resolve({
          ...preset,
          dotEnv: "PROXY_SERVER_PORT=8081\nLOG_STYLE=default\n",
        }).serverEnv,
      ).toMatchObject({ PROXY_SERVER_PORT: "9250", LOG_STYLE: "cloudwatch" });
    });

    it("yields to a port and log style in .env.local, as it did before the lines moved out of .env", () => {
      expect(
        resolve({
          ...preset,
          dotEnv: "PROXY_SERVER_PORT=8081\nLOG_STYLE=default\n",
          dotEnvLocal: "PROXY_SERVER_PORT=8082\nLOG_STYLE=default\n",
        }).serverEnv,
      ).toMatchObject({ PROXY_SERVER_PORT: "8082", LOG_STYLE: "default" });
    });

    it.for([
      [
        "a true in the environment",
        { PROXY_SERVER_HTTPS_CONNECTION: "true" },
        "true",
      ],
      [
        "an invalid value in the environment",
        { PROXY_SERVER_HTTPS_CONNECTION: "yes" },
        "yes",
      ],
    ] as const)(
      "keeps %s for the server to reject",
      ([_name, env, expected]) => {
        expect(
          resolve({ processEnv: { ...preset.processEnv, ...env } }).serverEnv
            .PROXY_SERVER_HTTPS_CONNECTION,
        ).toBe(expected);
      },
    );

    it.for([
      ["true", "true"],
      ["TRUE", "TRUE"],
      ["false", "false"],
      [null, "false"],
      ["yes", "false"],
      [0, "false"],
    ] as const)(
      "reads a config.json HTTPS of %j as %s",
      ([configValue, expected]) => {
        expect(
          resolve({
            configJson: {
              NEPTUNE_NOTEBOOK: true,
              PROXY_SERVER_HTTPS_CONNECTION: configValue,
            },
          }).serverEnv.PROXY_SERVER_HTTPS_CONNECTION,
        ).toBe(expected);
      },
    );

    it("keeps an HTTPS true in .env.local for the server to reject", () => {
      expect(
        resolve({
          ...preset,
          dotEnvLocal: "PROXY_SERVER_HTTPS_CONNECTION=true\n",
        }).serverEnv.PROXY_SERVER_HTTPS_CONNECTION,
      ).toBe("true");
    });

    it("lets an HTTPS false in .env.local stand", () => {
      expect(
        resolve({
          ...preset,
          configJson: {
            NEPTUNE_NOTEBOOK: true,
            PROXY_SERVER_HTTPS_CONNECTION: true,
          },
          dotEnvLocal: "PROXY_SERVER_HTTPS_CONNECTION=false\n",
        }).serverEnv.PROXY_SERVER_HTTPS_CONNECTION,
      ).toBe("false");
    });

    it("forces HTTPS off when nothing asked for it", () => {
      expect(
        resolve({ ...preset, dotEnv: "PROXY_SERVER_HTTPS_CONNECTION=true\n" })
          .serverEnv.PROXY_SERVER_HTTPS_CONNECTION,
      ).toBe("false");
    });
  });

  describe("NEPTUNE_NOTEBOOK other than true", () => {
    it.for(["false", "TRUE", "True", "1", "yes"])(
      "%s doesn't apply the preset",
      value => {
        const { serverEnv } = resolve({
          processEnv: { NEPTUNE_NOTEBOOK: value },
        });

        expect(serverEnv.PROXY_SERVER_HTTPS_CONNECTION).toBe("true");
        expect(serverEnv.PROXY_SERVER_PORT).toBeUndefined();
        expect(serverEnv.LOG_STYLE).toBeUndefined();
      },
    );

    it("is unset when nothing sets it", () => {
      expect(resolve().serverEnv.NEPTUNE_NOTEBOOK).toBeUndefined();
    });

    // A user's line was never effective: the shell resolved the value and
    // the environment beat the file.
    it("ignores NEPTUNE_NOTEBOOK in .env", () => {
      expect(
        resolve({ dotEnv: "NEPTUNE_NOTEBOOK=true\n" }).serverEnv,
      ).toMatchObject({
        NEPTUNE_NOTEBOOK: undefined,
        PROXY_SERVER_HTTPS_CONNECTION: "true",
      });
    });
  });

  describe("config.json after the environment", () => {
    it("reads the values from config.json", () => {
      const startup = resolve({
        configJson: {
          GRAPH_TYPE: "sparql",
          IAM: true,
          GRAPH_CONNECTION_URL: db,
          AWS_REGION: "us-west-2",
          PROXY_SERVER_HTTPS_CONNECTION: false,
        },
      });

      expect(startup.serverEnv.PROXY_SERVER_HTTPS_CONNECTION).toBe("false");
      expect(startup.defaultConnection).toMatchObject({
        GRAPH_EXP_GRAPH_TYPE: "sparql",
        GRAPH_EXP_IAM: true,
        GRAPH_EXP_CONNECTION_URL: db,
        GRAPH_EXP_AWS_REGION: "us-west-2",
      });
    });

    it("yields to the environment for a key both set", () => {
      expect(
        resolve({
          configJson: {
            GRAPH_TYPE: "sparql",
            GRAPH_CONNECTION_URL: "https://from-config:8182",
            AWS_REGION: "us-west-2",
          },
          processEnv: {
            GRAPH_TYPE: "gremlin",
            GRAPH_CONNECTION_URL: "https://from-env:8182",
            AWS_REGION: "eu-west-1",
          },
        }).defaultConnection,
      ).toMatchObject({
        GRAPH_EXP_GRAPH_TYPE: "gremlin",
        GRAPH_EXP_CONNECTION_URL: "https://from-env:8182",
        GRAPH_EXP_AWS_REGION: "eu-west-1",
      });
    });

    it("fills the keys the environment leaves unset", () => {
      expect(
        resolve({
          configJson: { GRAPH_TYPE: "sparql", AWS_REGION: "us-west-2" },
          processEnv: { GRAPH_CONNECTION_URL: db, AWS_REGION: "eu-west-1" },
        }).defaultConnection,
      ).toMatchObject({
        GRAPH_EXP_CONNECTION_URL: db,
        GRAPH_EXP_GRAPH_TYPE: "sparql",
        GRAPH_EXP_AWS_REGION: "eu-west-1",
      });
    });

    it("fills a key the environment sets to an empty value", () => {
      const startup = resolve({
        configJson: {
          GRAPH_CONNECTION_URL: db,
          PROXY_SERVER_HTTPS_CONNECTION: false,
        },
        processEnv: {
          GRAPH_CONNECTION_URL: "",
          PROXY_SERVER_HTTPS_CONNECTION: "",
        },
      });

      expect(startup.serverEnv.PROXY_SERVER_HTTPS_CONNECTION).toBe("false");
      expect(startup.defaultConnection?.GRAPH_EXP_CONNECTION_URL).toBe(db);
    });

    it("leaves an empty environment value of a key config.json can't hold for the server to reject", () => {
      expect(
        resolve({ processEnv: { PROXY_SERVER_LISTEN_ADDRESS: "" } }).serverEnv
          .PROXY_SERVER_LISTEN_ADDRESS,
      ).toBe("");
    });

    it("yields NEPTUNE_NOTEBOOK to the environment", () => {
      expect(
        resolve({
          configJson: { NEPTUNE_NOTEBOOK: false },
          processEnv: { NEPTUNE_NOTEBOOK: "true" },
        }).serverEnv,
      ).toMatchObject({
        NEPTUNE_NOTEBOOK: "true",
        PROXY_SERVER_HTTPS_CONNECTION: "false",
        PROXY_SERVER_PORT: "9250",
      });
    });

    it("applies the preset from config.json", () => {
      expect(
        resolve({ configJson: { NEPTUNE_NOTEBOOK: true } }).serverEnv,
      ).toMatchObject({
        NEPTUNE_NOTEBOOK: "true",
        PROXY_SERVER_PORT: "9250",
      });
    });

    it("keeps config.json's HTTPS true under the preset from the environment, for the server to reject", () => {
      expect(
        resolve({
          configJson: { PROXY_SERVER_HTTPS_CONNECTION: true },
          processEnv: { NEPTUNE_NOTEBOOK: "true" },
        }).serverEnv,
      ).toMatchObject({
        NEPTUNE_NOTEBOOK: "true",
        PROXY_SERVER_HTTPS_CONNECTION: "true",
      });
    });

    it("carries the fetch timeout and node expansion limit to the Default Connection", () => {
      expect(
        resolve({
          configJson: {
            GRAPH_CONNECTION_URL: db,
            GRAPH_EXP_FETCH_REQUEST_TIMEOUT: 60000,
            GRAPH_EXP_NODE_EXPANSION_LIMIT: 500,
          },
        }).defaultConnection,
      ).toMatchObject({
        GRAPH_EXP_FETCH_REQUEST_TIMEOUT: 60000,
        GRAPH_EXP_NODE_EXPANSION_LIMIT: 500,
      });
    });

    it("warns once about a config.json node expansion limit of -1", () => {
      expect(
        resolve({
          configJson: {
            GRAPH_CONNECTION_URL: db,
            GRAPH_EXP_NODE_EXPANSION_LIMIT: -1,
          },
        }).warnings,
      ).toStrictEqual([
        `GRAPH_EXP_NODE_EXPANSION_LIMIT is "-1", which isn't a positive whole number, so the Default Connection leaves it out.`,
      ]);
    });

    it("collects the parser's warnings", () => {
      expect(
        resolve({ configJson: { IAM: { enabled: true } } }).warnings,
      ).toStrictEqual([
        `config.json: IAM can't be {"enabled":true}, so it is ignored.`,
      ]);
    });
  });

  describe("connection settings", () => {
    it("come from the environment without a config.json", () => {
      expect(
        resolve({ processEnv: { GRAPH_CONNECTION_URL: db, IAM: "true" } })
          .defaultConnection,
      ).toMatchObject({ GRAPH_EXP_CONNECTION_URL: db, GRAPH_EXP_IAM: true });
    });

    it("come from .env", () => {
      expect(
        resolve({
          dotEnv: `GRAPH_CONNECTION_URL=${db}\nSERVICE_TYPE=neptune-graph\n`,
        }).defaultConnection,
      ).toMatchObject({
        GRAPH_EXP_CONNECTION_URL: db,
        GRAPH_EXP_SERVICE_TYPE: "neptune-graph",
      });
    });

    it("come from .env.local over config.json", () => {
      expect(
        resolve({
          dotEnvLocal: "GRAPH_CONNECTION_URL=https://from-local:8182\n",
          configJson: { GRAPH_CONNECTION_URL: "https://from-config:8182" },
        }).defaultConnection?.GRAPH_EXP_CONNECTION_URL,
      ).toBe("https://from-local:8182");
    });

    it("keep config.json's value when .env.local sets the key empty", () => {
      expect(
        resolve({
          dotEnvLocal: "GRAPH_CONNECTION_URL=\n",
          configJson: { GRAPH_CONNECTION_URL: "https://from-config:8182" },
        }).defaultConnection?.GRAPH_EXP_CONNECTION_URL,
      ).toBe("https://from-config:8182");
    });

    it("come from config.json over .env", () => {
      expect(
        resolve({
          dotEnv: "GRAPH_CONNECTION_URL=https://from-dotenv:8182\n",
          configJson: { GRAPH_CONNECTION_URL: "https://from-config:8182" },
        }).defaultConnection?.GRAPH_EXP_CONNECTION_URL,
      ).toBe("https://from-config:8182");
    });

    it("come from the environment over every file", () => {
      expect(
        resolve({
          processEnv: { GRAPH_CONNECTION_URL: "https://from-env:8182" },
          dotEnv: "GRAPH_CONNECTION_URL=https://from-dotenv:8182\n",
          dotEnvLocal: "GRAPH_CONNECTION_URL=https://from-local:8182\n",
          configJson: { GRAPH_CONNECTION_URL: "https://from-config:8182" },
        }).defaultConnection?.GRAPH_EXP_CONNECTION_URL,
      ).toBe("https://from-env:8182");
    });

    it("leave NEPTUNE_NOTEBOOK in .env and .env.local ignored", () => {
      expect(
        resolve({
          dotEnv: "NEPTUNE_NOTEBOOK=true\n",
          dotEnvLocal: "NEPTUNE_NOTEBOOK=true\n",
        }).serverEnv.NEPTUNE_NOTEBOOK,
      ).toBeUndefined();
    });

    it("collect the Default Connection's warnings", () => {
      expect(
        resolve({ processEnv: { GRAPH_CONNECTION_URL: db, IAM: "yes" } })
          .warnings,
      ).toStrictEqual([
        `IAM is "yes", which isn't true or false, so the Default Connection uses false.`,
      ]);
    });
  });

  describe(".env files", () => {
    it("reads .env.local before .env", () => {
      expect(
        resolve({
          dotEnv: "LOG_LEVEL=info\nHOST=from-env\n",
          dotEnvLocal: "LOG_LEVEL=debug\n",
        }),
      ).toMatchObject({
        envFileValues: { LOG_LEVEL: "debug", HOST: "from-env" },
        serverEnv: { LOG_LEVEL: "debug", HOST: "from-env" },
      });
    });

    it("lets the environment beat the files", () => {
      expect(
        resolve({
          processEnv: { LOG_LEVEL: "warn" },
          dotEnv: "LOG_LEVEL=info\n",
        }).serverEnv.LOG_LEVEL,
      ).toBe("warn");
    });

    it("ignores the lines earlier versions appended and says how many", () => {
      const block = legacyStartupBlock({
        neptuneNotebook: "false",
        https: "true",
        graphExpHttps: "true",
      });

      const { envFileValues, serverEnv, info } = resolve({
        dotEnv: `LOG_LEVEL=debug\nPROXY_SERVER_HTTPS_CONNECTION=false\n${block.repeat(3)}`,
      });

      expect(envFileValues).toStrictEqual({
        LOG_LEVEL: "debug",
        PROXY_SERVER_HTTPS_CONNECTION: "false",
      });
      expect(serverEnv.PROXY_SERVER_HTTPS_CONNECTION).toBe("false");
      expect(info).toStrictEqual([
        "Ignored 18 lines of /config/.env, which earlier versions of Graph Explorer appended at each start. Startup now reads those settings directly, so you can delete the lines.",
      ]);
    });

    it("ignores those lines wherever they sit and keeps the operator's own", () => {
      const httpStart = legacyStartupBlock({
        neptuneNotebook: "false",
        https: "false",
        graphExpHttps: "true",
      });
      const httpsStart = legacyStartupBlock({
        neptuneNotebook: "false",
        https: "true",
        graphExpHttps: "true",
      });

      const { envFileValues, serverEnv, info } = resolve({
        dotEnv: `LOG_LEVEL=debug\n${httpStart}\n${httpsStart.repeat(2)}`,
      });

      expect(envFileValues).toStrictEqual({ LOG_LEVEL: "debug" });
      expect(serverEnv.PROXY_SERVER_HTTPS_CONNECTION).toBe("true");
      expect(info).toHaveLength(1);
    });

    // A tidied block from an HTTP container still holds HTTPS false, which
    // would turn TLS off if it were read.
    it("ignores those lines after the blank lines between them were removed", () => {
      const httpStart = withoutBlankLines(
        legacyStartupBlock({
          neptuneNotebook: "false",
          https: "false",
          graphExpHttps: "true",
        }),
      );

      const { serverEnv, info } = resolve({ dotEnv: httpStart.repeat(2) });

      expect(serverEnv.PROXY_SERVER_HTTPS_CONNECTION).toBe("true");
      expect(info).toStrictEqual([
        "Ignored 6 lines of /config/.env, which earlier versions of Graph Explorer appended at each start. Startup now reads those settings directly, so you can delete the lines.",
      ]);
    });

    it("says nothing about a .env without those lines", () => {
      expect(resolve({ dotEnv: "LOG_LEVEL=debug\n" }).info).toStrictEqual([]);
    });

    it("stops on a key set twice in .env or .env.local", () => {
      expect(() => resolve({ dotEnvLocal: "PORT=1\nPORT=2\n" })).toThrow(
        new EnvFileError(
          "/config/.env.local sets PORT more than once, on lines 1 and 2. Keep one line for each key and remove the others. Earlier versions used the last line.",
        ),
      );
    });

    it("doesn't count a key the operator sets once against the lines earlier versions appended", () => {
      const block = legacyStartupBlock({
        neptuneNotebook: "false",
        https: "true",
        graphExpHttps: "true",
      });

      expect(
        resolve({
          dotEnv: `PROXY_SERVER_HTTPS_CONNECTION=false\n${block}${block}`,
        }).serverEnv.PROXY_SERVER_HTTPS_CONNECTION,
      ).toBe("false");
    });
  });

  it("doesn't count lines earlier versions appended with CRLF line breaks", () => {
    const block = legacyStartupBlock({
      neptuneNotebook: "false",
      https: "true",
      graphExpHttps: "true",
    }).replaceAll("\n", "\r\n");

    expect(
      resolve({
        dotEnv: `PROXY_SERVER_HTTPS_CONNECTION=false\r\n${block}`,
      }).serverEnv.PROXY_SERVER_HTTPS_CONNECTION,
    ).toBe("false");
  });

  it("names a duplicate key's lines as they are in the file when a block sits between them", () => {
    const block = legacyStartupBlock({
      neptuneNotebook: "false",
      https: "true",
      graphExpHttps: "true",
    });

    expect(() =>
      resolve({ dotEnv: `LOG_STYLE=default\n${block}LOG_STYLE=cloudwatch\n` }),
    ).toThrow(
      new EnvFileError(
        "/config/.env sets LOG_STYLE more than once, on lines 1 and 8. Keep one line for each key and remove the others. Earlier versions used the last line.",
      ),
    );
  });

  describe("HTTPS notice", () => {
    it("is unset when HTTPS is on", () => {
      expect(resolve().httpsNotice).toBeUndefined();
    });

    it.for([
      [
        "the environment",
        { processEnv: { PROXY_SERVER_HTTPS_CONNECTION: "false" } },
        "the environment",
      ],
      [
        ".env.local",
        { dotEnvLocal: "PROXY_SERVER_HTTPS_CONNECTION=false\n" },
        "/config/.env.local",
      ],
      [
        "config.json",
        { configJson: { PROXY_SERVER_HTTPS_CONNECTION: false } },
        "config.json",
      ],
      [
        ".env",
        { dotEnv: "PROXY_SERVER_HTTPS_CONNECTION=FALSE\n" },
        "/config/.env",
      ],
    ] satisfies [string, Inputs, string][])(
      "names %s when it turns HTTPS off",
      ([_source, inputs, source]) => {
        expect(resolve(inputs).httpsNotice).toBe(
          `HTTPS is off, set by PROXY_SERVER_HTTPS_CONNECTION in ${source}`,
        );
      },
    );

    it("names the source that wins", () => {
      expect(
        resolve({
          dotEnv: "PROXY_SERVER_HTTPS_CONNECTION=true\n",
          configJson: { PROXY_SERVER_HTTPS_CONNECTION: false },
        }).httpsNotice,
      ).toBe(
        "HTTPS is off, set by PROXY_SERVER_HTTPS_CONNECTION in config.json",
      );
    });

    it("names the preset under the preset", () => {
      expect(
        resolve({ processEnv: { NEPTUNE_NOTEBOOK: "true" } }).httpsNotice,
      ).toBe(
        "Neptune Notebook preset enabled. Skipping self-signed certificate generation.",
      );
    });

    it("is unset from source, which never generates a certificate", () => {
      expect(
        resolve({
          image: false,
          dotEnv: "PROXY_SERVER_HTTPS_CONNECTION=false\n",
        }).httpsNotice,
      ).toBeUndefined();
    });
  });

  describe("certificate host", () => {
    it("comes from the process environment", () => {
      expect(resolve({ processEnv: { HOST: "my-host" } }).certificateHost).toBe(
        "my-host",
      );
    });

    // A HOST in .env sets the printed URL, and must never replace
    // certificates kept in a volume.
    it("never comes from .env", () => {
      expect(
        resolve({ dotEnv: "HOST=my-host\n" }).certificateHost,
      ).toBeUndefined();
    });

    it("is unset when the environment's is empty", () => {
      expect(
        resolve({ processEnv: { HOST: "" } }).certificateHost,
      ).toBeUndefined();
    });
  });
});

describe("resolveStartupConfig from source", () => {
  it("applies the preset with HTTPS off by default", () => {
    expect(
      resolve({ image: false, processEnv: { NEPTUNE_NOTEBOOK: "true" } })
        .serverEnv,
    ).toMatchObject({
      NEPTUNE_NOTEBOOK: "true",
      PROXY_SERVER_HTTPS_CONNECTION: "false",
      PROXY_SERVER_PORT: "9250",
    });
  });

  it("reads config.json like the image", () => {
    expect(
      resolve({
        image: false,
        configJson: { PROXY_SERVER_HTTPS_CONNECTION: true },
      }).serverEnv.PROXY_SERVER_HTTPS_CONNECTION,
    ).toBe("true");
  });
});

describe("loadStartup", () => {
  let workDir: string;
  let configPath: string;
  let configJsonPath: string;

  beforeEach(() => {
    workDir = fs.mkdtempSync(path.join(os.tmpdir(), "ge-startup-config-"));
    configPath = path.join(workDir, "config");
    fs.mkdirSync(configPath);
    configJsonPath = path.join(workDir, "config.json");
  });

  afterEach(() => {
    fs.chmodSync(configPath, 0o755);
    fs.rmSync(workDir, { recursive: true, force: true });
  });

  function load(processEnv: Record<string, string | undefined> = {}) {
    return loadStartup({ processEnv, configPath, configJsonPath, image: true });
  }

  it("reads .env from a custom configuration folder", () => {
    fs.writeFileSync(path.join(configPath, ".env"), "LOG_LEVEL=debug\n");

    expect(load({ CONFIGURATION_FOLDER_PATH: configPath }).env.LOG_LEVEL).toBe(
      "debug",
    );
  });

  it("reads .env.local before .env", () => {
    fs.writeFileSync(path.join(configPath, ".env"), "LOG_LEVEL=info\n");
    fs.writeFileSync(path.join(configPath, ".env.local"), "LOG_LEVEL=debug\n");

    expect(load().env.LOG_LEVEL).toBe("debug");
  });

  it("starts without a .env", () => {
    expect(load().env.PROXY_SERVER_HTTPS_CONNECTION).toBe(true);
  });

  it("reads config.json", () => {
    fs.writeFileSync(
      configJsonPath,
      `{
  // Serve plain HTTP
  "PROXY_SERVER_HTTPS_CONNECTION": false,
  "GRAPH_CONNECTION_URL": "${db}",
}`,
    );

    const { env, startup } = load();

    expect(env.PROXY_SERVER_HTTPS_CONNECTION).toBe(false);
    expect(startup.defaultConnection?.GRAPH_EXP_CONNECTION_URL).toBe(db);
  });

  it("reads config.json from source", () => {
    fs.writeFileSync(configJsonPath, '{"PROXY_SERVER_HTTPS_CONNECTION": true}');

    expect(
      loadStartup({ processEnv: {}, configPath, configJsonPath, image: false })
        .env.PROXY_SERVER_HTTPS_CONNECTION,
    ).toBe(true);
  });

  it("ignores a config.json that is a directory, as Docker creates at a missing bind source", () => {
    fs.mkdirSync(configJsonPath);

    expect(load().env.PROXY_SERVER_HTTPS_CONNECTION).toBe(true);
  });

  it("stops startup for a config.json that isn't JSON, naming the file", () => {
    fs.writeFileSync(configJsonPath, "not json");

    expect(() => load()).toThrow(StartupError);
    expect(() => load()).toThrow(
      `${configJsonPath} isn't valid JSON, so Graph Explorer can't read its settings`,
    );
  });

  it("stops startup for a key set twice in .env, naming the file", () => {
    fs.writeFileSync(path.join(configPath, ".env"), "A=1\nA=2\n");

    expect(() => load()).toThrow(
      new StartupError(
        `${path.join(configPath, ".env")} sets A more than once, on lines 1 and 2. Keep one line for each key and remove the others. Earlier versions used the last line.`,
      ),
    );
  });

  it("stops startup when the configuration folder doesn't exist", () => {
    const missing = path.join(workDir, "missing");

    expect(() =>
      loadStartup({
        processEnv: { CONFIGURATION_FOLDER_PATH: missing },
        configPath: missing,
        configJsonPath,
        image: true,
      }),
    ).toThrow(
      new StartupError(
        `Configuration folder does not exist: CONFIGURATION_FOLDER_PATH="${missing}"`,
      ),
    );
    expect(() =>
      loadStartup({
        processEnv: {},
        configPath: missing,
        configJsonPath,
        image: true,
      }),
    ).toThrow(
      `Configuration folder does not exist: default config path "${missing}"`,
    );
  });

  it("stops startup with the environment parse failure", () => {
    expect(() =>
      load({ NEPTUNE_NOTEBOOK: "true", PROXY_SERVER_HTTPS_CONNECTION: "true" }),
    ).toThrow(conflictMessage);
    expect(() => load({ PROXY_SERVER_LISTEN_ADDRESS: "" })).toThrow(
      "Failed to parse environment values",
    );
  });

  it("changes neither the process environment nor the configuration folder", ({
    skip,
  }) => {
    // Root ignores file permissions, so chmod can't make anything read-only.
    skip(process.getuid?.() === 0);
    fs.writeFileSync(
      path.join(configPath, ".env"),
      `LOG_LEVEL=debug${legacyStartupBlock({ neptuneNotebook: "false", https: "true", graphExpHttps: "true" })}`,
    );
    fs.writeFileSync(configJsonPath, '{"NEPTUNE_NOTEBOOK": true}');
    fs.chmodSync(configPath, 0o555);
    const processEnv = { HOST: "my-host", LOG_STYLE: "default" };
    const folderBefore = fs.readFileSync(
      path.join(configPath, ".env"),
      "utf-8",
    );

    load(processEnv);

    expect(processEnv).toStrictEqual({ HOST: "my-host", LOG_STYLE: "default" });
    expect(fs.readdirSync(configPath)).toStrictEqual([".env"]);
    expect(fs.readFileSync(path.join(configPath, ".env"), "utf-8")).toBe(
      folderBefore,
    );
  });
});
