/**
 * Decides which tags a release run of build_docker.yml pushes, and checks
 * them afterwards. It has no dependencies, so the workflow runs it with plain
 * Node and no install.
 *
 *   node .github/scripts/releaseImage.ts plan
 *   node .github/scripts/releaseImage.ts verify <tag>...
 */
import { appendFileSync, readFileSync } from "node:fs";

const registry = "https://public.ecr.aws";
const repository = "neptune/graph-explorer";

/**
 * Checks a release's inputs and returns the tags to push, in push order.
 * Throws when the run must not publish.
 */
export function planRelease({
  ref,
  version,
  publishedTags,
}: {
  ref: string;
  version: string;
  publishedTags: readonly string[];
}): string[] {
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version)) {
    throw new Error(`The package.json version "${version}" is not X.Y.Z.`);
  }
  if (ref !== `refs/tags/v${version}`) {
    throw new Error(
      `Release runs must start from the tag v${version}, but this run is on ${ref}.`,
    );
  }

  const tags = [version, `sagemaker-${version}`];
  const published = new Set(publishedTags);
  for (const tag of tags) {
    if (published.has(tag)) {
      throw new Error(`${tag} is already published.`);
    }
  }

  const key = notebookSortKey(version);
  const isNewest = publishedTags.every(
    tag => compareSortKeys(key, notebookSortKey(tag)) > 0,
  );
  return isNewest ? [...tags, "latest", "sagemaker-latest"] : tags;
}

// SageMaker notebooks pull `sagemaker-<highest numeric tag>`, ranked by the
// jq in Neptune's lifecycle script, so `latest` must follow that same order:
// sort_by(split(".") | try map(tonumber) catch [0,0,0])
function notebookSortKey(tag: string): number[] {
  const parts = tag.split(".");
  return parts.every(part => /^\d+$/.test(part))
    ? parts.map(Number)
    : [0, 0, 0];
}

function compareSortKeys(a: number[], b: number[]): number {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] !== b[i]) {
      return a[i] - b[i];
    }
  }
  return a.length - b.length;
}

/**
 * Returns the one digest every tag points to. Throws when a tag is missing
 * (`null`) or the tags point to different images.
 */
export function checkOneDigest(
  digests: ReadonlyMap<string, string | null>,
): string {
  const found = new Set<string>();
  for (const [tag, digest] of digests) {
    if (digest === null) {
      throw new Error(`${tag} is not in the registry.`);
    }
    found.add(digest);
  }
  const [digest, ...others] = found;
  if (digest === undefined) {
    throw new Error("No tags to check.");
  }
  if (others.length > 0) {
    const list = [...digests].map(([tag, d]) => `${tag} ${d}`).join(", ");
    throw new Error(`The pushed tags point to more than one image: ${list}.`);
  }
  return digest;
}

/** Every tag in the public repository, read anonymously. */
export async function fetchPublishedTags(): Promise<string[]> {
  const headers = await anonymousAuth();
  const tags: string[] = [];
  let url: string | null = `${registry}/v2/${repository}/tags/list?n=1000`;
  while (url) {
    const response = await request(url, { headers });
    const body: unknown = await response.json();
    tags.push(...parseTagList(body));
    url = nextPage(response.headers.get("Link"));
  }
  return tags;
}

/**
 * The digest each tag points to, or `null` for a tag that doesn't exist. Asks
 * one tag at a time, since the registry throttles bursts of anonymous reads.
 */
export async function fetchDigests(
  tags: readonly string[],
): Promise<Map<string, string | null>> {
  const headers = {
    ...(await anonymousAuth()),
    Accept: [
      "application/vnd.oci.image.index.v1+json",
      "application/vnd.oci.image.manifest.v1+json",
      "application/vnd.docker.distribution.manifest.list.v2+json",
      "application/vnd.docker.distribution.manifest.v2+json",
    ].join(", "),
  };
  const digests = new Map<string, string | null>();
  for (const tag of tags) {
    const url = `${registry}/v2/${repository}/manifests/${tag}`;
    const response = await request(url, { method: "HEAD", headers }, [404]);
    if (response.status === 404) {
      digests.set(tag, null);
      continue;
    }
    const digest = response.headers.get("Docker-Content-Digest");
    if (!digest) {
      throw new Error(`HEAD ${url} returned no digest.`);
    }
    digests.set(tag, digest);
  }
  return digests;
}

async function anonymousAuth(): Promise<{ Authorization: string }> {
  const response = await request(`${registry}/token/`, {});
  const body: unknown = await response.json();
  if (
    typeof body !== "object" ||
    body === null ||
    !("token" in body) ||
    typeof body.token !== "string"
  ) {
    throw new Error("The registry returned no anonymous token.");
  }
  return { Authorization: `Bearer ${body.token}` };
}

const throttleRetryDelaysMs = [1000, 2000, 4000, 8000];

/** Fetches `url`, waiting out throttling, and throws on an unexpected status. */
async function request(
  url: string,
  init: RequestInit,
  allowedStatuses: readonly number[] = [],
): Promise<Response> {
  let response = await fetch(url, init);
  for (const delayMs of throttleRetryDelaysMs) {
    if (response.status !== 429) {
      break;
    }
    await new Promise(resolve => setTimeout(resolve, delayMs));
    response = await fetch(url, init);
  }
  if (!response.ok && !allowedStatuses.includes(response.status)) {
    throw new Error(
      `${init.method ?? "GET"} ${url} returned ${response.status}.`,
    );
  }
  return response;
}

function parseTagList(body: unknown): string[] {
  if (
    typeof body === "object" &&
    body !== null &&
    "tags" in body &&
    Array.isArray(body.tags) &&
    body.tags.every(tag => typeof tag === "string")
  ) {
    return body.tags;
  }
  throw new Error("The registry returned a tag list without a list of tags.");
}

function nextPage(link: string | null): string | null {
  const match = link?.match(/<([^>]+)>;\s*rel="next"/);
  return match ? new URL(match[1], registry).href : null;
}

function readPackageVersion(): string {
  const body: unknown = JSON.parse(readFileSync("package.json", "utf8"));
  if (
    typeof body !== "object" ||
    body === null ||
    !("version" in body) ||
    typeof body.version !== "string"
  ) {
    throw new Error("package.json has no version.");
  }
  return body.version;
}

function writeOutput(name: string, value: string): void {
  process.stdout.write(`${name}=${value}\n`);
  const file = process.env.GITHUB_OUTPUT;
  if (file) {
    appendFileSync(file, `${name}=${value}\n`);
  }
}

async function main([command, ...args]: string[]): Promise<void> {
  if (command === "plan") {
    const ref = process.env.GITHUB_REF;
    if (!ref) {
      throw new Error("GITHUB_REF is not set.");
    }
    const tags = planRelease({
      ref,
      version: readPackageVersion(),
      publishedTags: await fetchPublishedTags(),
    });
    writeOutput("tags", tags.join(" "));
    return;
  }
  if (command === "verify" && args.length > 0) {
    const digest = checkOneDigest(await fetchDigests(args));
    process.stdout.write(`${args.join(", ")} all point to ${digest}\n`);
    return;
  }
  throw new Error("Usage: releaseImage.ts plan | verify <tag>...");
}

if (import.meta.main) {
  await main(process.argv.slice(2));
}
