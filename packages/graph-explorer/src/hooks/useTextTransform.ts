import { sanitizeText } from "@/utils";
import replacePrefixes from "@/utils/replacePrefixes";
import { selector, useRecoilValue } from "recoil";
import { allNamespacePrefixesSelector } from "@/core/StateProvider/configuration";
import { queryEngineSelector } from "@/core/connector";

export type TextTransformer = (text?: string) => string;

export const textTransformSelector = selector({
  key: "textTransform",
  get: ({ get }) => {
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
  },
});

const useTextTransform = () => {
  return useRecoilValue(textTransformSelector);
};

export default useTextTransform;
