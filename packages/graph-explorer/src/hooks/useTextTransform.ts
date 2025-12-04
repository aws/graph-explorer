import replacePrefixes from "@/utils/replacePrefixes";
import { prefixesAtom, queryEngineSelector } from "@/core";
import { atom, useAtomValue } from "jotai";
import { logger } from "@/utils";

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
