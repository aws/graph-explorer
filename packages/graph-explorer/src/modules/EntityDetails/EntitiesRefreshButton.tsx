import { useAtomValue } from "jotai";
import { RefreshCwIcon } from "lucide-react";

import { Button, Spinner } from "@/components";
import { edgesSelectedIdsAtom, nodesSelectedIdsAtom } from "@/core";
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
    <Button
      onClick={() => refresh({ vertexIds, edgeIds })}
      title="Refresh"
      variant="text"
      size="icon"
      disabled={isPending}
    >
      <Spinner loading={isPending}>
        <RefreshCwIcon />
      </Spinner>
    </Button>
  );
}
