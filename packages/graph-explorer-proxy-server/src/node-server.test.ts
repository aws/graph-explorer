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
    fs.rmSync(configDir, { recursive: true, force: true });
  });

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
});
