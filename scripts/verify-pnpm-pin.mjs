// Asserts the `packageManager` pin is internally honest and is what is running.
//
// `pnpm/action-setup` parses the version out of `packageManager` and discards the
// integrity hash, so without this check the hash is never verified in CI and a
// wrong or hand-written one would go unnoticed.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const PIN_PATTERN = /^pnpm@(\d+\.\d+\.\d+)\+sha512\.([0-9a-f]{128})$/;

function fail(message) {
  console.error(`packageManager pin check failed: ${message}`);
  process.exit(1);
}

function registryIntegrityHex(version) {
  const raw = execFileSync(
    "pnpm",
    ["view", `pnpm@${version}`, "dist.integrity"],
    {
      encoding: "utf8",
    },
  );
  const base64 = raw.replace(/^sha512-/m, "").replace(/["\s]/g, "");
  if (base64.length === 0) {
    fail(`the registry returned no dist.integrity for pnpm@${version}`);
  }
  return Buffer.from(base64, "base64").toString("hex");
}

const { packageManager } = JSON.parse(readFileSync("package.json", "utf8"));
if (typeof packageManager !== "string") {
  fail("package.json has no packageManager field");
}

const match = PIN_PATTERN.exec(packageManager);
if (match === null) {
  fail(
    `expected "pnpm@<x.y.z>+sha512.<128 hex chars>", got "${packageManager}"`,
  );
}
const [, pinnedVersion, pinnedHash] = match;

const registryHash = registryIntegrityHex(pinnedVersion);
if (registryHash !== pinnedHash) {
  fail(
    `the hash does not match what the registry publishes for pnpm@${pinnedVersion}.\n` +
      `  pinned:   sha512.${pinnedHash}\n` +
      `  registry: sha512.${registryHash}\n` +
      `Regenerate the pin with "corepack use pnpm@${pinnedVersion}" rather than editing it by hand.`,
  );
}

const runningVersion = execFileSync("pnpm", ["--version"], {
  encoding: "utf8",
}).trim();
if (runningVersion !== pinnedVersion) {
  fail(
    `packageManager pins pnpm@${pinnedVersion} but pnpm ${runningVersion} is running`,
  );
}

// oxlint-disable-next-line no-console -- stdout is this script's output
console.log(
  `pnpm@${pinnedVersion} matches its pinned integrity hash and is the version running.`,
);
