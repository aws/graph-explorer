import { logger } from "@/utils";
import { useQueryClient } from "@tanstack/react-query";
import { defaultOptionsAtom } from "./queryClient";
import { useAtomValue } from "jotai";
import { useState } from "react";

/**
 * Ensures the query client has the correct explorer for the connection injected
 * in to the `meta` object. It also clears the cache when the explorer changes.
 */
export function ExplorerInjector() {
  const queryClient = useQueryClient();
  const defaultOptions = useAtomValue(defaultOptionsAtom);
  const [prevDefaultOptions, setPrevDefaultOptions] = useState(defaultOptions);

  if (prevDefaultOptions !== defaultOptions) {
    setPrevDefaultOptions(defaultOptions);
    logger.log(
      "Clearing cache and updating query default options due to connection change"
    );
    queryClient.clear();
    queryClient.setDefaultOptions(defaultOptions);
  }

  return null;
}
