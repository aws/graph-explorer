import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelHeaderActions,
  PanelTitle,
  SidebarTabs,
  SidebarTabsContent,
  SidebarTabsList,
  SidebarTabsTrigger,
} from "@/components";
import CommonPrefixes from "./CommonPrefixes";
import GeneratedPrefixes from "./GeneratedPrefixes";
import UserPrefixes from "./UserPrefixes";
import { SidebarCloseButton } from "../SidebarCloseButton";

function Namespaces() {
  return (
    <Panel variant="sidebar">
      <PanelHeader>
        <PanelTitle>Namespaces</PanelTitle>

        <PanelHeaderActions>
          <SidebarCloseButton />
        </PanelHeaderActions>
      </PanelHeader>

      <PanelContent className="flex h-full flex-col overflow-hidden">
        <SidebarTabs defaultValue="auto">
          <SidebarTabsList>
            <SidebarTabsTrigger value="auto">Auto-Generated</SidebarTabsTrigger>
            <SidebarTabsTrigger value="custom">Custom</SidebarTabsTrigger>
            <SidebarTabsTrigger value="common">Common</SidebarTabsTrigger>
          </SidebarTabsList>
          <SidebarTabsContent value="auto">
            <GeneratedPrefixes />
          </SidebarTabsContent>
          <SidebarTabsContent value="custom">
            <UserPrefixes />
          </SidebarTabsContent>
          <SidebarTabsContent value="common">
            <CommonPrefixes />
          </SidebarTabsContent>
        </SidebarTabs>
      </PanelContent>
    </Panel>
  );
}

export default Namespaces;
