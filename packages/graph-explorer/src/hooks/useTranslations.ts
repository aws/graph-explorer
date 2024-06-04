import flat from "flat";
import { useCallback } from "react";

import gremlinTs from "./translations/gremlin-translations.json";
import sparqlTs from "./translations/sparql-translations.json";
import openCypherTs from "./translations/openCypher-translations.json";
import { activeConnectionSelector } from "../core/StateProvider/configuration";
import { useRecoilValue } from "recoil";

const ts: Record<string, Record<string, string>> = {
  gremlin: flat(gremlinTs),
  sparql: flat(sparqlTs),
  openCypher: flat(openCypherTs),
};

const useTranslations = () => {
  const connection = useRecoilValue(activeConnectionSelector);
  const engine = connection?.queryEngine || "gremlin";

  return useCallback(
    (key: string, ns?: string) => {
      return ts[ns || engine]?.[key] || key;
    },
    [engine]
  );
};

export default useTranslations;
