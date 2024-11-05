import {
  ModuleContainer,
  ModuleContainerContent,
  ModuleContainerHeader,
  ModuleContainerHeaderProps,
} from "@/components";
import { FilterSearchTabContent } from "./FilterSearchTabContent";

export type SearchSidebarPanelProps = Pick<
  ModuleContainerHeaderProps,
  "onClose"
>;

export function SearchSidebarPanel({ onClose }: SearchSidebarPanelProps) {
  return (
    <ModuleContainer variant="sidebar">
      <ModuleContainerHeader
        title="Search"
        variant="sidebar"
        onClose={onClose}
      />
      <ModuleContainerContent className="flex h-full grow flex-col">
        <FilterSearchTabContent />
      </ModuleContainerContent>
    </ModuleContainer>
  );
}
