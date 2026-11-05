import { X509Certificate } from "crypto";
import fs from "fs";
import path from "path";

import type { DistrustedRoot } from "./distrusted-roots.ts";

/** The certificates one place in an image trusts, keyed by SHA-256 fingerprint. */
export type TrustedRoots = {
  location: string;
  certificatesBySha256: ReadonlyMap<string, X509Certificate>;
};

export type TrustStoreReport = { lines: string[]; passed: boolean };

const pemCertificatePattern =
  /-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g;

/** Parses every PEM certificate in `pemTexts`, keeping each root once. */
export function parseCertificates(
  location: string,
  pemTexts: readonly string[],
): TrustedRoots {
  const certificatesBySha256 = new Map<string, X509Certificate>();
  for (const text of pemTexts) {
    for (const match of text.matchAll(pemCertificatePattern)) {
      const certificate = new X509Certificate(match[0]);
      certificatesBySha256.set(certificate.fingerprint256, certificate);
    }
  }
  if (certificatesBySha256.size === 0) {
    throw new Error(`No certificates found in ${location}`);
  }
  return { location, certificatesBySha256 };
}

export function readPemFile(filePath: string): TrustedRoots {
  return parseCertificates(filePath, [fs.readFileSync(filePath, "utf8")]);
}

/** Reads every file in an OpenSSL hashed certificate directory, keeping each root once. */
export function readPemDirectory(directoryPath: string): TrustedRoots {
  return parseCertificates(
    directoryPath,
    fs
      .readdirSync(directoryPath)
      .map(name => fs.readFileSync(path.join(directoryPath, name), "utf8")),
  );
}

/**
 * Checks each place an image trusts roots against `distrusted`, returning one
 * line per clean location and one per distrusted root found.
 */
export function checkTrustStore(
  sources: readonly TrustedRoots[],
  distrusted: readonly DistrustedRoot[],
): TrustStoreReport {
  const lines: string[] = [];
  let passed = true;
  for (const { location, certificatesBySha256 } of sources) {
    const found = distrusted.flatMap(root => {
      const certificate = certificatesBySha256.get(root.sha256);
      return certificate ? [{ root, certificate }] : [];
    });
    if (found.length === 0) {
      lines.push(
        `✓ ${location} trusts no distrusted roots (${certificatesBySha256.size} checked)`,
      );
      continue;
    }
    passed = false;
    for (const { root, certificate } of found) {
      const subject = certificate.subject.split("\n").join(", ");
      lines.push(`FAIL: ${location} trusts ${root.name} (${subject})`);
    }
  }
  return { lines, passed };
}
