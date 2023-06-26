import { FileButton, Modal } from "@mantine/core";
import { useCallback, useMemo } from "react";
import { useRecoilCallback, useRecoilValue } from "recoil";
import { v4 } from "uuid";
import {
  AddIcon,
  AdvancedList,
  AdvancedListItemType,
  Chip,
  DatabaseIcon,
  ModuleContainer,
  ModuleContainerHeader,
  TrayArrowIcon,
} from "../../components";
import { useNotification } from "../../components/NotificationProvider";
import Switch from "../../components/Switch";
import { useWithTheme, withClassNamePrefix } from "../../core";
import {
  activeConfigurationAtom,
  configurationAtom,
} from "../../core/StateProvider/configuration";
import { schemaAtom } from "../../core/StateProvider/schema";
import useResetState from "../../core/StateProvider/useResetState";
import useTranslations from "../../hooks/useTranslations";
import isValidConfigurationFile from "../../utils/isValidConfigurationFile";
import CreateConnection from "../CreateConnection";
import defaultStyles from "./AvailableConnections.styles";

export type ConnectionDetailProps = {
  isSync: boolean;
  isModalOpen: boolean;
  onModalChange(isOpen: boolean): void;
};

const AvailableConnections = ({
  isSync,
  isModalOpen,
  onModalChange,
}: ConnectionDetailProps) => {
  const styleWithTheme = useWithTheme();
  const pfx = withClassNamePrefix("ft");

  const activeConfig = useRecoilValue(activeConfigurationAtom);
  const configuration = useRecoilValue(configurationAtom);
  const t = useTranslations();

  const resetState = useResetState();
  const onActiveConfigChange = useRecoilCallback(
    ({ set }) => (value: string | string[]) => {
      set(activeConfigurationAtom, value as string);
      resetState();
    },
    [resetState]
  );

  const { enqueueNotification } = useNotification();
  const onConfigImport = useRecoilCallback(
    ({ set }) => async (file: File) => {
      const fileContent = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = () =>
          resolve(JSON.parse(reader.result?.toString() || ""));
        reader.onerror = e => reject(e);
      });

      if (!isValidConfigurationFile(fileContent)) {
        enqueueNotification({
          title: "Invalid File",
          message: "The connection file is not valid",
          type: "error",
          stackable: true,
        });
        return;
      }

      // Create new id to avoid collisions
      const newId = v4();
      set(configurationAtom, prevConfig => {
        const updatedConfig = new Map(prevConfig);
        updatedConfig.set(newId, {
          id: newId,
          displayLabel: fileContent.displayLabel,
          connection: fileContent.connection,
        });
        return updatedConfig;
      });
      set(schemaAtom, prevSchema => {
        const updatedSchema = new Map(prevSchema);
        updatedSchema.set(newId, {
          vertices: fileContent.schema?.vertices || [],
          edges: fileContent.schema?.edges || [],
          prefixes: fileContent.schema?.prefixes?.map(prefix => ({
            ...prefix,
            __matches: new Set(prefix.__matches || []),
          })),
          lastUpdate: fileContent.schema?.lastUpdate
            ? new Date(fileContent.schema?.lastUpdate)
            : undefined,
        });
        return updatedSchema;
      });
      set(activeConfigurationAtom, newId);

      resetState();
      enqueueNotification({
        title: "File imported",
        message: "Connection file successfully imported",
        type: "success",
        stackable: true,
      });
    },
    [enqueueNotification, resetState]
  );

  const onActionClick = useCallback(
    (value: string) => {
      if (value === "create") {
        return onModalChange(true);
      }
    },
    [onModalChange]
  );

  const headerActions = useMemo(
    () => [
      {
        label: "Import Connection",
        value: "import",
        icon: (
          <FileButton onChange={onConfigImport} accept={"application/json"}>
            {props => (
              <TrayArrowIcon
                onClick={props.onClick}
                style={{ transform: "rotate(180deg)" }}
              />
            )}
          </FileButton>
        ),
        isDisabled: isSync,
      },
      "divider",
      {
        label: "Add New Connection",
        value: "create",
        icon: <AddIcon />,
        isDisabled: isSync,
      },
    ],
    [isSync, onConfigImport]
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
              {t(
                "available-connections.graph-type",
                config.connection?.queryEngine || "gremlin"
              )}
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
  }, [activeConfig, configuration, isSync, onActiveConfigChange, pfx, t]);

  return (
    <ModuleContainer className={styleWithTheme(defaultStyles("ft"))}>
      <ModuleContainerHeader
        title={"Available connections"}
        actions={headerActions}
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


// let's test AvailableConnections 

describe("AvailableConnections", () => {
  it("should render", () => {
    const { getByTestId } = render(<AvailableConnections />);
    expect(getByTestId("available-connections")).toBeInTheDocument();
  });
  it("should render AdvancedList", () => {
    const { getByTestId } = render(<AvailableConnections />);
    expect(getByTestId("advanced-list")).toBeInTheDocument();
  }
  it("should render Modal", () => {
    const { getByTestId } = render(<AvailableConnections />);
    expect(getByTestId("modal")).toBeInTheDocument();
  }
  it("should render ModuleContainerHeader", () => {
    const { getByTestId } = render(<AvailableConnections />);
    expect(getByTestId("module-container-header")).toBeInTheDocument();
  }
  it("should render ModuleContainer", () => {
    const { getByTestId } = render(<AvailableConnections />);
    expect(getByTestId("module-container")).toBeInTheDocument();
  }
  it("should render Switch", () => {
    const { getByTestId } = render(<AvailableConnections />);
    expect(getByTestId("switch")).toBeInTheDocument();
  }
  it("should render Chip", () => {
    const { getByTestId } = render(<AvailableConnections />);
    expect(getByTestId("chip")).toBeInTheDocument();
  }
  it("should render TrayArrowIcon", () => {
    const { getByTestId } = render(<AvailableConnections />);
    expect(getByTestId("tray-arrow-icon")).toBeInTheDocument();
  }
  it("should render AddIcon", () => {
    const { getByTestId } = render(<AvailableConnections />);
    expect(getByTestId("add-icon")).toBeInTheDocument();
  }
  it("should render DatabaseIcon", () => {
    const { getByTestId } = render(<AvailableConnections />);
    expect(getByTestId("database-icon")).toBeInTheDocument();
  }
  it("should render FileButton", () => {
    const { getByTestId } = render(<AvailableConnections />);
    expect(getByTestId("file-button")).toBeInTheDocument();
  }
  it("should render Divider", () => {
    const { getByTestId } = render(<AvailableConnections />);
    expect(getByTestId("divider")).toBeInTheDocument();
  }


});