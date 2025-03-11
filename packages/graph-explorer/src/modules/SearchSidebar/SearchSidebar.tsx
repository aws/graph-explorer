import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelHeaderActions,
  PanelTitle,
} from "@/components";
import { FilterSearchTabContent } from "./FilterSearchTabContent";
import { SidebarCloseButton } from "../SidebarCloseButton";
import { useQueryEngine } from "@/core";
import {
  SidebarTabs,
  SidebarTabsContent,
  SidebarTabsList,
  SidebarTabsTrigger,
} from "@/components/SidebarTabs";
import { QuerySearchTabContent } from "./QuerySearchTabContent";
import { CodeIcon, ListFilterIcon } from "lucide-react";

export function SearchSidebarPanel() {
  const queryEngine = useQueryEngine();

  if (queryEngine === "gremlin") {
    return (
      <Layout>
        <SidebarTabs defaultValue="filter">
          <SidebarTabsList>
            <SidebarTabsTrigger value="filter">
              <ListFilterIcon /> Filter
            </SidebarTabsTrigger>
            <SidebarTabsTrigger value="query">
              <CodeIcon />
              Query
            </SidebarTabsTrigger>
          </SidebarTabsList>
          <SidebarTabsContent value="filter">
            <FilterSearchTabContent />
          </SidebarTabsContent>
          <SidebarTabsContent value="query">
            <QuerySearchTabContent />
          </SidebarTabsContent>
        </SidebarTabs>
      </Layout>
    );
  }

  return (
    <Layout>
      <FilterSearchTabContent />
    </Layout>
  );
}

function Layout(props: React.ComponentPropsWithoutRef<"div">) {
  return (
    <Panel variant="sidebar">
      <PanelHeader>
        <PanelTitle>Search</PanelTitle>
        <PanelHeaderActions>
          <SidebarCloseButton />
        </PanelHeaderActions>
      </PanelHeader>
      <PanelContent
        className="flex h-full flex-col overflow-hidden"
        {...props}
      />
    </Panel>
  );
}
