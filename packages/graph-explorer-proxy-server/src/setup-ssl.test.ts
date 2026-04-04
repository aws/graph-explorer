import { execFileSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

const scriptPath = path.resolve(import.meta.dirname, "../../../setup-ssl.sh");

const CERT_CONF_CONTENT = `authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names

[alt_names]
# Filled in by Dockerfile
DNS.1 = `;

const CSR_CONF_CONTENT = `[ req ]
default_bits = 2048
prompt = no
default_md = sha256
req_extensions = req_ext
distinguished_name = dn

[ dn ]
C = US
ST = Washington
L = Seattle
O = Graph Explorer
CN = Graph Explorer

[ req_ext ]
subjectAltName = @alt_names

[ alt_names ]
# Filled in by Dockerfile
DNS.1 = `;

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
  });

  describe("without HOST (check existing certs)", () => {
    it("succeeds when all cert files exist", () => {
      seedAllCertFiles(certDir);

      const { exitCode, stdout } = runScript(certDir);

      expect(exitCode).toBe(0);
      expect(stdout).toContain("Re-using existing cert");
    });

    it("fails when no cert files exist", () => {
      const { exitCode, stdout } = runScript(certDir);

      expect(exitCode).not.toBe(0);
      expect(stdout).toContain("No existing self-signed SSL certificate found");
    });

    // BUG: The existence check has rootCA.crt listed twice and server.key is
    // never checked. This means a missing server.key is not detected.
    it("does not detect a missing server.key file", () => {
      for (const f of [
        "rootCA.key",
        "rootCA.crt",
        "server.csr",
        "server.crt",
      ]) {
        fs.writeFileSync(path.join(certDir, f), "placeholder");
      }

      const { exitCode } = runScript(certDir);

      // Should fail but passes due to the duplicate rootCA.crt check
      expect(exitCode).toBe(0);
    });
  });
});
