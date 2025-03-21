import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelHeaderActions,
  PanelTitle,
} from "@/components";
import { FilterSearchTabContent } from "./FilterSearchTabContent";
import { SidebarCloseButton } from "../SidebarCloseButton";
import { useFeatureFlags, useQueryEngine } from "@/core";
import {
  SidebarTabs,
  SidebarTabsContent,
  SidebarTabsList,
  SidebarTabsTrigger,
} from "@/components/SidebarTabs";
import { QuerySearchTabContent } from "./QuerySearchTabContent";
import { CodeIcon, ListFilterIcon } from "lucide-react";
import { atom, useRecoilState } from "recoil";
import { cn } from "@/utils";

export const selectedTabAtom = atom({
  key: "search-sidebar-selected-tab",
  default: "filter",
});

export function SearchSidebarPanel() {
  const queryEngine = useQueryEngine();
  const featureFlags = useFeatureFlags();
  const [selectedTab, setSelectedTab] = useRecoilState(selectedTabAtom);

  // Hide tabs when not gremlin or the query editor feature is turned off
  if (queryEngine !== "gremlin" || !featureFlags.showQueryEditor) {
    return (
      <Layout className="overflow-y-auto">
        <FilterSearchTabContent />
      </Layout>
    );
  }

  return (
    <Layout>
      <SidebarTabs defaultValue={selectedTab} onValueChange={setSelectedTab}>
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
