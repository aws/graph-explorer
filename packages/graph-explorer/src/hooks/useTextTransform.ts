import { atom, useAtomValue } from "jotai";

import { prefixesAtom, queryEngineSelector } from "@/core";
import { logger } from "@/utils";
import replacePrefixes from "@/utils/replacePrefixes";

export type TextTransformer = (text: string) => string;

export const textTransformSelector = atom(get => {
  const queryEngine = get(queryEngineSelector);
  const prefixes = get(prefixesAtom);

  logger.debug("Creating text transform", prefixes);

  const result: TextTransformer = text => {
    if (!text) {
      return "";
    }

    if (queryEngine === "sparql") {
      return replacePrefixes(text, prefixes);
    }

    return text;
  };
  return result;
});

function useTextTransform() {
  return useAtomValue(textTransformSelector);
}

export default useTextTransform;
