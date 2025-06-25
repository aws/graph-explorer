import { usePrevious } from "@/hooks";
import { logger } from "@/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useExplorer } from "./connector";
import { createDefaultOptions } from "./queryClient";

/**
 * Ensures the query client has the correct explorer for the connection injected
 * in to the `meta` object. It also clears the cache when the explorer changes.
 */
export function ExplorerInjector() {
  const explorer = useExplorer();
  const previousExplorer = usePrevious(explorer);
  const queryClient = useQueryClient();

  if (explorer !== previousExplorer) {
    logger.log("Clearing cache because connection changed");
    queryClient.clear();
    logger.debug(
      "Setting default options for query client with explorer:",
      explorer
    );
    queryClient.setDefaultOptions(createDefaultOptions(explorer));
  }

  return null;
}
