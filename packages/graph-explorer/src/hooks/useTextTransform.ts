import { sanitizeText } from "@/utils";
import replacePrefixes from "@/utils/replacePrefixes";
import { allNamespacePrefixesSelector } from "@/core/StateProvider/configuration";
import { queryEngineSelector } from "@/core/connector";
import { atom, useAtomValue } from "jotai";

export type TextTransformer = (text?: string) => string;

export const textTransformSelector = atom(get => {
  const queryEngine = get(queryEngineSelector);
  const prefixes = get(allNamespacePrefixesSelector);

  const result: TextTransformer = text => {
    if (!text) {
      return "";
    }

    if (queryEngine === "sparql") {
      return replacePrefixes(text, prefixes);
    }

    return sanitizeText(text);
  };
  return result;
});

function useTextTransform() {
  return useAtomValue(textTransformSelector);
}

export default useTextTransform;
