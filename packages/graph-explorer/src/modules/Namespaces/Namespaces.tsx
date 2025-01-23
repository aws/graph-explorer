import { useMemo, useState } from "react";
import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelHeaderActions,
  PanelHeaderDivider,
  PanelTitle,
  Select,
} from "@/components";
import { useConfiguration } from "@/core";
import CommonPrefixes from "./CommonPrefixes";
import GeneratedPrefixes from "./GeneratedPrefixes";
import UserPrefixes from "./UserPrefixes";
import { SidebarCloseButton } from "../SidebarCloseButton";

function Namespaces() {
  const config = useConfiguration();
  const [nsType, setNsType] = useState("auto");

  const nsOptions = useMemo(() => {
    const totalCustom =
      config?.schema?.prefixes?.filter(
        prefixConfig => prefixConfig.__inferred !== true
      ).length || 0;

    const totalAuto =
      config?.schema?.prefixes?.filter(
        prefixConfig => prefixConfig.__inferred === true
      ).length || 0;

    return [
      { label: `Auto-Generated (${totalAuto})`, value: "auto" },
      { label: `Custom (${totalCustom})`, value: "custom" },
      { label: "Common", value: "common" },
    ];
  }, [config?.schema?.prefixes]);

  return (
    <Panel variant="sidebar">
      <PanelHeader>
        <PanelTitle>Namespaces</PanelTitle>

        <PanelHeaderActions>
          <Select
            aria-label="Namespace type"
            options={nsOptions}
            value={nsType}
            onChange={v => setNsType(v as string)}
            hideError={true}
            noMargin={true}
            size="sm"
          />
          <PanelHeaderDivider />
          <SidebarCloseButton />
        </PanelHeaderActions>
      </PanelHeader>

      <PanelContent className="flex h-full flex-col">
        {nsType === "auto" && <GeneratedPrefixes />}
        {nsType === "custom" && <UserPrefixes />}
        {nsType === "common" && <CommonPrefixes />}
      </PanelContent>
    </Panel>
  );
}

export default Namespaces;
