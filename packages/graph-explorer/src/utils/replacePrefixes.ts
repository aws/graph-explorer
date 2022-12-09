import { PrefixTypeConfig } from "../core";
import commonPrefixes from "./common-prefixes.json";

const commonPrefixesConfig = Object.entries(commonPrefixes).map(
  ([prefix, uri]) => ({
    prefix,
    uri,
  })
);

const replacePrefixes = (
  uri?: string,
  prefixes: PrefixTypeConfig[] = []
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
    p => p.__inferred === true && p.__matches && p.__matches.size > 1
  );
  const allPrefixes = [
    ...customPrefixes,
    ...commonPrefixesConfig,
    ...generatedPrefixes,
  ];

  const prefixConfig = allPrefixes.find(prefixConfig =>
    uri.match(new RegExp(`^${prefixConfig.uri}`))
  );

  if (!prefixConfig) {
    return uri;
  }

  return uri.replace(prefixConfig.uri, `${prefixConfig.prefix}:`);
};

export default replacePrefixes;
