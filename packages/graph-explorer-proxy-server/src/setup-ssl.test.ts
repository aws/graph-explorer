import { execFileSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

const scriptPath = path.resolve(import.meta.dirname, "../../../setup-ssl.sh");
const certInfoDir = path.resolve(import.meta.dirname, "../cert-info");

/** Read the real config files so tests break if they change. */
const CERT_CONF_CONTENT = fs.readFileSync(
  path.join(certInfoDir, "cert.conf"),
  "utf-8",
);
const CSR_CONF_CONTENT = fs.readFileSync(
  path.join(certInfoDir, "csr.conf"),
  "utf-8",
);

function runScript(
  certDir: string,
  env: Record<string, string> = {},
): { exitCode: number; stdout: string; stderr: string } {
  try {
    const stdout = execFileSync("sh", [scriptPath], {
      env: { CERT_DIR: certDir, PATH: process.env.PATH, ...env },
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return { exitCode: 0, stdout, stderr: "" };
  } catch (error: unknown) {
    const e = error as {
      status: number;
      stdout: string;
      stderr: string;
    };
    return {
      exitCode: e.status,
      stdout: e.stdout ?? "",
      stderr: e.stderr ?? "",
    };
  }
}

/** Creates the cert config template files that openssl needs. */
function seedCertConfigs(certDir: string) {
  fs.writeFileSync(path.join(certDir, "cert.conf"), CERT_CONF_CONTENT);
  fs.writeFileSync(path.join(certDir, "csr.conf"), CSR_CONF_CONTENT);
}

/** Creates placeholder cert files to simulate pre-existing certificates. */
function seedAllCertFiles(certDir: string) {
  for (const f of [
    "rootCA.key",
    "rootCA.crt",
    "server.key",
    "server.csr",
    "server.crt",
  ]) {
    fs.writeFileSync(path.join(certDir, f), "placeholder");
  }
}

describe("setup-ssl.sh", () => {
  let certDir: string;

  beforeEach(() => {
    certDir = fs.mkdtempSync(path.join(os.tmpdir(), "ge-ssl-test-"));
  });

  afterEach(() => {
    fs.rmSync(certDir, { recursive: true, force: true });
  });

  it("fails when CERT_DIR is not set", () => {
    const { exitCode, stderr } = runScript("", { CERT_DIR: "" });
    expect(exitCode).not.toBe(0);
    expect(stderr).toContain("CERT_DIR is required");
  });

  describe("with HOST set (generate new certs)", () => {
    it("generates certificate files", () => {
      seedCertConfigs(certDir);

      const { exitCode } = runScript(certDir, { HOST: "localhost" });

      expect(exitCode).toBe(0);
      expect(fs.existsSync(path.join(certDir, "rootCA.key"))).toBe(true);
      expect(fs.existsSync(path.join(certDir, "rootCA.crt"))).toBe(true);
      expect(fs.existsSync(path.join(certDir, "server.key"))).toBe(true);
      expect(fs.existsSync(path.join(certDir, "server.csr"))).toBe(true);
      expect(fs.existsSync(path.join(certDir, "server.crt"))).toBe(true);
    });

    it("adds HOST to cert.conf SAN entries", () => {
      seedCertConfigs(certDir);

      runScript(certDir, { HOST: "my-host.example.com" });

      const certConf = fs.readFileSync(
        path.join(certDir, "cert.conf"),
        "utf-8",
      );
      expect(certConf).toContain("my-host.example.com");
    });

    it("adds HOST to csr.conf SAN entries", () => {
      seedCertConfigs(certDir);

      runScript(certDir, { HOST: "my-host.example.com" });

      const csrConf = fs.readFileSync(path.join(certDir, "csr.conf"), "utf-8");
      expect(csrConf).toContain("my-host.example.com");
    });

    it("exits immediately when openssl fails due to invalid config", () => {
      fs.writeFileSync(path.join(certDir, "cert.conf"), "INVALID");
      fs.writeFileSync(path.join(certDir, "csr.conf"), "INVALID");

      const { exitCode } = runScript(certDir, { HOST: "localhost" });

      expect(exitCode).not.toBe(0);
      expect(fs.existsSync(path.join(certDir, "server.crt"))).toBe(false);
    });
  });

  describe("without HOST (check existing certs)", () => {
    it("succeeds when all cert files exist", () => {
      seedAllCertFiles(certDir);

      const { exitCode, stdout } = runScript(certDir);

      expect(exitCode).toBe(0);
      expect(stdout).toContain("Re-using existing cert");
    });

    it("fails when no cert files exist", () => {
      const { exitCode, stderr } = runScript(certDir);

      expect(exitCode).not.toBe(0);
      expect(stderr).toContain("Missing certificate files");
    });

    it("fails when server.key is missing", () => {
      for (const f of [
        "rootCA.key",
        "rootCA.crt",
        "server.csr",
        "server.crt",
      ]) {
        fs.writeFileSync(path.join(certDir, f), "placeholder");
      }

      const { exitCode, stderr } = runScript(certDir);

      expect(exitCode).not.toBe(0);
      expect(stderr).toContain("server.key");
    });

    it("reports each missing file individually", () => {
      // Only rootCA.key exists
      fs.writeFileSync(path.join(certDir, "rootCA.key"), "placeholder");

      const { exitCode, stderr } = runScript(certDir);

      expect(exitCode).not.toBe(0);
      expect(stderr).toContain("rootCA.crt");
      expect(stderr).toContain("server.key");
      expect(stderr).toContain("server.csr");
      expect(stderr).toContain("server.crt");
      expect(stderr).not.toContain("rootCA.key");
    });
  });
});
