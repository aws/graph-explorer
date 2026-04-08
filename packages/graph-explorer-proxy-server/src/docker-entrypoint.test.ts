import { execFileSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

const originalScriptPath = path.resolve(
  import.meta.dirname,
  "../../../docker-entrypoint.sh",
);

function setupWorkDir() {
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "ge-entrypoint-test-"));
  const configDir = path.join(workDir, "packages", "graph-explorer");
  fs.mkdirSync(configDir, { recursive: true });

  // Create modified entrypoint with stubbed last line
  const script = fs.readFileSync(originalScriptPath, "utf-8");
  const serverStartLine =
    "cd /graph-explorer/packages/graph-explorer-proxy-server && NODE_ENV=production node dist/node-server.js";
  if (!script.includes(serverStartLine)) {
    throw new Error(
      "docker-entrypoint.sh no longer contains the expected server start line. Update the test stub.",
    );
  }
  const modifiedScript = script.replace(
    serverStartLine,
    'echo "SERVER_STARTED"',
  );
  const scriptPath = path.join(workDir, "docker-entrypoint.sh");
  fs.writeFileSync(scriptPath, modifiedScript, { mode: 0o755 });

  // Default stubs
  fs.writeFileSync(
    path.join(workDir, "process-environment.sh"),
    "#!/bin/sh\nexit 0\n",
    { mode: 0o755 },
  );
  fs.writeFileSync(
    path.join(workDir, "setup-ssl.sh"),
    '#!/bin/sh\ntouch ./ssl-called\necho "$HOST" > ./host-value\n',
    { mode: 0o755 },
  );

  return { workDir, configDir, scriptPath };
}

function writeEnv(configDir: string, content: string) {
  fs.writeFileSync(path.join(configDir, ".env"), content);
}

function runScript(
  workDir: string,
  scriptPath: string,
  env: Record<string, string> = {},
): { exitCode: number; stdout: string; stderr: string } {
  try {
    const stdout = execFileSync("sh", [scriptPath], {
      cwd: workDir,
      env: { PATH: process.env.PATH, ...env },
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return { exitCode: 0, stdout, stderr: "" };
  } catch (error: unknown) {
    const e = error as { status: number; stdout: string; stderr: string };
    return {
      exitCode: e.status,
      stdout: e.stdout ?? "",
      stderr: e.stderr ?? "",
    };
  }
}

describe("docker-entrypoint.sh", () => {
  let workDir: string;
  let configDir: string;
  let scriptPath: string;

  beforeEach(() => {
    ({ workDir, configDir, scriptPath } = setupWorkDir());
  });

  afterEach(() => {
    fs.rmSync(workDir, { recursive: true, force: true });
  });

  it("fails when .env file is missing", () => {
    // Don't write any .env file

    const { exitCode, stderr } = runScript(workDir, scriptPath);
    expect(exitCode).not.toBe(0);
    expect(stderr).toContain(".env");
  });

  it("set -e propagates process-environment.sh failure", () => {
    fs.writeFileSync(
      path.join(workDir, "process-environment.sh"),
      "#!/bin/sh\nexit 1\n",
      { mode: 0o755 },
    );

    const { exitCode } = runScript(workDir, scriptPath);
    expect(exitCode).not.toBe(0);
  });

  it("set -e propagates setup-ssl.sh failure", () => {
    writeEnv(configDir, "PROXY_SERVER_HTTPS_CONNECTION=true\n");
    fs.writeFileSync(
      path.join(workDir, "setup-ssl.sh"),
      "#!/bin/sh\nexit 1\n",
      { mode: 0o755 },
    );

    const { exitCode, stdout } = runScript(workDir, scriptPath);
    expect(exitCode).not.toBe(0);
    expect(stdout).not.toContain("Starting graph explorer");
  });

  it("calls setup-ssl.sh when HTTPS is true", () => {
    writeEnv(configDir, "PROXY_SERVER_HTTPS_CONNECTION=true\n");

    const { exitCode } = runScript(workDir, scriptPath, {
      HOST: "localhost",
    });

    expect(exitCode).toBe(0);
    expect(fs.existsSync(path.join(workDir, "ssl-called"))).toBe(true);
  });

  it("skips setup-ssl.sh when HTTPS is false", () => {
    writeEnv(configDir, "PROXY_SERVER_HTTPS_CONNECTION=false\n");

    const { exitCode, stdout } = runScript(workDir, scriptPath);

    expect(exitCode).toBe(0);
    expect(fs.existsSync(path.join(workDir, "ssl-called"))).toBe(false);
    expect(stdout).toContain("SSL disabled");
  });

  it("skips setup-ssl.sh when PROXY_SERVER_HTTPS_CONNECTION is absent", () => {
    writeEnv(configDir, "LOG_LEVEL=info\n");

    const { exitCode, stdout } = runScript(workDir, scriptPath);

    expect(exitCode).toBe(0);
    expect(fs.existsSync(path.join(workDir, "ssl-called"))).toBe(false);
    expect(stdout).toContain("SSL disabled");
  });

  it("grep ignores commented-out lines", () => {
    writeEnv(configDir, "# PROXY_SERVER_HTTPS_CONNECTION=true\n");

    const { exitCode } = runScript(workDir, scriptPath);

    expect(exitCode).toBe(0);
    expect(fs.existsSync(path.join(workDir, "ssl-called"))).toBe(false);
  });

  it("grep ignores similarly-named variables", () => {
    writeEnv(configDir, "GRAPH_EXP_PROXY_SERVER_HTTPS_CONNECTION=true\n");

    const { exitCode } = runScript(workDir, scriptPath);

    expect(exitCode).toBe(0);
    expect(fs.existsSync(path.join(workDir, "ssl-called"))).toBe(false);
  });

  it("passes HOST to setup-ssl.sh", () => {
    writeEnv(configDir, "PROXY_SERVER_HTTPS_CONNECTION=true\n");

    runScript(workDir, scriptPath, { HOST: "my-test-host" });

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

    const { exitCode, stdout } = runScript(workDir, scriptPath, {
      CONFIGURATION_FOLDER_PATH: customDir,
    });

    expect(exitCode).toBe(0);
    expect(stdout).toContain("SSL disabled");
  });
});
