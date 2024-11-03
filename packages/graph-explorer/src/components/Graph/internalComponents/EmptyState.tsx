import { SearchIcon } from "@/components/icons";
import { PanelEmptyState } from "@/components/PanelEmptyState";

const EmptyState = () => {
  return (
    <div className="pointer-events-none absolute inset-0 flex select-none flex-col items-center justify-center bg-gray-100/60 p-4">
      <PanelEmptyState
        icon={<SearchIcon />}
        title="To get started, click into the search bar to browse graph data. Click + to add to Graph View."
      />
    </div>
  );
};

export default EmptyState;
