import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelHeaderActions,
  PanelTitle,
} from "@/components";
import CommonPrefixes from "./CommonPrefixes";
import GeneratedPrefixes from "./GeneratedPrefixes";
import UserPrefixes from "./UserPrefixes";
import { SidebarCloseButton } from "../SidebarCloseButton";
import { Tabs, TabsContent, TabsTrigger } from "@/components/Tabs";
import { TabsList } from "@radix-ui/react-tabs";

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
        <Tabs defaultValue="auto" className="relative flex h-full flex-col">
          <TabsList className="flex w-full flex-row">
            <TabsTrigger value="auto" className="grow">
              Auto-Generated
            </TabsTrigger>
            <TabsTrigger value="custom" className="grow">
              Custom
            </TabsTrigger>
            <TabsTrigger value="common" className="grow">
              Common
            </TabsTrigger>
          </TabsList>
          <TabsContent value="auto" className="h-full grow">
            <GeneratedPrefixes />
          </TabsContent>
          <TabsContent value="custom" className="h-full grow">
            <UserPrefixes />
          </TabsContent>
          <TabsContent value="common" className="h-full grow">
            <CommonPrefixes />
          </TabsContent>
        </Tabs>
      </PanelContent>
    </Panel>
  );
}

export default Namespaces;
