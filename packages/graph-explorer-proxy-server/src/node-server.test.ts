import { spawn } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";

const serverPath = path.resolve(import.meta.dirname, "node-server.ts");

function waitForOutput(
  child: ReturnType<typeof spawn>,
  pattern: RegExp,
  timeoutMs: number,
) {
  return new Promise<string>((resolve, reject) => {
    let output = "";
    const timer = setTimeout(
      () => reject(new Error(`No output matched ${pattern}:\n${output}`)),
      timeoutMs,
    );
    function onData(chunk: Buffer) {
      output += chunk.toString();
      if (pattern.test(output)) {
        clearTimeout(timer);
        resolve(output);
      }
    }
    child.stdout?.on("data", onData);
    child.stderr?.on("data", onData);
    child.once("exit", code => {
      clearTimeout(timer);
      reject(new Error(`Server exited with code ${code}:\n${output}`));
    });
  });
}

describe("node-server.ts", () => {
  let configDir: string;

  beforeEach(() => {
    configDir = fs.mkdtempSync(path.join(os.tmpdir(), "ge-node-server-test-"));
  });

  afterEach(() => {
    fs.chmodSync(configDir, 0o755);
    fs.rmSync(configDir, { recursive: true, force: true });
  });

  it("starts with a read-only configuration folder that holds a .env", async ({
    skip,
  }) => {
    // Root ignores file permissions, so chmod can't make anything read-only.
    skip(process.getuid?.() === 0);
    fs.writeFileSync(path.join(configDir, ".env"), "LOG_STYLE=cloudwatch\n");
    fs.chmodSync(configDir, 0o555);

    const child = spawn(process.execPath, [serverPath], {
      cwd: path.dirname(serverPath),
      env: {
        PATH: process.env.PATH,
        CONFIGURATION_FOLDER_PATH: configDir,
        PROXY_SERVER_HTTP_PORT: "0",
        PROXY_SERVER_HTTPS_CONNECTION: "false",
      },
    });
    try {
      const output = await waitForOutput(
        child,
        /Proxy server listening on 127\.0\.0\.1:\d+/,
        15_000,
      );

      expect(output).toMatch(/Proxy server listening on 127\.0\.0\.1:\d+/);
    } finally {
      child.kill();
    }
  }, 20_000);

  it("listens on 127.0.0.1 when PROXY_SERVER_LISTEN_ADDRESS is unset", async () => {
    // The child gets only these variables, so the listen address is unset and
    // port 0 lets the OS pick a free port that the log line reports.
    // PROXY_SERVER_PORT rejects 0, so this uses the deprecated variable.
    const child = spawn(process.execPath, [serverPath], {
      cwd: path.dirname(serverPath),
      env: {
        PATH: process.env.PATH,
        CONFIGURATION_FOLDER_PATH: configDir,
        PROXY_SERVER_HTTP_PORT: "0",
        PROXY_SERVER_HTTPS_CONNECTION: "false",
        LOG_STYLE: "cloudwatch",
      },
    });
    try {
      const output = await waitForOutput(
        child,
        /Proxy server listening on 127\.0\.0\.1:\d+[\s\S]*Only this machine can connect/,
        15_000,
      );

      expect(output).toMatch(/Proxy server listening on 127\.0\.0\.1:\d+/);
    } finally {
      child.kill();
    }
  }, 20_000);

  /**
   * BACKWARD COMPATIBILITY: .env VALUES REACH process.env
   *
   * A `.env` in the configuration folder has always set `process.env` for the
   * whole server, so settings that only libraries read, such as AWS_PROFILE for
   * the AWS SDK, work from it. A value in the real environment
   * still wins over `.env`.
   *
   * Do not delete without confirming that no deployment keeps library
   * settings in a mounted `.env`.
   */
  describe("backward compatibility: .env values reach process.env", () => {
    it("sets values from .env that the environment doesn't, and keeps the environment's", async () => {
      fs.writeFileSync(
        path.join(configDir, ".env"),
        [
          "AWS_PROFILE=from-dotenv",
          "GE_TEST_SENTINEL=from-dotenv",
          "GE_TEST_OVERRIDE=from-dotenv",
          "",
        ].join("\n"),
      );
      const dumpPath = path.join(configDir, "process-env.json");
      const preloadPath = path.join(configDir, "dump-env.mjs");
      // The dump goes out at exit, which the graceful shutdown on SIGTERM reaches.
      fs.writeFileSync(
        preloadPath,
        `import fs from "node:fs";
process.on("exit", () => {
  fs.writeFileSync(${JSON.stringify(dumpPath)}, JSON.stringify(process.env));
});
`,
      );

      const child = spawn(
        process.execPath,
        ["--import", preloadPath, serverPath],
        {
          cwd: path.dirname(serverPath),
          env: {
            PATH: process.env.PATH,
            CONFIGURATION_FOLDER_PATH: configDir,
            PROXY_SERVER_HTTP_PORT: "0",
            PROXY_SERVER_HTTPS_CONNECTION: "false",
            GE_TEST_OVERRIDE: "from-env",
          },
        },
      );
      try {
        await waitForOutput(
          child,
          /Proxy server listening on 127\.0\.0\.1:\d+/,
          15_000,
        );
      } finally {
        const exited = new Promise(resolve => child.once("exit", resolve));
        child.kill();
        await exited;
      }

      expect(JSON.parse(fs.readFileSync(dumpPath, "utf-8"))).toMatchObject({
        AWS_PROFILE: "from-dotenv",
        GE_TEST_SENTINEL: "from-dotenv",
        GE_TEST_OVERRIDE: "from-env",
      });
    }, 20_000);
  });
});
