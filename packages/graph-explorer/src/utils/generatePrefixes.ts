import cloneDeep from "lodash/cloneDeep";
import isEqual from "lodash/isEqual";
import { PrefixTypeConfig } from "../core";
import commonPrefixes from "./common-prefixes.json";

const cPrefixes: PrefixTypeConfig[] = Object.entries(
  commonPrefixes
).map(([prefix, uri]) => ({ prefix, uri }));

export const generateHashPrefix = (
  url: URL
): Omit<PrefixTypeConfig, "__count"> => {
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
};

const prefixFromHost = (host: string) =>
  host.replace(/^(www\.)*/, "").substring(0, 3);
export const generatePrefix = (url: URL): Omit<PrefixTypeConfig, "__count"> => {
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
    path => !["ontology", "resource", "class"].includes(path.toLowerCase())
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
};

const generatePrefixes = (
  uris: string[],
  currentPrefixes: PrefixTypeConfig[] = []
) => {
  const updatedPrefixes: PrefixTypeConfig[] = cloneDeep(currentPrefixes);
  uris.forEach(uri => {
    const existInCommon = cPrefixes.some(prefixConfig => {
      return !!uri.match(new RegExp(`^${prefixConfig.uri}`));
    });
    if (existInCommon) {
      return;
    }

    const existPrefixIndex = updatedPrefixes.findIndex(prefixConfig => {
      return !!uri.match(new RegExp(`^${prefixConfig.uri}`));
    });

    if (existPrefixIndex === -1) {
      try {
        const url = new URL(uri);
        let newPrefix: PrefixTypeConfig;
        if (url.hash) {
          newPrefix = generateHashPrefix(url);
        } else {
          newPrefix = generatePrefix(url);
        }

        updatedPrefixes.push({ ...newPrefix, __matches: new Set([uri]) });
      } catch {
        // Catching wrong URLs and skip them
      }
    } else {
      if (!updatedPrefixes[existPrefixIndex].__matches) {
        updatedPrefixes[existPrefixIndex].__matches = new Set();
      }
      updatedPrefixes[existPrefixIndex].__matches?.add(uri);
    }
  });

  if (isEqual(currentPrefixes, updatedPrefixes)) {
    return;
  }

  return updatedPrefixes;
};

export default generatePrefixes;
