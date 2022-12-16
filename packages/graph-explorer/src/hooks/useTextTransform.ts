import { useCallback } from "react";
import { useConfiguration } from "../core";
import { sanitizeText } from "../utils";
import replacePrefixes from "../utils/replacePrefixes";

const useTextTransform = () => {
  const config = useConfiguration();

  return useCallback(
    (text?: string): string => {
      if (!text) {
        return "";
      }

      if (config?.connection?.queryEngine === "sparql") {
        return replacePrefixes(text, config?.schema?.prefixes);
      }

      return sanitizeText(text);
    },
    [config]
  );
};

export default useTextTransform;
