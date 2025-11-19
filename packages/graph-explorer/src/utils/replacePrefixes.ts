import type { PrefixTypeConfig } from "@/core";
import commonPrefixes from "./common-prefixes.json";

const commonPrefixesConfig = Object.entries(commonPrefixes).map(
  ([prefix, uri]) => ({
    prefix,
    uri,
  }),
);

const replacePrefixes = (
  uri?: string,
  prefixes: PrefixTypeConfig[] = [],
): string => {
  if (!uri) {
    return "";
  }

  // Prefixes priority:
  // 1. manually added
  // 2. common prefixes
  // 3. automatically generated
  const customPrefixes = prefixes.filter(p => !p.__inferred);
  const generatedPrefixes = prefixes.filter(
    p => p.__inferred === true && p.__matches && p.__matches.size > 0,
  );
  const allPrefixes = [
    ...customPrefixes,
    ...commonPrefixesConfig,
    ...generatedPrefixes,
  ];

  // Find matching prefix ignoring case
  const prefixConfig = allPrefixes.find(prefixConfig =>
    uri.match(new RegExp(`^${prefixConfig.uri}`, "i")),
  );

  if (!prefixConfig) {
    return uri;
  }

  // Replace the matching part of the URI with the prefix, ignoring case
  return uri.replace(
    new RegExp(`^${prefixConfig.uri}`, "i"),
    `${prefixConfig.prefix}:`,
  );
};

export default replacePrefixes;
