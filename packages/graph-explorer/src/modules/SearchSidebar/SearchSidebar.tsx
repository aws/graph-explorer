import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelHeaderActions,
  PanelTitle,
} from "@/components";
import { FilterSearchTabContent } from "./FilterSearchTabContent";
import { SidebarCloseButton } from "../SidebarCloseButton";
import { cn } from "@/utils";

export function SearchSidebarPanel() {
  return (
    <Layout className="overflow-y-auto">
      <FilterSearchTabContent />
    </Layout>
  );
}

function Layout({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  return (
    <Panel variant="sidebar">
      <PanelHeader>
        <PanelTitle>Search</PanelTitle>
        <PanelHeaderActions>
          <SidebarCloseButton />
        </PanelHeaderActions>
      </PanelHeader>
      <PanelContent
        className={cn("flex h-full flex-col overflow-hidden", className)}
        {...props}
      />
    </Panel>
  );
}
