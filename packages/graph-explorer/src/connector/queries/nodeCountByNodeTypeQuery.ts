import { queryOptions } from "@tanstack/react-query";
import { getExplorer } from "./helpers";

/**
 * Retrieves the count of nodes for a specific node type.
 * @param nodeType A node label or class.
 * @param explorer The service client to use for fetching.
 * @returns An object with the total nodes for the given node type.
 */
export function nodeCountByNodeTypeQuery(nodeType: string) {
  return queryOptions({
    queryKey: ["node-count-by-node-type", nodeType],
    queryFn: ({ signal, meta }) => {
      const explorer = getExplorer(meta);
      return explorer.fetchVertexCountsByType(
        {
          label: nodeType,
        },
        { signal }
      );
    },
  });
}
