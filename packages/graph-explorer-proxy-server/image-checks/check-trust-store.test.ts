import { execFileSync } from "child_process";
import { X509Certificate } from "crypto";
import fs from "fs";
import os from "os";
import path from "path";
import tls from "tls";
import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";

import { distrustedRoots } from "./distrusted-roots.ts";

const scriptPath = path.resolve(import.meta.dirname, "check-trust-store.ts");
const distrustedPem = fs.readFileSync(
  path.resolve(import.meta.dirname, "fixtures/emsign-ecc-root-ca-g3.pem"),
  "utf8",
);

let pemDirectory: string;

beforeEach(() => {
  pemDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "check-trust-store-"));
});

afterEach(() => {
  fs.rmSync(pemDirectory, { recursive: true, force: true });
});

function runCheck() {
  try {
    const stdout = execFileSync(process.execPath, [scriptPath], {
      env: { TRUST_STORE_PEM_DIR: pemDirectory, PATH: process.env.PATH },
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return { exitCode: 0, lines: stdout.split("\n") };
  } catch (error: unknown) {
    const e = error as { status: number; stdout: string };
    return { exitCode: e.status, lines: (e.stdout ?? "").split("\n") };
  }
}

/** A built-in root of the host node that is not on the distrusted list. */
function trustedHostRootPem() {
  const distrusted = new Set(distrustedRoots.map(root => root.sha256));
  const pem = tls.rootCertificates.find(
    candidate => !distrusted.has(new X509Certificate(candidate).fingerprint256),
  );
  if (!pem) {
    throw new Error("The host node has no trusted root certificates");
  }
  return pem;
}

/** Writes the OS trust store layout the check reads from `pemDirectory`. */
function writeTrustStore(pems: readonly string[]) {
  fs.writeFileSync(
    path.join(pemDirectory, "tls-ca-bundle.pem"),
    pems.join("\n"),
  );
  const hashedDirectory = path.join(pemDirectory, "directory-hash");
  fs.mkdirSync(hashedDirectory);
  pems.forEach((pem, index) =>
    fs.writeFileSync(path.join(hashedDirectory, `root${index}.0`), pem),
  );
}

describe("check-trust-store", () => {
  it("fails when the trust store holds a distrusted root", () => {
    writeTrustStore([trustedHostRootPem(), distrustedPem]);

    const { exitCode, lines } = runCheck();

    expect(exitCode).toBe(1);
    const failures = lines.filter(line => line.startsWith("FAIL:"));
    expect(failures).toContainEqual(
      expect.stringMatching(/tls-ca-bundle\.pem.*emSign ECC Root CA - G3/),
    );
    expect(failures).toContainEqual(
      expect.stringMatching(/directory-hash.*emSign ECC Root CA - G3/),
    );
  });

  it("passes when the trust store holds no distrusted root", () => {
    writeTrustStore([trustedHostRootPem()]);

    const { exitCode, lines } = runCheck();

    // The host node's own roots can include a listed root, so the exit code follows the reported failures.
    expect(exitCode).toBe(lines.some(line => line.startsWith("FAIL:")) ? 1 : 0);
    expect(lines).toContainEqual(
      expect.stringMatching(/^✓ .*tls-ca-bundle\.pem/),
    );
    expect(lines).toContainEqual(expect.stringMatching(/^✓ .*directory-hash/));
    expect(lines.filter(line => line.startsWith("FAIL:"))).not.toContainEqual(
      expect.stringMatching(/tls-ca-bundle\.pem|directory-hash/),
    );
  });
});
