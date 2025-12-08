import { logger } from "@/utils";
import { useQueryClient, type DefaultOptions } from "@tanstack/react-query";
import { createDefaultOptions } from "./queryClient";
import { useAtomValue } from "jotai";
import { useMemo, useState } from "react";
import { explorerAtom } from "./connector";
import { getAppStore } from "./StateProvider/appStore";

/**
 * Ensures the query client has the correct explorer for the connection and
 * Jotai store injected in to the `meta` object. It also clears the cache when
 * the explorer changes.
 */
export function ExplorerInjector() {
  const queryClient = useQueryClient();
  const explorer = useAtomValue(explorerAtom);
  const store = getAppStore();

  // Only crate a new defaultOptions when explorer or store changes
  const defaultOptions = useMemo(
    () => createDefaultOptions(explorer, store),
    [explorer, store],
  );

  // Start with null to ensure first render sets the default options properly
  const [prevDefaultOptions, setPrevDefaultOptions] =
    useState<DefaultOptions<Error> | null>(null);

  if (prevDefaultOptions !== defaultOptions) {
    setPrevDefaultOptions(defaultOptions);
    logger.log("Clearing cache and updating query default options");
    queryClient.clear();
    queryClient.setDefaultOptions(defaultOptions);
  }

  return null;
}
