import type { GeneratedPrefix, IriNamespace, RdfPrefix } from "./types";

import { splitIri } from "./splitIri";

const MAX_SEGMENT_LENGTH = 8;

/**
 * Generates a short, lowercase prefix for a valid IRI. Returns `null` if the
 * IRI is invalid or has no namespace/value.
 *
 * Path segments are categorized into three groups:
 * - **Abbreviated**: Structural terms mapped to a short abbreviation that is
 *   appended as a hyphenated suffix (e.g., "ontology" → "-o").
 * - **Ignored**: Segments that are completely dropped (e.g., "ns").
 * - **Meaningful**: All other non-numeric segments.
 *
 * The rightmost meaningful segment becomes the primary prefix. Abbreviated
 * segments after the primary contribute their abbreviation as a suffix.
 * Earlier meaningful segments contribute their word initials as a leading
 * component.
 *
 * When no meaningful segments exist, the host name is used as the primary,
 * with any trailing abbreviated segments still appended.
 *
 * @example
 * generatePrefix("http://www.example.com/soccer/ontology/League")
 * // => { prefix: "soccer-o" }
 *
 * @example
 * generatePrefix("http://kelvinlawrence.net/air-routes/datatypeProperty/name")
 * // => { prefix: "air-dp" }
 *
 * @example
 * generatePrefix("http://example.org/#value")
 * // => { prefix: "example" }
 */
export function generatePrefix(iri: string): GeneratedPrefix | null {
  const parts = splitIri(iri);
  if (!parts) {
    return null;
  }

  const prefix = derivePrefixFromNamespace(parts.namespace);

  return { ...parts, prefix };
}

/**
 * Structural terms that are abbreviated to a short string rather than being
 * used as the primary prefix segment.
 */
const ABBREVIATED_SEGMENTS: Record<string, string> = {
  ontology: "o",
  resource: "r",
  class: "c",
  vocab: "v",
  vocabulary: "v",
  schema: "s",
  def: "d",
  terms: "t",
  property: "p",
  objectproperty: "op",
  datatypeproperty: "dp",
  datatype: "dt",
  data: "da",
  model: "m",
  core: "co",
  entity: "e",
  entities: "e",
};

/** Segments that are completely dropped from prefix generation. */
const IGNORED_SEGMENTS = new Set(["ns"]);

const NUMERIC_ONLY = /^\d+$/;
const WORD_BOUNDARY = /([a-z0-9])([A-Z])|[-_.]+/g;

function derivePrefixFromNamespace(namespace: IriNamespace): RdfPrefix {
  const afterScheme = namespace.indexOf("//");
  const stripped =
    afterScheme === -1 ? namespace : namespace.substring(afterScheme + 2);

  const pathStart = stripped.indexOf("/");
  if (pathStart === -1) {
    return truncate(sanitize(extractHost(stripped))) as RdfPrefix;
  }

  const rawPath = stripped.substring(pathStart + 1).replace(/[#/]$/, "");

  // Single pass: classify segments and track the rightmost meaningful index
  const meaningful: string[] = [];
  const abbreviations: string[] = [];
  let lastAbbrName = "";

  for (const s of rawPath.split("/")) {
    if (s.length === 0 || NUMERIC_ONLY.test(s)) {
      continue;
    }
    const lower = s.toLowerCase();
    if (IGNORED_SEGMENTS.has(lower)) {
      continue;
    }
    const abbr = ABBREVIATED_SEGMENTS[lower];
    if (abbr) {
      abbreviations.push(abbr);
      lastAbbrName = lower;
    } else {
      meaningful.push(s);
      // Reset abbreviations collected so far — only those after the last
      // meaningful segment matter
      abbreviations.length = 0;
    }
  }

  const abbrSuffix = abbreviations.join("");

  // No meaningful segments — use host as primary
  if (meaningful.length === 0) {
    const host = sanitize(extractHost(stripped));
    if (host !== "ns") {
      return sanitize(
        truncate(host) + (abbrSuffix ? "-" + abbrSuffix : ""),
      ) as RdfPrefix;
    }
    // Host is unusable — use the last abbreviation's full name as fallback
    if (lastAbbrName) {
      return truncate(sanitize(lastAbbrName)) as RdfPrefix;
    }
    return "ns" as RdfPrefix;
  }

  // The last meaningful segment is the primary
  const primaryValue = meaningful[meaningful.length - 1];

  const words = splitWords(primaryValue);
  const firstWord = truncate(sanitize(words[0] ?? primaryValue));
  const primary =
    firstWord.length < 3 && words.length > 1
      ? truncate(firstWord + initials(words.slice(1)).toLowerCase())
      : firstWord;

  // Earlier meaningful segments contribute word initials
  let leadingInitials = "";
  for (let i = 0; i < meaningful.length - 1; i++) {
    leadingInitials += initials(splitWords(meaningful[i]));
  }
  leadingInitials = leadingInitials.toLowerCase();

  const combined =
    leadingInitials + primary + (abbrSuffix ? "-" + abbrSuffix : "");

  return sanitize(combined) as RdfPrefix;
}

/** Splits a segment into words on camelCase boundaries, hyphens, underscores, and dots. */
function splitWords(segment: string): string[] {
  return segment
    .replace(WORD_BOUNDARY, (_, lower, upper) =>
      lower ? `${lower} ${upper}` : " ",
    )
    .split(" ")
    .filter(w => w.length > 0);
}

/** Returns the first letter of each word. */
function initials(words: string[]): string {
  return words.map(w => w.charAt(0)).join("");
}

/**
 * Extracts a prefix-friendly name from the hostname, stripping the `www.`
 * prefix, port number, and TLD. Falls back to the full dot-stripped host
 * if nothing meaningful remains.
 */
function extractHost(stripped: string): string {
  const hostEnd = stripped.indexOf("/");
  const raw = hostEnd !== -1 ? stripped.substring(0, hostEnd) : stripped;
  const host = raw.replace(/^www\./i, "").replace(/:\d+$/, "");

  const parts = host.split(".");
  if (parts.length >= 3 && parts[0].length <= 3) {
    return parts[1];
  }
  if (parts.length >= 2) {
    return parts[0];
  }

  return host;
}

/**
 * Lowercases, removes non-alphanumeric characters (except hyphens and
 * underscores), strips leading non-letter characters, and strips trailing
 * hyphens and underscores. Falls back to `"ns"` if nothing remains.
 */
function sanitize(raw: string): string {
  const cleaned = raw
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .replace(/^[^a-z]+/, "")
    .replace(/[_-]+$/, "");
  return cleaned || "ns";
}

/** Caps at MAX_SEGMENT_LENGTH and strips trailing hyphens and underscores exposed by truncation. */
function truncate(value: string): string {
  return value.substring(0, MAX_SEGMENT_LENGTH).replace(/[_-]+$/, "") || "ns";
}
