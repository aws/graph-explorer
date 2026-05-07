import { execFileSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

const scriptPath = path.resolve(
  import.meta.dirname,
  "../../../process-environment.sh",
);

/** Runs process-environment.sh in a temp directory with the given env vars. */
function runScript(workDir: string, env: Record<string, string> = {}) {
  // Ensure the configuration folder exists
  const configFolder =
    env.CONFIGURATION_FOLDER_PATH ?? "./packages/graph-explorer/";
  const resolvedConfigFolder = path.resolve(workDir, configFolder);
  fs.mkdirSync(resolvedConfigFolder, { recursive: true });

  execFileSync("sh", [scriptPath], {
    cwd: workDir,
    env: { ...env, PATH: process.env.PATH },
  });

  return {
    envFile: safeRead(path.join(resolvedConfigFolder, ".env")),
    defaultConnection: safeReadJson(
      path.join(resolvedConfigFolder, "defaultConnection.json"),
    ),
  };
}

function safeRead(filePath: string): string {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
}

function safeReadJson(filePath: string): Record<string, unknown> | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}

describe("process-environment.sh", () => {
  let workDir: string;

  beforeEach(() => {
    workDir = fs.mkdtempSync(path.join(os.tmpdir(), "ge-shell-test-"));
  });

  afterEach(() => {
    fs.rmSync(workDir, { recursive: true, force: true });
  });

  describe("SSL defaults", () => {
    it("defaults PROXY_SERVER_HTTPS_CONNECTION to true", () => {
      const { envFile } = runScript(workDir);
      expect(envFile).toContain("PROXY_SERVER_HTTPS_CONNECTION=true");
    });

    it("defaults GRAPH_EXP_HTTPS_CONNECTION to true", () => {
      const { envFile } = runScript(workDir);
      expect(envFile).toContain("GRAPH_EXP_HTTPS_CONNECTION=true");
    });
  });

  describe("explicit SSL disable", () => {
    it("respects PROXY_SERVER_HTTPS_CONNECTION=false", () => {
      const { envFile } = runScript(workDir, {
        PROXY_SERVER_HTTPS_CONNECTION: "false",
      });
      expect(envFile).toContain("PROXY_SERVER_HTTPS_CONNECTION=false");
    });

    it("respects GRAPH_EXP_HTTPS_CONNECTION=false", () => {
      const { envFile } = runScript(workDir, {
        GRAPH_EXP_HTTPS_CONNECTION: "false",
      });
      expect(envFile).toContain("GRAPH_EXP_HTTPS_CONNECTION=false");
    });
  });

  describe("NEPTUNE_NOTEBOOK=true forces SSL off", () => {
    it("overrides both HTTPS vars to false", () => {
      const { envFile } = runScript(workDir, {
        NEPTUNE_NOTEBOOK: "true",
      });
      expect(envFile).toContain("PROXY_SERVER_HTTPS_CONNECTION=false");
      expect(envFile).toContain("GRAPH_EXP_HTTPS_CONNECTION=false");
    });

    it("writes NEPTUNE_NOTEBOOK=true to .env", () => {
      const { envFile } = runScript(workDir, {
        NEPTUNE_NOTEBOOK: "true",
      });
      expect(envFile).toContain("NEPTUNE_NOTEBOOK=true");
    });
  });

  describe("NEPTUNE_NOTEBOOK=false does not force SSL off", () => {
    it("does not override HTTPS vars when NEPTUNE_NOTEBOOK is false", () => {
      const { envFile } = runScript(workDir, {
        NEPTUNE_NOTEBOOK: "false",
      });
      expect(envFile).toContain("NEPTUNE_NOTEBOOK=false");
      expect(envFile).toContain("PROXY_SERVER_HTTPS_CONNECTION=true");
      expect(envFile).toContain("GRAPH_EXP_HTTPS_CONNECTION=true");
    });
  });

  describe("NEPTUNE_NOTEBOOK unset", () => {
    it("defaults NEPTUNE_NOTEBOOK to false in .env", () => {
      const { envFile } = runScript(workDir);
      expect(envFile).toContain("NEPTUNE_NOTEBOOK=false");
    });
  });

  describe("config.json takes priority over env vars", () => {
    it("reads values from config.json", () => {
      fs.writeFileSync(
        path.join(workDir, "config.json"),
        JSON.stringify({
          PUBLIC_OR_PROXY_ENDPOINT: "https://my-endpoint:8182",
          GRAPH_TYPE: "sparql",
          USING_PROXY_SERVER: true,
          IAM: true,
          GRAPH_CONNECTION_URL: "https://my-db:8182",
          AWS_REGION: "us-west-2",
          PROXY_SERVER_HTTPS_CONNECTION: false,
          GRAPH_EXP_HTTPS_CONNECTION: false,
        }),
      );

      const { envFile, defaultConnection } = runScript(workDir);

      expect(envFile).toContain("PROXY_SERVER_HTTPS_CONNECTION=false");
      expect(envFile).toContain("GRAPH_EXP_HTTPS_CONNECTION=false");
      expect(defaultConnection).toMatchObject({
        GRAPH_EXP_PUBLIC_OR_PROXY_ENDPOINT: "https://my-endpoint:8182",
        GRAPH_EXP_GRAPH_TYPE: "sparql",
        GRAPH_EXP_USING_PROXY_SERVER: true,
        GRAPH_EXP_IAM: true,
        GRAPH_EXP_CONNECTION_URL: "https://my-db:8182",
        GRAPH_EXP_AWS_REGION: "us-west-2",
      });
    });

    it("config.json overrides conflicting env vars", () => {
      fs.writeFileSync(
        path.join(workDir, "config.json"),
        JSON.stringify({
          PUBLIC_OR_PROXY_ENDPOINT: "https://from-config:8182",
          GRAPH_TYPE: "sparql",
        }),
      );

      const { defaultConnection } = runScript(workDir, {
        PUBLIC_OR_PROXY_ENDPOINT: "https://from-env:8182",
        GRAPH_TYPE: "gremlin",
      });

      expect(defaultConnection).toHaveProperty(
        "GRAPH_EXP_PUBLIC_OR_PROXY_ENDPOINT",
        "https://from-config:8182",
      );
      expect(defaultConnection).toHaveProperty(
        "GRAPH_EXP_GRAPH_TYPE",
        "sparql",
      );
    });
  });

  describe("defaultConnection.json generation", () => {
    it("creates defaultConnection.json with GRAPH_EXP_ prefixed fields", () => {
      const { defaultConnection } = runScript(workDir, {
        PUBLIC_OR_PROXY_ENDPOINT: "https://endpoint:8182",
        GRAPH_TYPE: "gremlin",
        USING_PROXY_SERVER: "true",
        IAM: "false",
        GRAPH_CONNECTION_URL: "https://db:8182",
        AWS_REGION: "eu-west-1",
      });

      expect(defaultConnection).toMatchObject({
        GRAPH_EXP_PUBLIC_OR_PROXY_ENDPOINT: "https://endpoint:8182",
        GRAPH_EXP_GRAPH_TYPE: "gremlin",
        GRAPH_EXP_USING_PROXY_SERVER: true,
        GRAPH_EXP_IAM: false,
        GRAPH_EXP_CONNECTION_URL: "https://db:8182",
        GRAPH_EXP_AWS_REGION: "eu-west-1",
      });
    });

    it("does not create defaultConnection.json without PUBLIC_OR_PROXY_ENDPOINT", () => {
      const { defaultConnection } = runScript(workDir, {
        GRAPH_TYPE: "gremlin",
      });
      expect(defaultConnection).toBeNull();
    });

    it("defaults SERVICE_TYPE to neptune-db", () => {
      const { defaultConnection } = runScript(workDir, {
        PUBLIC_OR_PROXY_ENDPOINT: "https://endpoint:8182",
      });
      expect(defaultConnection).toHaveProperty(
        "GRAPH_EXP_SERVICE_TYPE",
        "neptune-db",
      );
    });

    it("defaults USING_PROXY_SERVER to false", () => {
      const { defaultConnection } = runScript(workDir, {
        PUBLIC_OR_PROXY_ENDPOINT: "https://endpoint:8182",
      });
      expect(defaultConnection).toHaveProperty(
        "GRAPH_EXP_USING_PROXY_SERVER",
        false,
      );
    });

    it("defaults IAM to false", () => {
      const { defaultConnection } = runScript(workDir, {
        PUBLIC_OR_PROXY_ENDPOINT: "https://endpoint:8182",
      });
      expect(defaultConnection).toHaveProperty("GRAPH_EXP_IAM", false);
    });
  });

  describe("SERVICE_TYPE=neptune-graph auto-sets openCypher", () => {
    it("sets GRAPH_TYPE to openCypher when SERVICE_TYPE is neptune-graph", () => {
      const { defaultConnection } = runScript(workDir, {
        PUBLIC_OR_PROXY_ENDPOINT: "https://endpoint:8182",
        SERVICE_TYPE: "neptune-graph",
      });
      expect(defaultConnection).toHaveProperty(
        "GRAPH_EXP_GRAPH_TYPE",
        "openCypher",
      );
    });

    it("does not set GRAPH_TYPE when SERVICE_TYPE is neptune-db and no GRAPH_TYPE given", () => {
      const { defaultConnection } = runScript(workDir, {
        PUBLIC_OR_PROXY_ENDPOINT: "https://endpoint:8182",
        SERVICE_TYPE: "neptune-db",
      });
      expect(defaultConnection).not.toHaveProperty("GRAPH_EXP_GRAPH_TYPE");
    });

    it("explicit GRAPH_TYPE takes priority over neptune-graph auto-detection", () => {
      const { defaultConnection } = runScript(workDir, {
        PUBLIC_OR_PROXY_ENDPOINT: "https://endpoint:8182",
        SERVICE_TYPE: "neptune-graph",
        GRAPH_TYPE: "sparql",
      });
      expect(defaultConnection).toHaveProperty(
        "GRAPH_EXP_GRAPH_TYPE",
        "sparql",
      );
    });
  });

  describe("custom CONFIGURATION_FOLDER_PATH", () => {
    it("writes .env and defaultConnection.json to the custom path", () => {
      const customFolder = path.join(workDir, "custom-config");

      runScript(workDir, {
        CONFIGURATION_FOLDER_PATH: customFolder,
        PUBLIC_OR_PROXY_ENDPOINT: "https://endpoint:8182",
      });

      // Files exist at the custom path
      expect(fs.existsSync(path.join(customFolder, ".env"))).toBe(true);
      expect(
        fs.existsSync(path.join(customFolder, "defaultConnection.json")),
      ).toBe(true);

      // Files do not exist at the default path
      const defaultFolder = path.join(workDir, "packages", "graph-explorer");
      expect(fs.existsSync(path.join(defaultFolder, ".env"))).toBe(false);
      expect(
        fs.existsSync(path.join(defaultFolder, "defaultConnection.json")),
      ).toBe(false);
    });
  });

  describe("default values for optional fields", () => {
    it("defaults GRAPH_CONNECTION_URL to empty string", () => {
      const { defaultConnection } = runScript(workDir, {
        PUBLIC_OR_PROXY_ENDPOINT: "https://endpoint:8182",
      });
      expect(defaultConnection).toHaveProperty("GRAPH_EXP_CONNECTION_URL", "");
    });

    it("preserves path in GRAPH_CONNECTION_URL", () => {
      const { defaultConnection } = runScript(workDir, {
        PUBLIC_OR_PROXY_ENDPOINT: "http://localhost:8080",
        GRAPH_CONNECTION_URL: "http://blazegraph:9999/blazegraph/namespace/kb",
      });
      expect(defaultConnection).toHaveProperty(
        "GRAPH_EXP_CONNECTION_URL",
        "http://blazegraph:9999/blazegraph/namespace/kb",
      );
    });

    it("preserves trailing slash in GRAPH_CONNECTION_URL", () => {
      const { defaultConnection } = runScript(workDir, {
        PUBLIC_OR_PROXY_ENDPOINT: "http://localhost:8080",
        GRAPH_CONNECTION_URL: "http://blazegraph:9999/blazegraph/namespace/kb/",
      });
      expect(defaultConnection).toHaveProperty(
        "GRAPH_EXP_CONNECTION_URL",
        "http://blazegraph:9999/blazegraph/namespace/kb/",
      );
    });

    it("defaults AWS_REGION to empty string", () => {
      const { defaultConnection } = runScript(workDir, {
        PUBLIC_OR_PROXY_ENDPOINT: "https://endpoint:8182",
      });
      expect(defaultConnection).toHaveProperty("GRAPH_EXP_AWS_REGION", "");
    });

    it("passes through custom SERVICE_TYPE value", () => {
      const { defaultConnection } = runScript(workDir, {
        PUBLIC_OR_PROXY_ENDPOINT: "https://endpoint:8182",
        SERVICE_TYPE: "neptune-graph",
      });
      expect(defaultConnection).toHaveProperty(
        "GRAPH_EXP_SERVICE_TYPE",
        "neptune-graph",
      );
    });
  });

  describe("file behavior", () => {
    it("appends to existing .env file", () => {
      const configFolder = path.resolve(workDir, "packages/graph-explorer");
      fs.mkdirSync(configFolder, { recursive: true });
      fs.writeFileSync(path.join(configFolder, ".env"), "EXISTING_VAR=keep\n");

      const { envFile } = runScript(workDir);

      expect(envFile).toContain("EXISTING_VAR=keep");
      expect(envFile).toContain("PROXY_SERVER_HTTPS_CONNECTION=true");
    });

    it("overwrites existing defaultConnection.json", () => {
      const configFolder = path.resolve(workDir, "packages/graph-explorer");
      fs.mkdirSync(configFolder, { recursive: true });
      fs.writeFileSync(
        path.join(configFolder, "defaultConnection.json"),
        JSON.stringify({ OLD_KEY: "old-value" }),
      );

      const { defaultConnection } = runScript(workDir, {
        PUBLIC_OR_PROXY_ENDPOINT: "https://endpoint:8182",
      });

      expect(defaultConnection).not.toHaveProperty("OLD_KEY");
      expect(defaultConnection).toHaveProperty(
        "GRAPH_EXP_PUBLIC_OR_PROXY_ENDPOINT",
        "https://endpoint:8182",
      );
    });
  });

  describe("defaultConnection.json has all expected keys", () => {
    it("contains exactly the expected keys when all values provided", () => {
      const { defaultConnection } = runScript(workDir, {
        PUBLIC_OR_PROXY_ENDPOINT: "https://endpoint:8182",
        SERVICE_TYPE: "neptune-db",
        GRAPH_TYPE: "gremlin",
        USING_PROXY_SERVER: "true",
        IAM: "true",
        GRAPH_CONNECTION_URL: "https://db:8182",
        AWS_REGION: "us-east-1",
      });

      expect(Object.keys(defaultConnection!).sort()).toEqual([
        "GRAPH_EXP_AWS_REGION",
        "GRAPH_EXP_CONNECTION_URL",
        "GRAPH_EXP_GRAPH_TYPE",
        "GRAPH_EXP_IAM",
        "GRAPH_EXP_PUBLIC_OR_PROXY_ENDPOINT",
        "GRAPH_EXP_SERVICE_TYPE",
        "GRAPH_EXP_USING_PROXY_SERVER",
      ]);
    });

    it("omits GRAPH_EXP_GRAPH_TYPE when neither GRAPH_TYPE nor neptune-graph", () => {
      const { defaultConnection } = runScript(workDir, {
        PUBLIC_OR_PROXY_ENDPOINT: "https://endpoint:8182",
      });

      expect(Object.keys(defaultConnection!).sort()).toEqual([
        "GRAPH_EXP_AWS_REGION",
        "GRAPH_EXP_CONNECTION_URL",
        "GRAPH_EXP_IAM",
        "GRAPH_EXP_PUBLIC_OR_PROXY_ENDPOINT",
        "GRAPH_EXP_SERVICE_TYPE",
        "GRAPH_EXP_USING_PROXY_SERVER",
      ]);
    });
  });

  describe("grep-safe .env output", () => {
    it("PROXY_SERVER_HTTPS_CONNECTION is on its own line", () => {
      const { envFile } = runScript(workDir);
      expect(envFile).toMatch(/^PROXY_SERVER_HTTPS_CONNECTION=true$/m);
    });

    it("does not produce commented-out PROXY_SERVER_HTTPS_CONNECTION", () => {
      const { envFile } = runScript(workDir);
      expect(envFile).not.toContain("# PROXY_SERVER_HTTPS_CONNECTION");
    });

    it("value has no trailing whitespace", () => {
      const { envFile } = runScript(workDir, {
        PROXY_SERVER_HTTPS_CONNECTION: "false",
      });
      const line = envFile
        .split("\n")
        .find(l => l.startsWith("PROXY_SERVER_HTTPS_CONNECTION"));
      expect(line).toBe("PROXY_SERVER_HTTPS_CONNECTION=false");
    });
  });
});
