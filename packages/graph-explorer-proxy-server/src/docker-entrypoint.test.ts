import fs from "fs";
import path from "path";

import {
  createEntrypointWorkDir,
  readServerEnvironment,
  runEntrypoint,
} from "./testing.ts";

function writeEnv(configDir: string, content: string) {
  fs.writeFileSync(path.join(configDir, ".env"), content);
}

describe("docker-entrypoint.sh", () => {
  let workDir: string;
  let configDir: string;
  let scriptPath: string;

  beforeEach(() => {
    ({ workDir, configDir, scriptPath } = createEntrypointWorkDir());
  });

  afterEach(() => {
    fs.rmSync(workDir, { recursive: true, force: true });
  });

  it("fails when .env file is missing", () => {
    // Don't write any .env file

    const { exitCode, stderr } = runEntrypoint(workDir, scriptPath);
    expect(exitCode).not.toBe(0);
    expect(stderr).toContain(".env");
  });

  it("set -e propagates process-environment.sh failure", () => {
    fs.writeFileSync(
      path.join(workDir, "process-environment.sh"),
      "#!/bin/sh\nexit 1\n",
      { mode: 0o755 },
    );

    const { exitCode } = runEntrypoint(workDir, scriptPath);
    expect(exitCode).not.toBe(0);
  });

  it("set -e propagates setup-ssl.sh failure", () => {
    writeEnv(configDir, "PROXY_SERVER_HTTPS_CONNECTION=true\n");
    fs.writeFileSync(
      path.join(workDir, "setup-ssl.sh"),
      "#!/bin/sh\nexit 1\n",
      { mode: 0o755 },
    );

    const { exitCode, stdout } = runEntrypoint(workDir, scriptPath);
    expect(exitCode).not.toBe(0);
    expect(stdout).not.toContain("Starting graph explorer");
  });

  it("calls setup-ssl.sh when HTTPS is true", () => {
    writeEnv(configDir, "PROXY_SERVER_HTTPS_CONNECTION=true\n");

    const { exitCode } = runEntrypoint(workDir, scriptPath, {
      HOST: "localhost",
    });

    expect(exitCode).toBe(0);
    expect(fs.existsSync(path.join(workDir, "ssl-called"))).toBe(true);
  });

  it("skips setup-ssl.sh when HTTPS is false", () => {
    writeEnv(configDir, "PROXY_SERVER_HTTPS_CONNECTION=false\n");

    const { exitCode, stdout } = runEntrypoint(workDir, scriptPath);

    expect(exitCode).toBe(0);
    expect(fs.existsSync(path.join(workDir, "ssl-called"))).toBe(false);
    expect(stdout).toContain("SSL disabled");
  });

  it("skips setup-ssl.sh when PROXY_SERVER_HTTPS_CONNECTION is absent", () => {
    writeEnv(configDir, "LOG_LEVEL=info\n");

    const { exitCode, stdout } = runEntrypoint(workDir, scriptPath);

    expect(exitCode).toBe(0);
    expect(fs.existsSync(path.join(workDir, "ssl-called"))).toBe(false);
    expect(stdout).toContain("SSL disabled");
  });

  // process-environment.sh appends on every start, so a restarted container's
  // .env repeats each key. dotenv reads the last value, and NEPTUNE_NOTEBOOK
  // does too. PROXY_SERVER_HTTPS_CONNECTION deliberately doesn't: reading its
  // first match means a restart's repeated "true" fails the exact-match check
  // below and setup-ssl.sh is skipped, so the container reuses the
  // certificate from its first start instead of regenerating one.
  describe("with keys repeated by a restart", () => {
    it("does not call setup-ssl.sh when PROXY_SERVER_HTTPS_CONNECTION is repeated", () => {
      writeEnv(
        configDir,
        "PROXY_SERVER_HTTPS_CONNECTION=true\nPROXY_SERVER_HTTPS_CONNECTION=true\n",
      );

      const { exitCode } = runEntrypoint(workDir, scriptPath, {
        HOST: "localhost",
      });

      expect(exitCode).toBe(0);
      expect(fs.existsSync(path.join(workDir, "ssl-called"))).toBe(false);
    });

    it("reads the last NEPTUNE_NOTEBOOK and passes it to the server", () => {
      writeEnv(
        configDir,
        [
          "NEPTUNE_NOTEBOOK=false",
          "PROXY_SERVER_HTTPS_CONNECTION=true",
          "NEPTUNE_NOTEBOOK=true",
          "PROXY_SERVER_HTTPS_CONNECTION=true",
          "",
        ].join("\n"),
      );

      const { exitCode, stdout } = runEntrypoint(workDir, scriptPath);

      expect(exitCode).toBe(0);
      expect(stdout).toContain("Neptune Notebook preset enabled");
      expect(readServerEnvironment(workDir).NEPTUNE_NOTEBOOK).toBe("true");
    });
  });

  describe("under the notebook preset", () => {
    // The preset serves HTTP only, so certificates would never be used. With
    // no HOST, setup-ssl.sh would also exit before the server could name the
    // real NEPTUNE_NOTEBOOK/HTTPS conflict.
    it("skips setup-ssl.sh even when HTTPS is requested", () => {
      writeEnv(
        configDir,
        "NEPTUNE_NOTEBOOK=true\nPROXY_SERVER_HTTPS_CONNECTION=true\n",
      );

      const { exitCode, stdout } = runEntrypoint(workDir, scriptPath, {
        HOST: "localhost",
      });

      expect(exitCode).toBe(0);
      expect(fs.existsSync(path.join(workDir, "ssl-called"))).toBe(false);
      expect(stdout).toContain(
        "Neptune Notebook preset enabled. Skipping self-signed certificate generation.",
      );
      expect(stdout).toContain("SERVER_STARTED");
    });

    it("starts the server when HOST is unset", () => {
      writeEnv(
        configDir,
        "NEPTUNE_NOTEBOOK=true\nPROXY_SERVER_HTTPS_CONNECTION=true\n",
      );

      const { exitCode, stdout } = runEntrypoint(workDir, scriptPath);

      expect(exitCode).toBe(0);
      expect(fs.existsSync(path.join(workDir, "ssl-called"))).toBe(false);
      expect(stdout).toContain("SERVER_STARTED");
    });

    it.each(["TRUE", "True", "1", "yes", "false", ""])(
      "still calls setup-ssl.sh when NEPTUNE_NOTEBOOK is %j",
      value => {
        writeEnv(
          configDir,
          `NEPTUNE_NOTEBOOK=${value}\nPROXY_SERVER_HTTPS_CONNECTION=true\n`,
        );

        const { exitCode } = runEntrypoint(workDir, scriptPath, {
          HOST: "localhost",
        });

        expect(exitCode).toBe(0);
        expect(fs.existsSync(path.join(workDir, "ssl-called"))).toBe(true);
      },
    );

    it("grep ignores similarly-named variables", () => {
      writeEnv(
        configDir,
        "GRAPH_EXP_NEPTUNE_NOTEBOOK=true\nPROXY_SERVER_HTTPS_CONNECTION=true\n",
      );

      runEntrypoint(workDir, scriptPath, { HOST: "localhost" });

      expect(fs.existsSync(path.join(workDir, "ssl-called"))).toBe(true);
    });
  });

  it("grep ignores commented-out lines", () => {
    writeEnv(configDir, "# PROXY_SERVER_HTTPS_CONNECTION=true\n");

    const { exitCode } = runEntrypoint(workDir, scriptPath);

    expect(exitCode).toBe(0);
    expect(fs.existsSync(path.join(workDir, "ssl-called"))).toBe(false);
  });

  it("grep ignores similarly-named variables", () => {
    writeEnv(configDir, "GRAPH_EXP_PROXY_SERVER_HTTPS_CONNECTION=true\n");

    const { exitCode } = runEntrypoint(workDir, scriptPath);

    expect(exitCode).toBe(0);
    expect(fs.existsSync(path.join(workDir, "ssl-called"))).toBe(false);
  });

  it("passes HOST to setup-ssl.sh", () => {
    writeEnv(configDir, "PROXY_SERVER_HTTPS_CONNECTION=true\n");

    runEntrypoint(workDir, scriptPath, { HOST: "my-test-host" });

    const hostValue = fs
      .readFileSync(path.join(workDir, "host-value"), "utf-8")
      .trim();
    expect(hostValue).toBe("my-test-host");
  });

  it("uses custom CONFIGURATION_FOLDER_PATH", () => {
    const customDir = path.join(workDir, "custom-config");
    fs.mkdirSync(customDir, { recursive: true });
    fs.writeFileSync(
      path.join(customDir, ".env"),
      "PROXY_SERVER_HTTPS_CONNECTION=false\n",
    );

    const { exitCode, stdout } = runEntrypoint(workDir, scriptPath, {
      CONFIGURATION_FOLDER_PATH: customDir,
    });

    expect(exitCode).toBe(0);
    expect(stdout).toContain("SSL disabled");
  });
});
