import { queryOptions } from "@tanstack/react-query";

import type { EdgeType } from "@/core";

import { setEdgeConnectionsAtom } from "@/core/StateProvider/schema";
import { logger } from "@/utils";

import { getExplorer, getStore } from "./helpers";

export function edgeConnectionsQuery(edgeTypes: EdgeType[]) {
  const sortedEdgeTypes = [...edgeTypes].sort();
  return queryOptions({
    queryKey: ["edgeConnections", sortedEdgeTypes],
    queryFn: async ({ signal, meta }) => {
      const explorer = getExplorer(meta);
      const store = getStore(meta);

      const results = await explorer.fetchEdgeConnections(
        { edgeTypes },
        { signal },
      );

      // Update edge connections
      logger.debug(
        "Setting edge connections in store",
        results.edgeConnections,
      );
      store.set(setEdgeConnectionsAtom, results.edgeConnections);

      return results;
    },
  });
}
