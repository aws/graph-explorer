import { execFileSync } from "child_process";
import { X509Certificate } from "crypto";
import fs from "fs";
import os from "os";
import path from "path";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vite-plus/test";

import {
  CertificateError,
  generateCertificates,
  prepareCertificates,
} from "./certificates.ts";

const templateDir = path.resolve(import.meta.dirname, "../cert-info");
const templates = ["csr.conf", "cert.conf"];
const certificateFiles = [
  "rootCA.key",
  "rootCA.crt",
  "server.key",
  "server.csr",
  "server.crt",
];

/** Copies the real openssl templates, so tests break if they change. */
function seedTemplates(certDir: string) {
  for (const template of templates) {
    fs.copyFileSync(
      path.join(templateDir, template),
      path.join(certDir, template),
    );
  }
}

function seedCertificateFiles(certDir: string, files = certificateFiles) {
  for (const file of files) {
    fs.writeFileSync(path.join(certDir, file), "placeholder");
  }
}

function readTemplates(certDir: string) {
  return templates.map(template =>
    fs.readFileSync(path.join(certDir, template), "utf-8"),
  );
}

/** The `openssl x509 -text` output of a certificate. */
function describeCertificate(certDir: string, file: string) {
  return execFileSync(
    "openssl",
    ["x509", "-noout", "-text", "-in", path.join(certDir, file)],
    { encoding: "utf-8" },
  );
}

function readCertificate(certDir: string, file: string) {
  return new X509Certificate(fs.readFileSync(path.join(certDir, file)));
}

function validityInDays(certificate: X509Certificate) {
  const milliseconds =
    new Date(certificate.validTo).getTime() -
    new Date(certificate.validFrom).getTime();
  return milliseconds / (24 * 60 * 60 * 1000);
}

function catchError(run: () => void) {
  try {
    run();
  } catch (error) {
    if (error instanceof Error) {
      return error;
    }
  }
  throw new Error("Expected an error to be thrown");
}

describe("generateCertificates", () => {
  let certDir: string;

  beforeEach(() => {
    certDir = fs.mkdtempSync(path.join(os.tmpdir(), "ge-certificates-test-"));
    seedTemplates(certDir);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    fs.rmSync(certDir, { recursive: true, force: true });
  });

  it("writes the root CA, the server key, request, and certificate", () => {
    generateCertificates(certDir, "localhost");

    expect(fs.readdirSync(certDir).sort()).toStrictEqual(
      [...templates, ...certificateFiles, "rootCA.srl"].sort(),
    );
  });

  it("leaves the templates as they were", () => {
    const before = readTemplates(certDir);

    generateCertificates(certDir, "my-host.example.com");

    expect(readTemplates(certDir)).toStrictEqual(before);
  });

  it("signs a server certificate for the host with the root CA", () => {
    generateCertificates(certDir, "my-host.example.com");

    expect(describeCertificate(certDir, "server.crt")).toContain(
      "DNS:my-host.example.com:*",
    );
    const root = new X509Certificate(
      fs.readFileSync(path.join(certDir, "rootCA.crt")),
    );
    const server = new X509Certificate(
      fs.readFileSync(path.join(certDir, "server.crt")),
    );
    expect(server.verify(root.publicKey)).toBe(true);
  });

  it("issues a root CA for 356 days and a server certificate for 365 days that browsers can use for TLS", () => {
    generateCertificates(certDir, "localhost");

    const root = readCertificate(certDir, "rootCA.crt");
    const server = readCertificate(certDir, "server.crt");
    expect(root.subject).toBe("CN=Graph Explorer\nC=US\nL=Seattle");
    expect(validityInDays(root)).toBe(356);
    expect(server.subject).toBe(
      "C=US\nST=Washington\nL=Seattle\nO=Graph Explorer\nCN=Graph Explorer",
    );
    expect(validityInDays(server)).toBe(365);
    expect(server.ca).toBe(false);
    const text = describeCertificate(certDir, "server.crt");
    expect(text).toContain("CA:FALSE");
    expect(text).toContain(
      "Digital Signature, Non Repudiation, Key Encipherment, Data Encipherment",
    );
  });

  it("throws when a template has no alternative name line", () => {
    fs.writeFileSync(path.join(certDir, "csr.conf"), "[ req ]\n");

    expect(() => generateCertificates(certDir, "localhost")).toThrow(
      new CertificateError(
        `${path.join(certDir, "csr.conf")} has no "DNS.1 = " line to hold the host name.`,
      ),
    );
  });

  it.for(["csr.conf", "cert.conf"])(
    "throws naming the template and the folder when %s is missing",
    template => {
      fs.rmSync(path.join(certDir, template));

      expect(() => generateCertificates(certDir, "localhost")).toThrow(
        new CertificateError(
          `The openssl template ${template} is missing from ${certDir}, so the self-signed certificate can't be generated. Copy csr.conf and cert.conf from the image into ${certDir}, or mount your own certificate files in ${certDir} and leave HOST unset.`,
        ),
      );
    },
  );

  it("throws naming the temporary directory and a way out when it can't create a working directory there", () => {
    const missingTmpDir = path.join(certDir, "missing");
    vi.stubEnv("TMPDIR", missingTmpDir);

    expect(() => generateCertificates(certDir, "localhost")).toThrow(
      new CertificateError(
        `Couldn't create a working directory in ${missingTmpDir} to generate the self-signed certificate: ENOENT: no such file or directory, mkdtemp '${path.join(missingTmpDir, "graph-explorer-cert-")}XXXXXX'. Give the container a writable ${missingTmpDir} and ${certDir}, or mount your own certificate files in ${certDir} and leave HOST unset.`,
      ),
    );
  });

  it("throws and writes no server certificate when openssl rejects the configuration", () => {
    for (const template of templates) {
      fs.writeFileSync(path.join(certDir, template), "DNS.1 = \nINVALID\n");
    }

    const error = catchError(() => generateCertificates(certDir, "localhost"));

    expect(error).toBeInstanceOf(CertificateError);
    expect(error.message).toMatch(
      /^Generating the self-signed certificate failed: Command failed: openssl /,
    );
    expect(fs.existsSync(path.join(certDir, "server.crt"))).toBe(false);
  });
});

describe("prepareCertificates", () => {
  let workDir: string;
  let certDir: string;
  let markerPath: string;
  const generate = vi.fn<(certDir: string, host: string) => void>();
  const logger = { info: vi.fn(), warn: vi.fn() };

  beforeEach(() => {
    workDir = fs.mkdtempSync(path.join(os.tmpdir(), "ge-prepare-test-"));
    certDir = path.join(workDir, "cert-info");
    fs.mkdirSync(certDir);
    markerPath = path.join(workDir, "marker");
    vi.resetAllMocks();
  });

  afterEach(() => {
    fs.chmodSync(workDir, 0o755);
    fs.rmSync(workDir, { recursive: true, force: true });
  });

  function prepare(host: string | undefined) {
    return prepareCertificates({ certDir, markerPath, host, generate, logger });
  }

  it("generates for the host and records it", () => {
    expect(prepare("localhost")).toBe("generated");

    expect(generate).toHaveBeenCalledExactlyOnceWith(certDir, "localhost");
    expect(fs.readFileSync(markerPath, "utf-8")).toBe("localhost\n");
  });

  // docker restart: the container keeps its files, the marker included.
  it("reuses the certificate on a restart, even with a host", () => {
    prepare("localhost");
    seedCertificateFiles(certDir);
    generate.mockClear();

    expect(prepare("localhost")).toBe("reused");

    expect(generate).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenLastCalledWith(
      "Reusing the self-signed certificate generated when this container first started.",
    );
  });

  // A new container keeps cert-info when it is a volume, but not the marker.
  it("generates again in a new container", () => {
    prepare("localhost");
    fs.rmSync(markerPath);

    expect(prepare("localhost")).toBe("generated");

    expect(generate).toHaveBeenCalledTimes(2);
    expect(logger.info).not.toHaveBeenCalledWith(
      expect.stringContaining("recorded for this container"),
    );
  });

  // The marker only says this container generated a certificate, so files
  // that were removed since can't be reused.
  it("generates again when the marker is there but a certificate file is gone", () => {
    seedCertificateFiles(certDir, ["rootCA.key", "rootCA.crt", "server.key"]);
    fs.writeFileSync(markerPath, "localhost\n");

    expect(prepare("localhost")).toBe("generated");

    expect(generate).toHaveBeenCalledExactlyOnceWith(certDir, "localhost");
    expect(logger.info).toHaveBeenCalledWith(
      "The certificate recorded for this container is missing server.csr server.crt, so a new one is generated.",
    );
  });

  it("stops without a host when the marker is there but a certificate file is gone", () => {
    seedCertificateFiles(certDir, ["rootCA.key", "rootCA.crt", "server.key"]);
    fs.writeFileSync(markerPath, "localhost\n");

    expect(() => prepare(undefined)).toThrow(
      `Missing certificate files in ${certDir}: server.csr server.crt\nPlease specify --env HOST=<hostname> during docker run command to create SSL cert.`,
    );
    expect(generate).not.toHaveBeenCalled();
  });

  it("reuses the files in cert-info without a host", () => {
    seedCertificateFiles(certDir);

    expect(prepare(undefined)).toBe("reused");

    expect(generate).not.toHaveBeenCalled();
    expect(fs.existsSync(markerPath)).toBe(false);
  });

  it("names each missing file without a host", () => {
    seedCertificateFiles(certDir, ["rootCA.key"]);

    expect(() => prepare(undefined)).toThrow(
      `Missing certificate files in ${certDir}: rootCA.crt server.key server.csr server.crt\nPlease specify --env HOST=<hostname> during docker run command to create SSL cert.`,
    );
  });

  it("treats an empty host as no host", () => {
    expect(() => prepare("")).toThrow(CertificateError);
  });

  it("warns but still reports generated when it can't record the certificate", ({
    skip,
  }) => {
    // Root ignores file permissions, so chmod can't make anything read-only.
    skip(process.getuid?.() === 0);
    fs.chmodSync(workDir, 0o555);

    expect(prepare("localhost")).toBe("generated");

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining(
        `Couldn't record the certificate at ${markerPath}, so a restart generates a new one`,
      ),
    );
  });
});
