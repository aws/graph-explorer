import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";

import { parseConfigJson } from "./config-json.ts";
import { conflictMessage } from "./deployment-scenarios.ts";
import {
  appendedSettingsBlock,
  loadStartup,
  resolveStartupConfig,
  StartupError,
  type TextFile,
} from "./startup-config.ts";
import { legacyStartupBlock } from "./testing.ts";

type Inputs = {
  processEnv?: Record<string, string | undefined>;
  dotEnv?: string;
  dotEnvLocal?: string;
  configJson?: Record<string, unknown>;
  image?: boolean;
  startedBefore?: boolean;
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
  startedBefore = false,
}: Inputs = {}) {
  return resolveStartupConfig({
    processEnv,
    dotEnv: textFile(".env", dotEnv),
    dotEnvLocal: textFile(".env.local", dotEnvLocal),
    configJson:
      configJson && parseConfigJson(JSON.stringify(configJson), "config.json"),
    image,
    startedBefore,
  });
}

const db = "https://db:8182";

describe("appendedSettingsBlock", () => {
  it("writes the HTTPS defaults without the notebook preset", () => {
    expect(appendedSettingsBlock({}, {})).toBe(
      "\nNEPTUNE_NOTEBOOK=false\n\nPROXY_SERVER_HTTPS_CONNECTION=true\n\nGRAPH_EXP_HTTPS_CONNECTION=true\n",
    );
  });

  it("writes the settings' values", () => {
    expect(
      appendedSettingsBlock(
        {
          NEPTUNE_NOTEBOOK: "TRUE",
          PROXY_SERVER_HTTPS_CONNECTION: "false",
          GRAPH_EXP_HTTPS_CONNECTION: "false",
        },
        {},
      ),
    ).toBe(
      "\nNEPTUNE_NOTEBOOK=TRUE\n\nPROXY_SERVER_HTTPS_CONNECTION=false\n\nGRAPH_EXP_HTTPS_CONNECTION=false\n",
    );
  });

  it("writes the preset's port, log style, and HTTPS off", () => {
    expect(appendedSettingsBlock({ NEPTUNE_NOTEBOOK: "true" }, {})).toBe(
      "\nNEPTUNE_NOTEBOOK=true\n\nPROXY_SERVER_PORT=9250\n\nLOG_STYLE=cloudwatch\n\nPROXY_SERVER_HTTPS_CONNECTION=false\n\nGRAPH_EXP_HTTPS_CONNECTION=false\n",
    );
  });

  it.for(["PROXY_SERVER_PORT", "PROXY_SERVER_HTTP_PORT"])(
    "leaves the preset's port out when the environment sets %s",
    key => {
      expect(
        appendedSettingsBlock({ NEPTUNE_NOTEBOOK: "true" }, { [key]: "8080" }),
      ).not.toContain("PROXY_SERVER_PORT=9250");
    },
  );

  it("writes the preset's port when the environment's port is empty", () => {
    expect(
      appendedSettingsBlock(
        { NEPTUNE_NOTEBOOK: "true" },
        { PROXY_SERVER_PORT: "" },
      ),
    ).toContain("\nPROXY_SERVER_PORT=9250\n");
  });

  it("leaves the preset's log style out when the environment sets LOG_STYLE", () => {
    expect(
      appendedSettingsBlock(
        { NEPTUNE_NOTEBOOK: "true" },
        { LOG_STYLE: "default" },
      ),
    ).not.toContain("LOG_STYLE");
  });

  it.for([
    ["true", "true"],
    ["TRUE", "TRUE"],
    ["yes", "false"],
    ["null", "false"],
    ["0", "false"],
  ])("under the preset, writes an HTTPS of %s as %s", ([value, written]) => {
    expect(
      appendedSettingsBlock(
        { NEPTUNE_NOTEBOOK: "true", PROXY_SERVER_HTTPS_CONNECTION: value },
        {},
      ),
    ).toContain(`\nPROXY_SERVER_HTTPS_CONNECTION=${written}\n`);
  });

  it("under the preset, writes GRAPH_EXP_HTTPS_CONNECTION=false over a true", () => {
    expect(
      appendedSettingsBlock(
        { NEPTUNE_NOTEBOOK: "true", GRAPH_EXP_HTTPS_CONNECTION: "true" },
        {},
      ),
    ).toContain("\nGRAPH_EXP_HTTPS_CONNECTION=false\n");
  });
});

describe("resolveStartupConfig in the image", () => {
  it("defaults PROXY_SERVER_HTTPS_CONNECTION to true and sets up the certificate", () => {
    const startup = resolve({ processEnv: { HOST: "localhost" } });

    expect(startup.serverEnv.PROXY_SERVER_HTTPS_CONNECTION).toBe("true");
    expect(startup.setUpCertificates).toBe(true);
    expect(startup.certificateHost).toBe("localhost");
  });

  it("serves the environment's connection settings without a config.json", () => {
    expect(
      resolve({ processEnv: { GRAPH_CONNECTION_URL: db, IAM: "true" } })
        .defaultConnectionJson,
    ).toContain('"GRAPH_EXP_IAM":true,');
  });

  it("lets config.json replace every key it can hold, even one it leaves out", () => {
    const startup = resolve({
      processEnv: {
        GRAPH_CONNECTION_URL: db,
        NEPTUNE_NOTEBOOK: "true",
        PROXY_SERVER_HTTPS_CONNECTION: "false",
      },
      configJson: { GRAPH_TYPE: "gremlin" },
    });

    expect(startup.defaultConnectionJson).toBeUndefined();
    expect(startup.serverEnv.NEPTUNE_NOTEBOOK).toBe("false");
    expect(startup.setUpCertificates).toBe(true);
  });

  it("passes the environment to the server over config.json", () => {
    expect(
      resolve({
        processEnv: { PROXY_SERVER_HTTPS_CONNECTION: "false" },
        configJson: { PROXY_SERVER_HTTPS_CONNECTION: true },
      }).serverEnv.PROXY_SERVER_HTTPS_CONNECTION,
    ).toBe("false");
  });

  it("collects the config.json parser's warnings", () => {
    expect(resolve({ configJson: { IAM: { nested: true } } }).warnings).toEqual(
      ['config.json: IAM can\'t be {"nested":true}, so it is ignored.'],
    );
  });

  it("gives the server NEPTUNE_NOTEBOOK from the block, over a line in .env", () => {
    expect(
      resolve({ dotEnv: "NEPTUNE_NOTEBOOK=true\n" }).serverEnv.NEPTUNE_NOTEBOOK,
    ).toBe("false");
  });

  it("applies the preset's port and log style from the block over .env, and yields to .env.local", () => {
    const { serverEnv } = resolve({
      processEnv: { NEPTUNE_NOTEBOOK: "true" },
      dotEnv: "PROXY_SERVER_PORT=8081\nLOG_STYLE=default\n",
      dotEnvLocal: "LOG_STYLE=default\n",
    });

    expect(serverEnv).toMatchObject({
      NEPTUNE_NOTEBOOK: "true",
      PROXY_SERVER_PORT: "9250",
      LOG_STYLE: "default",
      PROXY_SERVER_HTTPS_CONNECTION: "false",
    });
  });

  describe("certificate setup", () => {
    it("happens for one exact true line", () => {
      expect(
        resolve({ processEnv: { PROXY_SERVER_HTTPS_CONNECTION: "true" } })
          .setUpCertificates,
      ).toBe(true);
    });

    it("doesn't happen for a value that only reads as true", () => {
      expect(
        resolve({ processEnv: { PROXY_SERVER_HTTPS_CONNECTION: "TRUE" } })
          .setUpCertificates,
      ).toBe(false);
    });

    it("doesn't happen when .env holds its own HTTPS line", () => {
      expect(
        resolve({ dotEnv: "PROXY_SERVER_HTTPS_CONNECTION=true\n" })
          .setUpCertificates,
      ).toBe(false);
    });

    it("doesn't happen when .env holds a block from an earlier start", () => {
      expect(
        resolve({
          dotEnv: legacyStartupBlock({
            neptuneNotebook: "false",
            https: "true",
            graphExpHttps: "true",
          }),
        }).setUpCertificates,
      ).toBe(false);
    });

    it("doesn't happen under the preset", () => {
      expect(
        resolve({
          processEnv: {
            NEPTUNE_NOTEBOOK: "true",
            PROXY_SERVER_HTTPS_CONNECTION: "true",
          },
        }).setUpCertificates,
      ).toBe(false);
    });

    it("doesn't happen after an earlier start of the same container", () => {
      expect(resolve({ startedBefore: true }).setUpCertificates).toBe(false);
    });

    it("comes from config.json's HTTPS setting, not the environment's", () => {
      expect(
        resolve({
          processEnv: { PROXY_SERVER_HTTPS_CONNECTION: "true" },
          configJson: { PROXY_SERVER_HTTPS_CONNECTION: false },
        }).setUpCertificates,
      ).toBe(false);
    });
  });

  describe("certificate host", () => {
    it("never comes from .env", () => {
      expect(
        resolve({ dotEnv: "HOST=from-file\n" }).certificateHost,
      ).toBeUndefined();
    });

    it("is unset when the environment's is empty", () => {
      expect(resolve({ processEnv: { HOST: "" } }).certificateHost).toBe(
        undefined,
      );
    });
  });
});

describe("resolveStartupConfig from source", () => {
  it("reads the environment, then .env.local, then .env", () => {
    const { serverEnv, envFileValues } = resolve({
      image: false,
      processEnv: { LOG_LEVEL: "debug" },
      dotEnv: "LOG_LEVEL=info\nLOG_STYLE=cloudwatch\nPROXY_SERVER_PORT=8081\n",
      dotEnvLocal: "LOG_STYLE=default\nLOG_LEVEL=warn\n",
    });

    expect(serverEnv).toStrictEqual({
      LOG_LEVEL: "debug",
      LOG_STYLE: "default",
      PROXY_SERVER_PORT: "8081",
    });
    expect(envFileValues).toStrictEqual({
      LOG_LEVEL: "warn",
      LOG_STYLE: "default",
      PROXY_SERVER_PORT: "8081",
    });
  });

  it("serves no Default Connection, sets up no certificate, and appends nothing", () => {
    expect(
      resolve({
        image: false,
        processEnv: { GRAPH_CONNECTION_URL: db, HOST: "localhost" },
      }),
    ).toStrictEqual({
      serverEnv: { GRAPH_CONNECTION_URL: db, HOST: "localhost" },
      envFileValues: {},
      defaultConnectionJson: undefined,
      setUpCertificates: false,
      certificateHost: undefined,
      warnings: [],
    });
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

  function load(
    processEnv: Record<string, string | undefined> = {},
    image = true,
  ) {
    return loadStartup({
      processEnv,
      configPath,
      configJsonPath,
      image,
      startedBefore: false,
    });
  }

  it("reads .env from a custom configuration folder", () => {
    fs.writeFileSync(path.join(configPath, ".env"), "LOG_LEVEL=debug\n");

    expect(load({ CONFIGURATION_FOLDER_PATH: configPath }).env.LOG_LEVEL).toBe(
      "debug",
    );
  });

  it("starts without a .env", () => {
    expect(load().env.PROXY_SERVER_HTTPS_CONNECTION).toBe(true);
  });

  it("reads config.json in the image", () => {
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
    expect(startup.defaultConnectionJson).toContain(db);
  });

  it("never reads config.json from source", () => {
    fs.writeFileSync(configJsonPath, '{"NEPTUNE_NOTEBOOK": true');

    const { env, startup } = load({}, false);

    expect(env.NEPTUNE_NOTEBOOK).toBe(false);
    expect(startup.defaultConnectionJson).toBeUndefined();
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

  it("stops startup when the configuration folder doesn't exist", () => {
    const missing = path.join(workDir, "missing");

    expect(() =>
      loadStartup({
        processEnv: { CONFIGURATION_FOLDER_PATH: missing },
        configPath: missing,
        configJsonPath,
        image: true,
        startedBefore: false,
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
        startedBefore: false,
      }),
    ).toThrow(
      `Configuration folder does not exist: default config path "${missing}"`,
    );
  });

  it("stops startup with the environment parse failure", () => {
    expect(() =>
      load({ NEPTUNE_NOTEBOOK: "true", PROXY_SERVER_HTTPS_CONNECTION: "true" }),
    ).toThrow(conflictMessage);
    expect(() => load({ PROXY_SERVER_HTTPS_CONNECTION: "" })).toThrow(
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
