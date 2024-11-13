import { useMemo, useState } from "react";
import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelHeaderActions,
  PanelHeaderCloseButton,
  PanelHeaderCloseButtonProps,
  PanelHeaderDivider,
  PanelTitle,
  Select,
} from "@/components";
import { useConfiguration } from "@/core";
import CommonPrefixes from "./CommonPrefixes";
import GeneratedPrefixes from "./GeneratedPrefixes";
import defaultStyles from "./Namespaces.style";
import UserPrefixes from "./UserPrefixes";

export type EdgesStylingProps = Pick<PanelHeaderCloseButtonProps, "onClose">;

const Namespaces = ({ onClose }: EdgesStylingProps) => {
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
          {onClose ? (
            <>
              <PanelHeaderDivider />
              <PanelHeaderCloseButton onClose={onClose} />
            </>
          ) : null}
        </PanelHeaderActions>
      </PanelHeader>

      <PanelContent className={defaultStyles()}>
        {nsType === "auto" && <GeneratedPrefixes />}
        {nsType === "custom" && <UserPrefixes />}
        {nsType === "common" && <CommonPrefixes />}
      </PanelContent>
    </Panel>
  );
};

export default Namespaces;
