import { sanitizeText } from "@/utils";
import replacePrefixes from "@/utils/replacePrefixes";
import { selector, useRecoilValue } from "recoil";
import { assembledConfigSelector } from "@/core/ConfigurationProvider/useConfiguration";

export const textTransformSelector = selector({
  key: "textTransform",
  get: ({ get }) => {
    const config = get(assembledConfigSelector);

    return (text?: string): string => {
      if (!text) {
        return "";
      }

      if (config?.connection?.queryEngine === "sparql") {
        return replacePrefixes(text, config?.schema?.prefixes);
      }

      return sanitizeText(text);
    };
  },
});

const useTextTransform = () => {
  return useRecoilValue(textTransformSelector);
};

export default useTextTransform;
