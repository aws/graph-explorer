import { useAtom } from "jotai";
import { atomWithReset } from "jotai/utils";
import { CodeIcon, ListFilterIcon } from "lucide-react";

import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelHeaderActions,
  PanelTitle,
} from "@/components";
import {
  SidebarTabs,
  SidebarTabsContent,
  SidebarTabsList,
  SidebarTabsTrigger,
} from "@/components/SidebarTabs";
import { cn } from "@/utils";

import { SidebarCloseButton } from "../SidebarCloseButton";
import { FilterSearchTabContent } from "./FilterSearchTabContent";
import { QuerySearchTabContent } from "./QuerySearchTabContent";

export const selectedTabAtom = atomWithReset("filter");

export function SearchSidebarPanel() {
  const [selectedTab, setSelectedTab] = useAtom(selectedTabAtom);

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
