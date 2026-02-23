import type { PrefixTypeConfig } from "@/core";

import commonPrefixes from "./common-prefixes.json";

// Create a map of the common prefixes
const commonPrefixesMap = toPrefixTypeConfigMap(
  Object.entries(commonPrefixes).map(([prefix, uri]) => ({ prefix, uri })),
);

/** Helper function to create a map of prefix configs from an array of configs. */
function toPrefixTypeConfigMap(
  configs: PrefixTypeConfig[],
): Map<string, PrefixTypeConfig> {
  return new Map(configs.map(config => [normalizeUri(config.uri), config]));
}

/** Converts URI to lowercase and trims leading and trailing whitespace. */
function normalizeUri(uri: string) {
  return uri.toLowerCase().trim();
}

/** Checks if the given string is a valid URL with a path. */
function isUrl(str: string) {
  try {
    const url = new URL(str);

    // Check for invalid origin (`urn:Person` has "null" origin)
    if (url.origin.length === 0 || url.origin === "null") {
      return false;
    }

    // Must contain a path or a hash
    return url.pathname.length > 0 || url.hash.length > 0;
  } catch {
    return false;
  }
}

/** Creates a prefix config from the given URI. */
function createPrefixTypeConfig(uri: string): PrefixTypeConfig | null {
  // Create a new prefix entry
  try {
    const url = new URL(uri);
    let newPrefix: PrefixTypeConfig;
    if (url.hash) {
      newPrefix = generateHashPrefix(url);
    } else {
      newPrefix = generatePrefix(url);
    }

    return {
      ...newPrefix,
      __matches: new Set([uri]),
    };
  } catch {
    return null;
  }
}

export function generateHashPrefix(
  url: URL,
): Omit<PrefixTypeConfig, "__count"> {
  const paths = url.pathname.replace(/^\//, "").split("/");
  let prefix;

  if (
    paths.length >= 2 &&
    (paths[paths.length - 1].toLowerCase() === "ontology" ||
      paths[paths.length - 1].toLowerCase() === "resource" ||
      paths[paths.length - 1].toLowerCase() === "class")
  ) {
    prefix =
      paths[paths.length - 2].substring(0, 3) +
      "-" +
      paths[paths.length - 1].toLowerCase().substring(0, 1);
  } else {
    prefix = paths[paths.length - 1].substring(0, 3);
  }

  return {
    __inferred: true,
    uri: url.href.replace(url.hash, "#"),
    prefix,
  };
}

function prefixFromHost(host: string) {
  return host.replace(/^(www\.)*/, "").substring(0, 3);
}

export function generatePrefix(url: URL): Omit<PrefixTypeConfig, "__count"> {
  const paths = url.pathname.replace(/^\//, "").split("/");

  if (paths.length === 1) {
    const prefix = prefixFromHost(url.host);
    return {
      __inferred: true,
      uri: url.origin + "/",
      prefix,
    };
  }

  if (
    paths.length === 2 &&
    (paths[0].toLowerCase() === "ontology" ||
      paths[0].toLowerCase() === "resource" ||
      paths[0].toLowerCase() === "class")
  ) {
    const prefix =
      prefixFromHost(url.host) + "-" + paths[0].toLowerCase().substring(0, 1);
    const uriChunks = url.href.split("/");
    uriChunks.pop();

    return {
      __inferred: true,
      uri: uriChunks.join("/") + "/",
      prefix,
    };
  }

  const filteredPaths = paths.filter(
    path => !["ontology", "resource", "class"].includes(path.toLowerCase()),
  );
  filteredPaths.pop();
  if (filteredPaths.length === 0) {
    const prefix = prefixFromHost(url.host);
    return {
      __inferred: true,
      uri: url.origin + "/",
      prefix,
    };
  }

  const uriChunks = url.href.split("/");
  uriChunks.length = uriChunks.length - 1;
  return {
    __inferred: true,
    uri: uriChunks.join("/") + "/",
    prefix: filteredPaths[0].substring(0, 3),
  };
}

function generatePrefixes(
  uris: Set<string>,
  currentPrefixes: PrefixTypeConfig[],
) {
  const updatedPrefixes = toPrefixTypeConfigMap(currentPrefixes);
  let hasBeenUpdated = false;
  uris
    .values()
    // Filter out non-URLs
    .filter(isUrl)
    // Create prefix config
    .map(uri => createPrefixTypeConfig(uri))
    // Filter out prefix configs that failed to be created
    .filter(newPrefix => newPrefix != null)
    // Filter out common prefixes
    .filter(prefix => !commonPrefixesMap.has(normalizeUri(prefix.uri)))
    // Update the map of prefixes
    .forEach(newPrefix => {
      const existingPrefix = updatedPrefixes.get(newPrefix.uri);
      const normalizedUri = normalizeUri(newPrefix.uri);

      if (!existingPrefix) {
        // Create a new prefix entry
        updatedPrefixes.set(normalizedUri, newPrefix);
        hasBeenUpdated = true;
      } else {
        const set = existingPrefix.__matches ?? new Set();
        const matches = newPrefix.__matches ?? new Set();
        if (set.isDisjointFrom(matches)) {
          existingPrefix.__matches = set.union(matches);
          hasBeenUpdated = true;
        }
      }
    });

  // If nothing was updated, return null
  if (!hasBeenUpdated) {
    return null;
  }

  return updatedPrefixes.values().toArray();
}

export default generatePrefixes;
