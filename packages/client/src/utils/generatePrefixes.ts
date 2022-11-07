import { PrefixTypeConfig } from "../core";
import commonPrefixes from "./common-prefixes.json";

const cPrefixes: PrefixTypeConfig[] = Object.entries(
  commonPrefixes
).map(([prefix, uri]) => ({ prefix, uri }));

const generatePrefixes = (
  uris: string[],
  currentPrefixes: PrefixTypeConfig[] = []
) => {
  const allPrefixes = [...currentPrefixes, ...cPrefixes];
  const genPrefixes: PrefixTypeConfig[] = [];
  uris.forEach(uri => {
    const existMatchingPrefix = allPrefixes.some(prefixConfig => {
      return !!uri.match(new RegExp(`^${prefixConfig.uri}`));
    });

    if (!existMatchingPrefix) {
      const url = new URL(uri);
      const hostPrefix = url.host.replace(/^(www\.)*/, "").substring(0, 2);

      const [firstPathName, secondPathName] = url.pathname
        .replace(/^\//, "")
        .split("/");
      const newPrefix = {
        uri:
          url.origin +
          (firstPathName ? `/${firstPathName}` : "") +
          (secondPathName ? "/" : ""),
        prefix:
          hostPrefix + (firstPathName ? firstPathName.substring(0, 2) : ""),
        __inferred: true,
      };

      genPrefixes.push(newPrefix);
      allPrefixes.push(newPrefix);
    }
  });

  return genPrefixes;
};

export default generatePrefixes;
