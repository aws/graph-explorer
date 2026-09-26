import { useMaybeActiveSchema } from "@/core";

import { edgeConnectionNotice } from "./edgeConnectionNotice";
import { useSchemaSync } from "./useSchemaSync";

/**
 * Resolves the edge connection notice for the active schema, sharing one
 * source of truth across the toolbar button, the sidebar details, and the
 * connection detail panel.
 */
export function useEdgeConnectionNotice() {
  const schema = useMaybeActiveSchema();
  const { edgeDiscoveryQuery } = useSchemaSync();

  const notice = schema
    ? edgeConnectionNotice(schema, edgeDiscoveryQuery.error)
    : null;

  return { notice, edgeDiscoveryQuery };
}
