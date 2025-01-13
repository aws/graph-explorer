import { FileButton, Modal } from "@mantine/core";
import { useRecoilCallback, useRecoilValue } from "recoil";
import { v4 } from "uuid";
import {
  AddIcon,
  Chip,
  DatabaseIcon,
  PanelHeaderActionButton,
  PanelHeaderActions,
  PanelHeader,
  TrayArrowIcon,
  PanelTitle,
  PanelHeaderDivider,
  Panel,
  PanelContent,
  ListRow,
  ListRowSubtitle,
  ListRowTitle,
  ListRowContent,
} from "@/components";
import { useNotification } from "@/components/NotificationProvider";
import Switch from "@/components/Switch";
import { RawConfiguration } from "@/core";
import {
  activeConfigurationAtom,
  configurationAtom,
} from "@/core/StateProvider/configuration";
import { schemaAtom } from "@/core/StateProvider/schema";
import useResetState from "@/core/StateProvider/useResetState";
import useTranslations from "@/hooks/useTranslations";
import isValidConfigurationFile from "@/utils/isValidConfigurationFile";
import CreateConnection from "@/modules/CreateConnection";
import { fromFileToJson } from "@/utils/fileData";
import { Virtuoso } from "react-virtuoso";
import React from "react";

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
  const activeConfig = useRecoilValue(activeConfigurationAtom);
  const configuration = useRecoilValue(configurationAtom);
  const onConfigImport = useImportConfigFileCallback();

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Available connections</PanelTitle>
        <PanelHeaderActions>
          <FileButton
            onChange={payload => payload && onConfigImport(payload)}
            accept="application/json"
          >
            {props => (
              <PanelHeaderActionButton
                label="Import Connection"
                isDisabled={isSync}
                onActionClick={props.onClick}
                icon={<TrayArrowIcon style={{ transform: "rotate(180deg)" }} />}
              />
            )}
          </FileButton>
          <PanelHeaderDivider />
          <PanelHeaderActionButton
            label="Add New Connection"
            icon={<AddIcon />}
            onActionClick={() => onModalChange(true)}
          />
        </PanelHeaderActions>
      </PanelHeader>

      <PanelContent className="py-1.5">
        <Virtuoso
          data={[...configuration.values()]}
          itemContent={(_index, config) => (
            <ConfigRow
              config={config}
              isSelected={activeConfig === config.id}
              isDisabled={isSync}
            />
          )}
        />
        <Modal
          centered={true}
          title="Add New Connection"
          opened={isModalOpen}
          onClose={() => onModalChange(false)}
        >
          <CreateConnection onClose={() => onModalChange(false)} />
        </Modal>
      </PanelContent>
    </Panel>
  );
};

const ConfigRow = React.memo(
  ({
    config,
    isSelected,
    isDisabled,
  }: {
    config: RawConfiguration;
    isSelected: boolean;
    isDisabled: boolean;
  }) => {
    const t = useTranslations();
    const setActiveConfig = useSetActiveConfigCallback(config.id);

    return (
      <div className="px-3 py-1.5">
        <ListRow
          isDisabled={isDisabled}
          onClick={setActiveConfig}
          className="hover:cursor-pointer"
        >
          <DatabaseIcon className="text-primary-main size-6 shrink-0" />
          <ListRowContent>
            <ListRowTitle>{config.displayLabel || config.id}</ListRowTitle>
            {config.connection ? (
              <ListRowSubtitle>{config.connection.url}</ListRowSubtitle>
            ) : null}
          </ListRowContent>
          <div className="flex items-center gap-2">
            <Chip variant="info">
              {t(
                "available-connections.graph-type",
                config.connection?.queryEngine || "gremlin"
              )}
            </Chip>
            <Switch
              className="item-switch"
              labelPosition="left"
              isSelected={isSelected}
              onChange={setActiveConfig}
              isDisabled={isDisabled}
            >
              {isSelected ? "Active" : "Inactive"}
            </Switch>
          </div>
        </ListRow>
      </div>
    );
  }
);

function useSetActiveConfigCallback(configId: string) {
  const resetState = useResetState();
  return useRecoilCallback(
    ({ set }) =>
      () => {
        set(activeConfigurationAtom, configId);
        resetState();
      },
    [configId, resetState]
  );
}

function useImportConfigFileCallback() {
  const resetState = useResetState();
  const { enqueueNotification } = useNotification();
  return useRecoilCallback(
    ({ set }) =>
      async (file: File) => {
        const fileContent = await fromFileToJson(file);

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
}

export default AvailableConnections;
