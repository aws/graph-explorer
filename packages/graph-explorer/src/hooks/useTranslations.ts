import flat from "flat";
import { useCallback } from "react";
import { useConfiguration } from "../core";

import gremlinTs from "./translations/gremlin-translations.json";
import sparqlTs from "./translations/sparql-translations.json";
import openCypherTs from "./translations/openCypher-translations.json";

const ts: Record<string, Record<string, string>> = {
  gremlin: flat(gremlinTs),
  sparql: flat(sparqlTs),
  openCypher: flat(openCypherTs),
};

const useTranslations = () => {
  const config = useConfiguration();
  const engine = config?.connection?.queryEngine || "gremlin";

  return useCallback(
    (key: string, ns?: string) => {
      return ts[ns || engine]?.[key] || key;
    },
    [engine]
  );
};

export default useTranslations;
