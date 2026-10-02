import { useAtomValue } from "jotai";
import { RefreshCwIcon } from "lucide-react";

import { Button, Spinner } from "@/components";
import { edgesSelectedIdsAtom, nodesSelectedIdsAtom } from "@/core";
import { useRefreshEntities } from "@/hooks";

export function EntitiesRefreshButton() {
  const vertexIds = Array.from(useAtomValue(nodesSelectedIdsAtom).values());
  const edgeIds = Array.from(useAtomValue(edgesSelectedIdsAtom).values());

  const { refresh, isPending } = useRefreshEntities();

  // Hide when no entities are selected
  if (vertexIds.length + edgeIds.length === 0) {
    return null;
  }

  return (
    <Button
      onClick={() => refresh({ vertexIds, edgeIds })}
      tooltip="Refresh"
      variant="ghost"
      size="icon-small"
      disabled={isPending}
    >
      <Spinner loading={isPending}>
        <RefreshCwIcon />
      </Spinner>
    </Button>
  );
}
