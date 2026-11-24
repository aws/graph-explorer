import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vite-plus/test";

const script = fileURLToPath(new URL("./pullImage.sh", import.meta.url));
const image = "public.ecr.aws/neptune/graph-explorer:latest-SNAPSHOT";
const rateLimitErrors = [
  "Error response from daemon: toomanyrequests: Data limit exceeded",
  `Error response from daemon: unknown: failed to resolve reference "${image}": unexpected status from HEAD request to https://public.ecr.aws/v2/neptune/graph-explorer/manifests/latest-SNAPSHOT: 429 Too Many Requests`,
];

const dockerStub = `#!/usr/bin/env bash
echo "$*" >> "$STUB_DIR/pulls"
if (( $(wc -l < "$STUB_DIR/pulls") <= FAILURES )); then
  echo "$MESSAGE" >&2
  exit 1
fi
echo pulled
`;

const sleepStub = `#!/usr/bin/env bash
echo "$1" >> "$STUB_DIR/sleeps"
`;

const stubDirs: string[] = [];

afterEach(() => {
  for (const dir of stubDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function readLines(path: string) {
  if (!existsSync(path)) {
    return [];
  }
  return readFileSync(path, "utf8")
    .split("\n")
    .filter(line => line !== "");
}

function runPull(failures: number, message: string) {
  const dir = mkdtempSync(join(tmpdir(), "pull-image-"));
  stubDirs.push(dir);
  writeFileSync(join(dir, "docker"), dockerStub, { mode: 0o755 });
  writeFileSync(join(dir, "sleep"), sleepStub, { mode: 0o755 });

  const { status } = spawnSync("bash", [script, image], {
    encoding: "utf8",
    env: {
      ...process.env,
      PATH: `${dir}:${process.env.PATH}`,
      STUB_DIR: dir,
      FAILURES: String(failures),
      MESSAGE: message,
    },
  });

  return {
    status,
    pulls: readLines(join(dir, "pulls")),
    sleeps: readLines(join(dir, "sleeps")),
  };
}

describe("pullImage.sh", () => {
  it("pulls once when the first pull succeeds", () => {
    expect(runPull(0, "")).toEqual({
      status: 0,
      pulls: [`pull ${image}`],
      sleeps: [],
    });
  });

  describe.each(rateLimitErrors)("when rate limited with %s", rateLimit => {
    it("retries the pull with doubling waits", () => {
      expect(runPull(2, rateLimit)).toEqual({
        status: 0,
        pulls: [`pull ${image}`, `pull ${image}`, `pull ${image}`],
        sleeps: ["10", "20"],
      });
    });

    it("fails once the rate limit outlasts every attempt", () => {
      const result = runPull(99, rateLimit);
      expect(result.status).toBe(1);
      expect(result.pulls).toHaveLength(5);
      expect(result.sleeps).toEqual(["10", "20", "40", "80"]);
    });
  });

  it("fails at once on any other pull error", () => {
    expect(runPull(99, "manifest unknown")).toEqual({
      status: 1,
      pulls: [`pull ${image}`],
      sleeps: [],
    });
  });
});
