import type { ComponentPropsWithRef } from "react";

import { PlusCircleIcon, RotateCwIcon } from "lucide-react";

import { Button } from "@/components";
import { SearchIcon } from "@/components/icons";
import { PanelEmptyState } from "@/components/PanelEmptyState";
import {
  type GraphSessionStorageModel,
  useAvailablePreviousSession,
  useRestoreGraphSession,
} from "@/core";
import { useFormattedEntityCounts } from "@/hooks/useEntityCountFormatter";
import { cn } from "@/utils";

export function GraphViewerEmptyState(props: ComponentPropsWithRef<"div">) {
  const availablePrevSession = useAvailablePreviousSession();

  if (availablePrevSession) {
    return (
      <RestorePreviousSessionEmptyState
        prevSession={availablePrevSession}
        {...props}
      />
    );
  }
  return <DefaultEmptyState {...props} />;
}

function RestorePreviousSessionEmptyState({
  prevSession,
  className,
  ...props
}: {
  prevSession: GraphSessionStorageModel;
} & ComponentPropsWithRef<"div">) {
  const restore = useRestoreGraphSession();

  const entityCounts = useFormattedEntityCounts(
    prevSession.vertices.size,
    prevSession.edges.size,
  );

  return (
    <div
      className={cn("flex flex-col items-center justify-center p-4", className)}
      {...props}
    >
      <PanelEmptyState
        icon={<SearchIcon />}
        title="Start a search or restore session"
        subtitle={`To get started, use the search sidebar panel to filter the graph data or restore your previous session (${entityCounts}).`}
      >
        <Button
          variant="filled"
          className="mt-4"
          onPress={() => {
            restore.mutate(prevSession);
          }}
          isDisabled={restore.isPending}
        >
          <RotateCwIcon />
          Restore Previous Session
        </Button>
      </PanelEmptyState>
    </div>
  );
}

function DefaultEmptyState({
  className,
  ...props
}: ComponentPropsWithRef<"div">) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center p-4", className)}
      {...props}
    >
      <PanelEmptyState
        icon={<SearchIcon />}
        title="Add nodes from search"
        subtitle={
          <div className="space-y-2">
            <div>
              To get started, use the search sidebar panel to filter the graph
              data.
            </div>
            <div>
              Click the <PlusCircleIcon className="-mt-1 inline size-4" /> to
              add the node to the Graph View.
            </div>
          </div>
        }
      />
    </div>
  );
}
