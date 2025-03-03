import { FileButton, Modal } from "@mantine/core";
import { useRecoilCallback, useRecoilValue } from "recoil";
import {
  AddIcon,
  PanelHeaderActionButton,
  PanelHeaderActions,
  PanelHeader,
  TrayArrowIcon,
  PanelTitle,
  PanelHeaderDivider,
  Panel,
  PanelContent,
  ListRowSubtitle,
  ListRowTitle,
  ListRowContent,
} from "@/components";
import { useNotification } from "@/components/NotificationProvider";
import {
  ConfigurationId,
  createNewConfigurationId,
  RawConfiguration,
} from "@/core";
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
import React, { useMemo } from "react";
import { DatabaseIcon } from "lucide-react";
import { cn } from "@/utils";
import { Virtuoso } from "react-virtuoso";

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
  const allConfigurations = useAllConfigurations();
  const onConfigImport = useImportConfigFileCallback();

  return (
    <Panel>
      <PanelHeader className="">
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

      <PanelContent>
        <Virtuoso
          data={allConfigurations}
          itemContent={(_index, config) => (
            <div
              className={cn(
                "px-3 py-1.5",
                _index === 0 && "pt-3",
                _index === allConfigurations.length - 1 && "pb-3"
              )}
            >
              <div
                key={config.id}
                className="has-[:checked]:bg-background-secondary-subtle has-[:checked]:ring-primary-main group rounded-lg ring-1 ring-gray-200 has-[:checked]:ring-2"
              >
                <ConfigRow
                  config={config}
                  isSelected={activeConfig === config.id}
                  isDisabled={isSync}
                />
              </div>
            </div>
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

    const dbUrl = config.connection
      ? config.connection.proxyConnection
        ? config.connection.graphDbUrl
        : config.connection.url
      : null;

    const graphType = t(
      "available-connections.graph-type",
      config.connection?.queryEngine || "gremlin"
    );

    return (
      <div
        onClick={setActiveConfig}
        className="flex flex-row items-center gap-4 px-6 py-4 hover:cursor-pointer"
      >
        <DatabaseIcon className="text-primary-main @md:block hidden size-8 shrink-0" />
        <ListRowContent>
          <ListRowTitle className="inline-flex items-center gap-1">
            {config.displayLabel || config.id}
          </ListRowTitle>
          <ListRowSubtitle>
            <span className="">{graphType}</span>
            {dbUrl ? <span> &bull; {dbUrl}</span> : null}
          </ListRowSubtitle>
        </ListRowContent>
        <RadioButton
          checked={isSelected}
          onChange={setActiveConfig}
          disabled={isDisabled}
          className="hidden"
        />
      </div>
    );
  }
);

function RadioButton({
  className,
  ...props
}: Omit<React.ComponentPropsWithoutRef<"input">, "type">) {
  return (
    <input
      type="radio"
      className={cn(
        "accent-primary-main bg-primary-main size-5 shrink-0",
        className
      )}
      {...props}
    />
  );
}

function useAllConfigurations() {
  const configMap = useRecoilValue(configurationAtom);
  return useMemo(() => configMap.values().toArray(), [configMap]);
}

function useSetActiveConfigCallback(configId: ConfigurationId) {
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
        const newId = createNewConfigurationId();
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
