import { useAtomValue } from "jotai";
import { RefreshCwIcon } from "lucide-react";

import { IconButton, Spinner } from "@/components";
import { nodesSelectedIdsAtom, edgesSelectedIdsAtom } from "@/core";
import { useRefreshEntities } from "@/hooks";

export function EntitiesRefreshButton() {
  const vertexIds = useAtomValue(nodesSelectedIdsAtom).values().toArray();
  const edgeIds = useAtomValue(edgesSelectedIdsAtom).values().toArray();

  const { refresh, isPending } = useRefreshEntities();

  // Hide when no entities are selected
  if (vertexIds.length + edgeIds.length === 0) {
    return null;
  }

  return (
    <IconButton
      onClick={() => refresh({ vertexIds, edgeIds })}
      tooltipText="Refresh"
      variant="text"
      isDisabled={isPending}
    >
      <Spinner loading={isPending}>
        <RefreshCwIcon />
      </Spinner>
    </IconButton>
  );
}
