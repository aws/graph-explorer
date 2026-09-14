// Asserts the `packageManager` pin is internally honest and is what is running.
//
// `pnpm/action-setup` parses the version out of `packageManager` and discards the
// integrity hash, so without this check the hash is never verified in CI and a
// wrong or hand-written one would go unnoticed.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const PIN_PATTERN = /^pnpm@(\d+\.\d+\.\d+)\+sha512\.([0-9a-f]{128})$/;

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

/** Converts npm's base64 `dist.integrity` to the hex form `packageManager` uses. */
export function integrityToHex(integrity: string): string {
  // Quotes and whitespace go first: a leading quote would otherwise keep the
  // prefix off the line start and leave "sha512-" inside the decoded bytes.
  const base64 = integrity.replace(/["\s]/g, "").replace(/^sha512-/, "");
  if (base64.length === 0) {
    throw new Error("the registry returned an empty dist.integrity");
  }
  return Buffer.from(base64, "base64").toString("hex");
}

/** Reads `packageManager` out of a manifest without assuming the rest of its shape. */
function readPinField(manifestJson: string): unknown {
  const manifest: unknown = JSON.parse(manifestJson);
  if (typeof manifest !== "object" || manifest === null) {
    throw new Error("package.json does not contain a JSON object");
  }
  return Object.hasOwn(manifest, "packageManager")
    ? (manifest as Record<"packageManager", unknown>).packageManager
    : undefined;
}

export function main() {
  const pin = parsePin(readPinField(readFileSync("package.json", "utf8")));

  const registryHash = integrityToHex(
    execFileSync("pnpm", ["view", `pnpm@${pin.version}`, "dist.integrity"], {
      encoding: "utf8",
    }),
  );
  if (registryHash !== pin.hash) {
    throw new Error(
      `the hash does not match what the registry publishes for pnpm@${pin.version}.\n` +
        `  pinned:   sha512.${pin.hash}\n` +
        `  registry: sha512.${registryHash}\n` +
        `Regenerate the pin with "corepack use pnpm@${pin.version}" rather than editing it by hand.`,
    );
  }

  const running = execFileSync("pnpm", ["--version"], {
    encoding: "utf8",
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
    `pnpm@${pin.version} matches its pinned integrity hash and is the version running.`,
  );
}

if (import.meta.filename === process.argv[1]) {
  try {
    main();
  } catch (error) {
    console.error(
      `packageManager pin check failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}
