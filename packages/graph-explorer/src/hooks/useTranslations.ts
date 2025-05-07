import { flatten } from "flat";
import { useQueryEngine } from "@/core/connector";

import gremlinTs from "./translations/gremlin-translations.json";
import sparqlTs from "./translations/sparql-translations.json";
import openCypherTs from "./translations/openCypher-translations.json";
import { QueryEngine } from "@shared/types";

const translations: Record<QueryEngine, Record<string, string>> = {
  gremlin: flatten(gremlinTs),
  sparql: flatten(sparqlTs),
  openCypher: flatten(openCypherTs),
};

type TranslationPaths = Leaves<
  typeof gremlinTs | typeof sparqlTs | typeof openCypherTs
>;

export function getTranslation(
  key: TranslationPaths,
  queryEngine: QueryEngine
) {
  return translations[queryEngine][key] || key;
}

export default function useTranslations() {
  const queryEngine = useQueryEngine();

  return (key: TranslationPaths, ns?: QueryEngine) =>
    getTranslation(key, ns || queryEngine);
}

/*

# Developer Note

In order to make the keys for the translation JSON files type safe, we need to
collapse the nested structure of the JSON data into a single level. The call to
flatten() does this for us, but it looses all the type information.

To make sure the `key` parameter is type safe, we need to use some fancy
TypeScript type definitions that recursively build out the flattened keys.

I don't claim to fully understand the TypeScript logic below, but it seems to
work perfectly.

There is an explanation on the Stack Overflow post below:

- https://stackoverflow.com/a/58436959

*/
type Prev = [
  never,
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
  17,
  18,
  19,
  20,
  ...0[],
];
type Join<K, P> = K extends string | number
  ? P extends string | number
    ? `${K}${"" extends P ? "" : "."}${P}`
    : never
  : never;

type Leaves<T, D extends number = 10> = [D] extends [never]
  ? never
  : T extends object
    ? { [K in keyof T]-?: Join<K, Leaves<T[K], Prev[D]>> }[keyof T]
    : "";
