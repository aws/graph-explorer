import { flatten } from "flat";
import { useCallback } from "react";
import { useQueryEngine } from "@/core";

import gremlinTs from "./translations/gremlin-translations.json";
import sparqlTs from "./translations/sparql-translations.json";
import openCypherTs from "./translations/openCypher-translations.json";

const ts: Record<string, Record<string, string>> = {
  gremlin: flatten(gremlinTs),
  sparql: flatten(sparqlTs),
  openCypher: flatten(openCypherTs),
};

const useTranslations = () => {
  const queryEngine = useQueryEngine();

  return useCallback(
    (key: string, ns?: string) => {
      return ts[ns || queryEngine]?.[key] || key;
    },
    [queryEngine]
  );
};

export default useTranslations;
