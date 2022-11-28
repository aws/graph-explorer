import { useMemo, useState } from "react";
import {
  ModuleContainer,
  ModuleContainerHeader,
  ModuleContainerHeaderProps,
  Select,
} from "../../components";
import { useConfiguration } from "../../core";
import CommonPrefixes from "./CommonPrefixes";
import GeneratedPrefixes from "./GeneratedPrefixes";
import defaultStyles from "./Namespaces.style";
import UserPrefixes from "./UserPrefixes";

export type EdgesStylingProps = Omit<
  ModuleContainerHeaderProps,
  "title" | "sidebar"
>;

const Namespaces = (headerProps: EdgesStylingProps) => {
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
    <ModuleContainer variant={"sidebar"}>
      <ModuleContainerHeader title={"Namespaces"} {...headerProps}>
        <div style={{ marginLeft: 16 }}>
          <Select
            aria-label={"Namespace type"}
            options={nsOptions}
            value={nsType}
            onChange={v => setNsType(v as string)}
            hideError={true}
            noMargin={true}
            size={"sm"}
          />
        </div>
      </ModuleContainerHeader>
      <div className={defaultStyles()}>
        {nsType === "auto" && <GeneratedPrefixes />}
        {nsType === "custom" && <UserPrefixes />}
        {nsType === "common" && <CommonPrefixes />}
      </div>
    </ModuleContainer>
  );
};

export default Namespaces;
