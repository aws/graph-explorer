import { createRandomName } from "@graph-explorer/shared/utils/testing";
import { X509Certificate } from "crypto";
import fs from "fs";
import os from "os";
import path from "path";
import tls from "tls";
import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";

import { distrustedRoots } from "./distrusted-roots.ts";
import {
  checkTrustStore,
  parseCertificates,
  readPemDirectory,
  readPemFile,
} from "./trust-store.ts";

let dir: string;

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "trust-store-"));
});

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

/** Returns `count` distinct PEM certificates from the host's built-in roots. */
function randomRootPems(count: number): string[] {
  return [...tls.rootCertificates]
    .sort(() => Math.random() - 0.5)
    .slice(0, count);
}

function fingerprintOf(pem: string) {
  return new X509Certificate(pem).fingerprint256;
}

function subjectOf(pem: string) {
  return new X509Certificate(pem).subject.split("\n").join(", ");
}

describe("checkTrustStore", () => {
  it("reports a distrusted root a location trusts, with its subject", () => {
    const [first, second] = randomRootPems(2);
    const location = createRandomName("location");
    const name = createRandomName("Root");

    const report = checkTrustStore(
      [parseCertificates(location, [first, second])],
      [{ name, sha256: fingerprintOf(first) }],
    );

    expect(report).toStrictEqual({
      lines: [`FAIL: ${location} trusts ${name} (${subjectOf(first)})`],
      passed: false,
    });
  });

  it("reports every distrusted root a location trusts, in list order", () => {
    const [first, second] = randomRootPems(2);
    const location = createRandomName("location");
    const firstName = createRandomName("Root");
    const secondName = createRandomName("Root");

    const report = checkTrustStore(
      [parseCertificates(location, [first, second])],
      [
        { name: secondName, sha256: fingerprintOf(second) },
        { name: firstName, sha256: fingerprintOf(first) },
      ],
    );

    expect(report).toStrictEqual({
      lines: [
        `FAIL: ${location} trusts ${secondName} (${subjectOf(second)})`,
        `FAIL: ${location} trusts ${firstName} (${subjectOf(first)})`,
      ],
      passed: false,
    });
  });

  it("prints one line per location when none trusts a distrusted root", () => {
    const [first, second, third, distrusted] = randomRootPems(4);
    const locationA = createRandomName("location");
    const locationB = createRandomName("location");

    const report = checkTrustStore(
      [
        parseCertificates(locationA, [first, second]),
        parseCertificates(locationB, [third]),
      ],
      [{ name: createRandomName("Root"), sha256: fingerprintOf(distrusted) }],
    );

    expect(report).toStrictEqual({
      lines: [
        `✓ ${locationA} trusts no distrusted roots (2 checked)`,
        `✓ ${locationB} trusts no distrusted roots (1 checked)`,
      ],
      passed: true,
    });
  });

  it("fails when only one of several locations trusts a distrusted root", () => {
    const [clean, distrusted] = randomRootPems(2);
    const cleanLocation = createRandomName("location");
    const badLocation = createRandomName("location");
    const name = createRandomName("Root");

    const report = checkTrustStore(
      [
        parseCertificates(cleanLocation, [clean]),
        parseCertificates(badLocation, [distrusted]),
      ],
      [{ name, sha256: fingerprintOf(distrusted) }],
    );

    expect(report).toStrictEqual({
      lines: [
        `✓ ${cleanLocation} trusts no distrusted roots (1 checked)`,
        `FAIL: ${badLocation} trusts ${name} (${subjectOf(distrusted)})`,
      ],
      passed: false,
    });
  });
});

describe("parseCertificates", () => {
  it("keeps a root that appears more than once only once", () => {
    const [pem] = randomRootPems(1);

    const roots = parseCertificates(createRandomName("location"), [pem, pem]);

    expect([...roots.certificatesBySha256.keys()]).toStrictEqual([
      fingerprintOf(pem),
    ]);
  });

  it("refuses a location with no certificates", () => {
    const location = createRandomName("location");

    expect(() => parseCertificates(location, ["no certificates here"])).toThrow(
      `No certificates found in ${location}`,
    );
  });
});

describe("readPemFile", () => {
  it("reads every certificate in a bundle", () => {
    const [first, second] = randomRootPems(2);
    const bundlePath = path.join(dir, "tls-ca-bundle.pem");
    fs.writeFileSync(
      bundlePath,
      `# ${createRandomName("Root")}\n${first}\n\n# ${createRandomName("Root")}\n${second}\n`,
    );

    const roots = readPemFile(bundlePath);

    expect([...roots.certificatesBySha256.keys()]).toStrictEqual([
      fingerprintOf(first),
      fingerprintOf(second),
    ]);
  });

  it("fails when the bundle is missing", () => {
    expect(() => readPemFile(path.join(dir, "missing.pem"))).toThrow("ENOENT");
  });
});

describe("readPemDirectory", () => {
  it("reads each root once when hash links point at it", () => {
    const [first, second] = randomRootPems(2);
    fs.writeFileSync(path.join(dir, "a.pem"), first);
    fs.writeFileSync(path.join(dir, "b.pem"), second);
    fs.symlinkSync("a.pem", path.join(dir, "1a2b3c4d.0"));

    const roots = readPemDirectory(dir);

    expect([...roots.certificatesBySha256.keys()].sort()).toStrictEqual(
      [fingerprintOf(first), fingerprintOf(second)].sort(),
    );
  });

  it("fails when the directory is missing", () => {
    expect(() => readPemDirectory(path.join(dir, "missing"))).toThrow("ENOENT");
  });

  it("fails when the directory holds no certificates", () => {
    expect(() => readPemDirectory(dir)).toThrow("No certificates found in");
  });
});

describe("distrustedRoots", () => {
  it.each(distrustedRoots.map(root => [root.name, root.sha256]))(
    "matches fingerprints in the format X509Certificate reports for %s",
    (_name, sha256) => {
      expect(sha256).toMatch(/^([0-9A-F]{2}:){31}[0-9A-F]{2}$/);
    },
  );

  it("lists each fingerprint once", () => {
    expect(new Set(distrustedRoots.map(root => root.sha256)).size).toBe(
      distrustedRoots.length,
    );
  });
});
