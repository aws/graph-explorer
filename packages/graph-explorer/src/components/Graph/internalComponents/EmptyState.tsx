import { SearchIcon } from "@/components/icons";
import { PanelEmptyState } from "@/components/PanelEmptyState";
import { PlusCircleIcon } from "lucide-react";

const EmptyState = () => {
  return (
    <div className="pointer-events-none absolute inset-0 flex select-none flex-col items-center justify-center bg-gray-100/60 p-4">
      <PanelEmptyState
        className=""
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
};

export default EmptyState;
