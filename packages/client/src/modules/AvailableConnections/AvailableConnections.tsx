import { Modal } from "@mantine/core";
import { useCallback, useMemo } from "react";
import { useRecoilCallback, useRecoilValue } from "recoil";
import {
  AddIcon,
  AdvancedList,
  AdvancedListItemType,
  Chip,
  DatabaseIcon,
  ModuleContainer,
  ModuleContainerHeader,
} from "../../components";
import Switch from "../../components/Switch";
import { useWithTheme, withClassNamePrefix } from "../../core";
import {
  activeConfigurationAtom,
  configurationAtom,
} from "../../core/StateProvider/configuration";
import useResetState from "../../core/StateProvider/useResetState";
import CreateConnection from "../CreateConnection";
import defaultStyles from "./AvailableConnections.styles";

export type ConnectionDetailProps = {
  isSync: boolean;
  isModalOpen: boolean;
  onModalChange(isOpen: boolean): void;
};

const HEADER_ACTIONS = (isSync: boolean) => [
  {
    label: "Add New Connection",
    value: "create",
    icon: <AddIcon />,
    isDisabled: isSync,
  },
];

const AvailableConnections = ({
  isSync,
  isModalOpen,
  onModalChange,
}: ConnectionDetailProps) => {
  const styleWithTheme = useWithTheme();
  const pfx = withClassNamePrefix("ft");

  const activeConfig = useRecoilValue(activeConfigurationAtom);
  const configuration = useRecoilValue(configurationAtom);

  const resetState = useResetState();
  const onActiveConfigChange = useRecoilCallback(
    ({ set }) => (value: string | string[]) => {
      set(activeConfigurationAtom, value as string);
      resetState();
    },
    [resetState]
  );

  const onActionClick = useCallback(
    (value: string) => {
      if (value === "create") {
        return onModalChange(true);
      }
    },
    [onModalChange]
  );

  const connectionItems = useMemo(() => {
    const items: AdvancedListItemType<any>[] = [];
    configuration.forEach(config => {
      items.push({
        id: config.id,
        title: config.displayLabel || config.id,
        subtitle: config.connection?.url,
        icon: <DatabaseIcon />,
        endAdornment: (
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <Chip size={"sm"} variant={"info"}>
              {(config.connection?.queryEngine || "gremlin").toUpperCase()}
            </Chip>
            <div className={pfx("v-divider")} />
            <Switch
              className={pfx("item-switch")}
              labelPosition={"left"}
              isSelected={activeConfig === config.id}
              onChange={() => onActiveConfigChange(config.id)}
              isDisabled={isSync}
            >
              {activeConfig === config.id ? "Active" : "Inactive"}
            </Switch>
          </div>
        ),
      });
    });

    return items;
  }, [activeConfig, configuration, isSync, onActiveConfigChange, pfx]);

  return (
    <ModuleContainer className={styleWithTheme(defaultStyles("ft"))}>
      <ModuleContainerHeader
        title={"Available connections"}
        actions={HEADER_ACTIONS(isSync)}
        onActionClick={onActionClick}
      />

      <AdvancedList
        className={pfx("advanced-list")}
        items={connectionItems}
        selectedItemsIds={[activeConfig || ""]}
      />
      <Modal
        centered={true}
        title={"Add New Connection"}
        opened={isModalOpen}
        onClose={() => onModalChange(false)}
      >
        <CreateConnection onClose={() => onModalChange(false)} />
      </Modal>
    </ModuleContainer>
  );
};

export default AvailableConnections;
