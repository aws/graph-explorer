import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelHeaderActions,
  PanelHeaderCloseButton,
  PanelHeaderCloseButtonProps,
  PanelTitle,
} from "@/components";
import { FilterSearchTabContent } from "./FilterSearchTabContent";

export type SearchSidebarPanelProps = Pick<
  PanelHeaderCloseButtonProps,
  "onClose"
>;

export function SearchSidebarPanel({ onClose }: SearchSidebarPanelProps) {
  return (
    <Panel variant="sidebar">
      <PanelHeader>
        <PanelTitle>Search</PanelTitle>
        <PanelHeaderActions>
          <PanelHeaderCloseButton onClose={onClose} />
        </PanelHeaderActions>
      </PanelHeader>
      <PanelContent>
        <FilterSearchTabContent />
      </PanelContent>
    </Panel>
  );
}
