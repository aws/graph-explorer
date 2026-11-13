import { execFileSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

import type { AppLogger } from "./logging.ts";

import { isMissingFileError } from "./paths.ts";

export class CertificateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CertificateError";
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

const certificateFiles = [
  "rootCA.key",
  "rootCA.crt",
  "server.key",
  "server.csr",
  "server.crt",
];

const alternativeNameLine = /^DNS\.1 = .*$/m;

/**
 * Generates a root CA and a server certificate signed by it in `certDir`,
 * valid for `host`. It reads the openssl templates `csr.conf` and `cert.conf`
 * from `certDir` and leaves them as they are.
 */
export function generateCertificates(certDir: string, host: string): void {
  const workDir = makeWorkDir(certDir);
  try {
    const csrConfig = writeConfigFor(host, "csr.conf", certDir, workDir);
    const certConfig = writeConfigFor(host, "cert.conf", certDir, workDir);
    const inCertDir = (name: string) => path.join(certDir, name);

    openssl([
      "req",
      "-x509",
      "-sha256",
      "-days",
      "356",
      "-nodes",
      "-newkey",
      "rsa:2048",
      "-subj",
      "/CN=Graph Explorer/C=US/L=Seattle",
      "-keyout",
      inCertDir("rootCA.key"),
      "-out",
      inCertDir("rootCA.crt"),
    ]);
    openssl(["genrsa", "-out", inCertDir("server.key"), "2048"]);
    openssl([
      "req",
      "-new",
      "-key",
      inCertDir("server.key"),
      "-out",
      inCertDir("server.csr"),
      "-config",
      csrConfig,
    ]);
    openssl([
      "x509",
      "-req",
      "-in",
      inCertDir("server.csr"),
      "-CA",
      inCertDir("rootCA.crt"),
      "-CAkey",
      inCertDir("rootCA.key"),
      "-CAcreateserial",
      "-out",
      inCertDir("server.crt"),
      "-days",
      "365",
      "-sha256",
      "-extfile",
      certConfig,
    ]);
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
}

function makeWorkDir(certDir: string) {
  const tmpDir = os.tmpdir();
  try {
    return fs.mkdtempSync(path.join(tmpDir, "graph-explorer-cert-"));
  } catch (error) {
    throw new CertificateError(
      `Couldn't create a working directory in ${tmpDir} to generate the self-signed certificate: ${messageOf(error)}. Give the container a writable ${tmpDir} and ${certDir}, or mount your own certificate files in ${certDir} and leave HOST unset.`,
    );
  }
}

/** Writes the template `name` from `certDir` to `workDir` with `host` as its alternative name. */
function writeConfigFor(
  host: string,
  name: string,
  certDir: string,
  workDir: string,
) {
  const templatePath = path.join(certDir, name);
  const template = readTemplate(templatePath, name, certDir);
  if (!alternativeNameLine.test(template)) {
    throw new CertificateError(
      `${templatePath} has no "DNS.1 = " line to hold the host name.`,
    );
  }
  const configPath = path.join(workDir, name);
  fs.writeFileSync(
    configPath,
    template.replace(alternativeNameLine, () => `DNS.1 = ${host}:*`),
  );
  return configPath;
}

function readTemplate(templatePath: string, name: string, certDir: string) {
  try {
    return fs.readFileSync(templatePath, "utf-8");
  } catch (error) {
    if (isMissingFileError(error)) {
      throw new CertificateError(
        `The openssl template ${name} is missing from ${certDir}, so the self-signed certificate can't be generated. Copy csr.conf and cert.conf from the image into ${certDir}, or mount your own certificate files in ${certDir} and leave HOST unset.`,
      );
    }
    throw error;
  }
}

function openssl(args: string[]) {
  try {
    execFileSync("openssl", args, { stdio: ["ignore", "inherit", "inherit"] });
  } catch (error) {
    throw new CertificateError(
      `Generating the self-signed certificate failed: ${messageOf(error)}`,
    );
  }
}

/**
 * Makes sure the certificate files exist, and says whether it generated them.
 * With a `host` it generates a certificate. Without one it reuses the files
 * in `certDir` and throws when any is missing.
 */
export function prepareCertificates({
  certDir,
  host,
  generate,
  logger,
}: {
  certDir: string;
  host: string | undefined;
  generate: (certDir: string, host: string) => void;
  logger: Pick<AppLogger, "info">;
}): "generated" | "reused" {
  if (host) {
    logger.info(`Generating new self-signed SSL cert using ${host}...`);
    generate(certDir, host);
    return "generated";
  }

  const missing = certificateFiles.filter(
    file => !fs.existsSync(path.join(certDir, file)),
  );
  if (missing.length > 0) {
    throw new CertificateError(
      `Missing certificate files in ${certDir}: ${missing.join(" ")}\nPlease specify --env HOST=<hostname> during docker run command to create SSL cert.`,
    );
  }
  logger.info(
    "Found existing self-signed SSL certificate. Re-using existing cert.",
  );
  return "reused";
}

/**
 * Records that this container has started, so a restart keeps the
 * certificate this start set up. A start that can't record it still runs.
 */
export function recordContainerStart(
  markerPath: string,
  logger: Pick<AppLogger, "warn">,
): void {
  try {
    fs.writeFileSync(markerPath, "");
  } catch (error) {
    logger.warn(
      `Couldn't record this container's start at ${markerPath}, so a restart generates a new certificate: ${messageOf(error)}`,
    );
  }
}
