import { Button } from "@/components";
import { SearchIcon } from "@/components/icons";
import { PanelEmptyState } from "@/components/PanelEmptyState";
import {
  GraphSessionStorageModel,
  useAvailablePreviousSession,
  useRestoreGraphSession,
} from "@/core";
import { formatEntityCounts } from "@/utils";
import { PlusCircleIcon, RotateCwIcon } from "lucide-react";

function EmptyState() {
  const availablePrevSession = useAvailablePreviousSession();

  if (availablePrevSession) {
    return (
      <RestorePreviousSessionEmptyState prevSession={availablePrevSession} />
    );
  }
  return <DefaultEmptyState />;
}

function RestorePreviousSessionEmptyState({
  prevSession,
}: {
  prevSession: GraphSessionStorageModel;
}) {
  const restore = useRestoreGraphSession();

  const entityCounts = formatEntityCounts(
    prevSession.vertices.size,
    prevSession.edges.size
  );

  return (
    <div className="z-panes absolute inset-0 flex flex-col items-center justify-center p-4">
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

function DefaultEmptyState() {
  return (
    <div className="pointer-events-none absolute inset-0 flex select-none flex-col items-center justify-center p-4">
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

export default EmptyState;
