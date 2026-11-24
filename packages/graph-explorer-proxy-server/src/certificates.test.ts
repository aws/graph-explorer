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
  type CertificateSummary,
  CertificateError,
  generateCertificates,
  prepareCertificates,
  readCertificateSummary,
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

describe("readCertificateSummary", () => {
  let certDir: string;

  beforeEach(() => {
    certDir = fs.mkdtempSync(path.join(os.tmpdir(), "ge-read-cert-test-"));
    seedTemplates(certDir);
  });

  afterEach(() => {
    fs.rmSync(certDir, { recursive: true, force: true });
  });

  it("reads the name generation gives the host, and the earlier expiry of the root and the server certificate", () => {
    generateCertificates(certDir, "my-host.example.com");

    const { dnsNames, expiresAt, expiringFile } =
      readCertificateSummary(certDir);

    expect(dnsNames).toStrictEqual(["my-host.example.com:*"]);
    // Generation issues the root for 356 days and the server for 365.
    expect(expiringFile).toBe("rootCA.crt");
    expect(expiresAt).toStrictEqual(
      readCertificate(certDir, "rootCA.crt").validToDate,
    );
  });

  it("reports the server certificate when it expires first", () => {
    generateCertificates(certDir, "my-host.example.com");
    // A root issued for longer than the server's 365 days.
    execFileSync("openssl", [
      "req",
      "-x509",
      "-sha256",
      "-days",
      "400",
      "-nodes",
      "-newkey",
      "rsa:2048",
      "-subj",
      "/CN=Graph Explorer",
      "-keyout",
      path.join(certDir, "rootCA.key"),
      "-out",
      path.join(certDir, "rootCA.crt"),
    ]);
    const server = readCertificate(certDir, "server.crt").validToDate;
    expect(server.getTime()).toBeLessThan(
      readCertificate(certDir, "rootCA.crt").validToDate.getTime(),
    );

    const { expiresAt, expiringFile } = readCertificateSummary(certDir);

    expect(expiringFile).toBe("server.crt");
    expect(expiresAt).toStrictEqual(server);
  });

  it.for(["server.crt", "rootCA.crt"])(
    "throws when %s isn't a certificate",
    file => {
      generateCertificates(certDir, "my-host.example.com");
      fs.writeFileSync(path.join(certDir, file), "placeholder");

      expect(() => readCertificateSummary(certDir)).toThrow(/PEM routines/);
    },
  );
});

describe("prepareCertificates", () => {
  let workDir: string;
  let certDir: string;
  const generate = vi.fn<(certDir: string, host: string) => void>();
  const logger = { info: vi.fn() };
  const farFuture = new Date("2999-01-01T00:00:00Z");

  /** The certificate `readCertificate` finds in `certDir`. */
  let certificate: CertificateSummary | Error;
  const readCertificate = vi.fn((_certDir: string) => {
    if (certificate instanceof Error) {
      throw certificate;
    }
    return certificate;
  });

  beforeEach(() => {
    workDir = fs.mkdtempSync(path.join(os.tmpdir(), "ge-prepare-test-"));
    certDir = path.join(workDir, "cert-info");
    fs.mkdirSync(certDir);
    certificate = {
      dnsNames: ["localhost:*"],
      expiresAt: farFuture,
      expiringFile: "server.crt",
    };
    vi.resetAllMocks();
  });

  afterEach(() => {
    fs.rmSync(workDir, { recursive: true, force: true });
  });

  function prepare(host: string | undefined) {
    return prepareCertificates({
      certDir,
      host,
      generate,
      readCertificate,
      logger,
    });
  }

  it("generates for the host when cert-info holds no certificate files", () => {
    expect(prepare("localhost")).toBe("generated");

    expect(generate).toHaveBeenCalledExactlyOnceWith(certDir, "localhost");
    expect(readCertificate).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledExactlyOnceWith(
      "Generating new self-signed SSL cert using localhost...",
    );
  });

  // A restart, or a new container that mounts the same cert-info volume.
  it("reuses the certificate that names the host and hasn't expired", () => {
    seedCertificateFiles(certDir);

    expect(prepare("localhost")).toBe("reused");

    expect(generate).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledExactlyOnceWith(
      "Found existing self-signed SSL certificate for localhost, valid until 2999-01-01. Re-using existing cert.",
    );
  });

  it("generates again when the certificate names another host", () => {
    seedCertificateFiles(certDir);
    certificate = {
      dnsNames: ["other.example.com:*"],
      expiresAt: farFuture,
      expiringFile: "server.crt",
    };

    expect(prepare("localhost")).toBe("generated");

    expect(generate).toHaveBeenCalledExactlyOnceWith(certDir, "localhost");
    expect(logger.info).toHaveBeenCalledWith(
      "The existing certificate doesn't name localhost, so a new certificate is generated.",
    );
  });

  // The name generation writes ends in ":*", so the bare host isn't it.
  it("generates again when the certificate lists only the bare host", () => {
    seedCertificateFiles(certDir);
    certificate = {
      dnsNames: ["localhost"],
      expiresAt: farFuture,
      expiringFile: "server.crt",
    };

    expect(prepare("localhost")).toBe("generated");
  });

  it.for(["server.crt", "rootCA.crt"] as const)(
    "generates again when %s has expired, naming it",
    expiringFile => {
      seedCertificateFiles(certDir);
      certificate = {
        dnsNames: ["localhost:*"],
        expiresAt: new Date("2020-03-04T05:06:07Z"),
        expiringFile,
      };

      expect(prepare("localhost")).toBe("generated");

      expect(generate).toHaveBeenCalledExactlyOnceWith(certDir, "localhost");
      expect(logger.info).toHaveBeenCalledWith(
        `The existing ${expiringFile} expired on 2020-03-04, so a new certificate is generated.`,
      );
    },
  );

  it("generates again when a certificate can't be read", () => {
    seedCertificateFiles(certDir);
    certificate = new Error("bad certificate");

    expect(prepare("localhost")).toBe("generated");

    expect(logger.info).toHaveBeenCalledWith(
      "The existing server.crt or rootCA.crt can't be read as a certificate (bad certificate), so a new certificate is generated.",
    );
  });

  it("generates again when some certificate files are missing, naming them", () => {
    seedCertificateFiles(certDir, ["rootCA.key", "rootCA.crt", "server.key"]);

    expect(prepare("localhost")).toBe("generated");

    expect(generate).toHaveBeenCalledExactlyOnceWith(certDir, "localhost");
    expect(readCertificate).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(
      `Some certificate files are missing from ${certDir} (server.csr server.crt), so a new certificate is generated.`,
    );
  });

  it("reuses the files in cert-info without a host, whatever they name", () => {
    seedCertificateFiles(certDir);

    expect(prepare(undefined)).toBe("reused");

    expect(generate).not.toHaveBeenCalled();
    expect(readCertificate).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledExactlyOnceWith(
      "Found existing self-signed SSL certificate. Re-using existing cert.",
    );
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
});

describe("prepareCertificates with the certificates generation writes", () => {
  let certDir: string;

  beforeEach(() => {
    certDir = fs.mkdtempSync(path.join(os.tmpdir(), "ge-reuse-test-"));
    seedTemplates(certDir);
  });

  afterEach(() => {
    fs.rmSync(certDir, { recursive: true, force: true });
  });

  function prepare(host: string) {
    return prepareCertificates({
      certDir,
      host,
      generate: generateCertificates,
      readCertificate: readCertificateSummary,
      logger: { info: () => undefined },
    });
  }

  it("keeps the certificate for the same host and replaces it for another", () => {
    expect(prepare("my-host.example.com")).toBe("generated");
    const first = fs.readFileSync(path.join(certDir, "server.crt"));

    expect(prepare("my-host.example.com")).toBe("reused");
    expect(fs.readFileSync(path.join(certDir, "server.crt"))).toStrictEqual(
      first,
    );

    expect(prepare("other.example.com")).toBe("generated");
    expect(fs.readFileSync(path.join(certDir, "server.crt"))).not.toStrictEqual(
      first,
    );
  });

  describe("as time passes", () => {
    const day = 24 * 60 * 60 * 1000;

    beforeEach(() => {
      vi.useFakeTimers({ toFake: ["Date"] });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    // Generation issues the root for 356 days and the server for 365, so the
    // server certificate outlives the root by nine days.
    it("keeps the certificate until the root expires, then replaces both", () => {
      expect(prepare("my-host.example.com")).toBe("generated");
      const first = fs.readFileSync(path.join(certDir, "server.crt"));

      vi.setSystemTime(Date.now() + 350 * day);
      expect(prepare("my-host.example.com")).toBe("reused");

      vi.setSystemTime(Date.now() + 10 * day);
      expect(prepare("my-host.example.com")).toBe("generated");
      expect(
        fs.readFileSync(path.join(certDir, "server.crt")),
      ).not.toStrictEqual(first);
    });
  });
});
