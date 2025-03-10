import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelHeaderActions,
  PanelTitle,
} from "@/components";
import { FilterSearchTabContent } from "./FilterSearchTabContent";
import { SidebarCloseButton } from "../SidebarCloseButton";

export function SearchSidebarPanel() {
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
      <PanelContent {...props} />
    </Panel>
  );
}
