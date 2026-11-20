import { execFileSync } from "child_process";
import { X509Certificate } from "crypto";
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

/** The name generation gives `host` in the certificate's alternative names. */
export function certificateDnsName(host: string) {
  return `${host}:*`;
}

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
    template.replace(
      alternativeNameLine,
      () => `DNS.1 = ${certificateDnsName(host)}`,
    ),
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

/** What a server certificate names and when it expires. */
export type CertificateSummary = {
  /** The DNS names in the certificate's alternative names. */
  dnsNames: string[];
  expiresAt: Date;
};

/** Reads `server.crt` in `certDir`. Throws when the file isn't a certificate. */
export function readServerCertificate(certDir: string): CertificateSummary {
  const certificate = new X509Certificate(
    fs.readFileSync(path.join(certDir, "server.crt")),
  );
  return {
    dnsNames: (certificate.subjectAltName ?? "")
      .split(", ")
      .filter(name => name.startsWith("DNS:"))
      .map(name => name.slice("DNS:".length)),
    expiresAt: new Date(certificate.validTo),
  };
}

type Reuse =
  | { reusable: true; expiresOn: string }
  | { reusable: false; reason: string };

/** Whether the certificate in `certDir` names `host` and hasn't expired. */
function checkCertificate(
  certDir: string,
  host: string,
  readCertificate: (certDir: string) => CertificateSummary,
): Reuse {
  let certificate;
  try {
    certificate = readCertificate(certDir);
  } catch (error) {
    return {
      reusable: false,
      reason: `The existing server.crt can't be read as a certificate (${messageOf(error)}), so a new certificate is generated.`,
    };
  }
  if (!certificate.dnsNames.includes(certificateDnsName(host))) {
    return {
      reusable: false,
      reason: `The existing certificate doesn't name ${host}, so a new certificate is generated.`,
    };
  }
  const expiresOn = certificate.expiresAt.toISOString().slice(0, 10);
  if (!(certificate.expiresAt.getTime() > Date.now())) {
    return {
      reusable: false,
      reason: `The existing certificate expired on ${expiresOn}, so a new certificate is generated.`,
    };
  }
  return { reusable: true, expiresOn };
}

/**
 * Makes sure the certificate files exist, and says whether it generated them.
 *
 * With a `host` it reuses the files in `certDir` when all of them exist, the
 * server certificate names `host` as generation writes it, and it hasn't
 * expired, so a new container that mounts the same `certDir` keeps the
 * certificate anyone trusted. Otherwise it generates a certificate. Without a
 * `host` it reuses the files and throws when any is missing.
 */
export function prepareCertificates({
  certDir,
  host,
  generate,
  readCertificate,
  logger,
}: {
  certDir: string;
  host: string | undefined;
  generate: (certDir: string, host: string) => void;
  readCertificate: (certDir: string) => CertificateSummary;
  logger: Pick<AppLogger, "info">;
}): "generated" | "reused" {
  const missing = certificateFiles.filter(
    file => !fs.existsSync(path.join(certDir, file)),
  );

  if (host) {
    const check =
      missing.length === 0
        ? checkCertificate(certDir, host, readCertificate)
        : undefined;
    if (check?.reusable) {
      logger.info(
        `Found existing self-signed SSL certificate for ${host}, valid until ${check.expiresOn}. Re-using existing cert.`,
      );
      return "reused";
    }
    if (check) {
      logger.info(check.reason);
    } else if (missing.length < certificateFiles.length) {
      logger.info(
        `Some certificate files are missing from ${certDir} (${missing.join(" ")}), so a new certificate is generated.`,
      );
    }
    logger.info(`Generating new self-signed SSL cert using ${host}...`);
    generate(certDir, host);
    return "generated";
  }

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
