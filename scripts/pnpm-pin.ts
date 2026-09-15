// Checks the `packageManager` pin against the lockfile and against the pnpm
// that is running.
//
// `pnpm/action-setup` parses the version out of `packageManager` and discards
// the integrity hash, so nothing else verifies the hash. The comparison is
// deliberately against `pnpm-lock.yaml` rather than the registry: the point of
// the pin is that it is a commitment recorded in git, and asking the registry
// what the hash should be would pass whatever a compromised registry served.
// The two values are written by different tools from different downloads,
// `corepack use` from the tarball Corepack fetched and `pnpm install` from the
// one pnpm fetched, so agreement between them is worth something.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const PIN_PATTERN = /^pnpm@(\d+\.\d+\.\d+)\+sha512\.([0-9a-f]{128})$/;
const HEX_SHA512 = /^[0-9a-f]{128}$/;

const repoRoot = new URL("../", import.meta.url);

export type PnpmPin = {
  version: string;
  hash: string;
};

/** Splits a `packageManager` value into its version and hex integrity hash. */
export function parsePin(value: unknown): PnpmPin {
  if (typeof value !== "string") {
    throw new Error("package.json has no packageManager string");
  }
  const match = PIN_PATTERN.exec(value);
  if (match === null) {
    throw new Error(
      `expected "pnpm@<x.y.z>+sha512.<128 hex chars>", got "${value}"`,
    );
  }
  return { version: match[1], hash: match[2] };
}

/** Converts a lockfile's base64 `integrity` to the hex form `packageManager` uses. */
export function integrityToHex(integrity: string): string {
  const base64 = integrity.replace(/["\s]/g, "").replace(/^sha512-/, "");
  const hex = Buffer.from(base64, "base64").toString("hex");
  // Buffer.from drops anything outside the base64 alphabet instead of throwing,
  // so a truncated or mangled value would otherwise decode to some shorter hex
  // and be reported as a mismatched pin rather than as a malformed lockfile.
  if (!HEX_SHA512.test(hex)) {
    throw new Error(
      `"${integrity.trim().slice(0, 120)}" is not a sha512 integrity`,
    );
  }
  return hex;
}

/** Reads `packageManager` out of a manifest without assuming the rest of its shape. */
export function readPinField(manifestJson: string): unknown {
  const manifest: unknown = JSON.parse(manifestJson);
  if (typeof manifest !== "object" || manifest === null) {
    throw new Error("package.json does not contain a JSON object");
  }
  return "packageManager" in manifest ? manifest.packageManager : undefined;
}

/**
 * The `integrity` the lockfile records for `pnpm@<version>`. Throws when the
 * entry is absent, which is what a hand-edited `packageManager` looks like:
 * pnpm records its own version in the lockfile and only `corepack use` or an
 * install moves it.
 */
export function findLockedIntegrity(lockfile: string, version: string): string {
  const escaped = version.replaceAll(".", "\\.");
  const entry = new RegExp(
    `^ {2}pnpm@${escaped}:\\n {4}resolution: \\{integrity: ([^}]+)\\}`,
    "m",
  );
  const match = entry.exec(lockfile);
  if (match === null) {
    throw new Error(
      `pnpm-lock.yaml records no integrity for pnpm@${version}, so the pin and ` +
        `the lockfile disagree. Run "corepack use pnpm@${version}" to move both.`,
    );
  }
  return match[1];
}

export function main() {
  const pin = parsePin(
    readPinField(readFileSync(new URL("package.json", repoRoot), "utf8")),
  );

  const lockedHash = integrityToHex(
    findLockedIntegrity(
      readFileSync(new URL("pnpm-lock.yaml", repoRoot), "utf8"),
      pin.version,
    ),
  );
  if (lockedHash !== pin.hash) {
    throw new Error(
      `packageManager and pnpm-lock.yaml disagree on the pnpm@${pin.version} hash.\n` +
        `  packageManager: sha512.${pin.hash}\n` +
        `  pnpm-lock.yaml: sha512.${lockedHash}\n` +
        `Regenerate the pin with "corepack use pnpm@${pin.version}" rather than editing it by hand.`,
    );
  }

  // cwd pinned to the repo, or pnpm reports on whatever project the caller
  // happens to be standing in and the check fails for the wrong reason.
  const running = execFileSync("pnpm", ["--version"], {
    encoding: "utf8",
    cwd: fileURLToPath(repoRoot),
  }).trim();
  if (running !== pin.version) {
    throw new Error(
      `packageManager pins pnpm@${pin.version} but pnpm ${running} is running.\n` +
        `pnpm reads packageManager and switches to the pinned version from pnpm 11 onwards, ` +
        `so upgrade your pnpm (or run "corepack enable") and try again.`,
    );
  }

  // oxlint-disable-next-line no-console -- stdout is this script's output
  console.log(
    `packageManager and pnpm-lock.yaml agree on pnpm@${pin.version}, and pnpm ${pin.version} is running.`,
  );
}
