import { useCallback } from "react";
import { sanitizeText } from "../utils";
import replacePrefixes from "../utils/replacePrefixes";
import { useRecoilValue } from "recoil";
import { prefixesSelector } from "../core/StateProvider/configuration";

const useTextTransform = () => {
  const prefixes = useRecoilValue(prefixesSelector);

  return useCallback(
    (text?: string): string => {
      if (!text) {
        return "";
      }

      if (prefixes) {
        return replacePrefixes(text, prefixes);
      }

      return sanitizeText(text);
    },
    [prefixes]
  );
};

export default useTextTransform;
