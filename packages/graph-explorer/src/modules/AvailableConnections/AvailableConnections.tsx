import { FileButton } from "@mantine/core";
import { useRecoilCallback, useRecoilValue } from "recoil";
import { v4 } from "uuid";
import {
  AddIcon,
  Chip,
  DatabaseIcon,
  Dialog,
  PanelHeaderActionButton,
  PanelHeaderActions,
  PanelHeader,
  TrayArrowIcon,
  PanelTitle,
  PanelHeaderDivider,
  Panel,
  PanelContent,
  DialogTrigger,
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

  const resetState = useResetState();
  const onActiveConfigChange = useRecoilCallback(
    ({ set }) =>
      (value: string | string[]) => {
        set(activeConfigurationAtom, value as string);
        resetState();
      },
    [resetState]
  );

  const { enqueueNotification } = useNotification();
  const onConfigImport = useRecoilCallback(
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

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Available connections</PanelTitle>
        <PanelHeaderActions>
          <FileButton
            onChange={payload => payload && onConfigImport(payload)}
            accept={"application/json"}
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
          <Dialog open={isModalOpen} onOpenChange={onModalChange}>
            <DialogTrigger asChild>
              <PanelHeaderActionButton
                label="Add New Connection"
                icon={<AddIcon />}
                onActionClick={() => {}}
              />
            </DialogTrigger>

            <CreateConnection onClose={() => onModalChange(false)} />
          </Dialog>
        </PanelHeaderActions>
      </PanelHeader>

      <PanelContent className="py-1.5">
        <Virtuoso
          data={[...configuration.values()]}
          itemContent={(_index, config) => (
            <div className="px-3 py-1.5">
              <ConfigRow
                config={config}
                isSelected={activeConfig === config.id}
                isDisabled={isSync}
                makeSelected={() => onActiveConfigChange(config.id)}
              />
            </div>
          )}
        />
      </PanelContent>
    </Panel>
  );
};

function ConfigRow({
  config,
  isSelected,
  isDisabled,
  makeSelected,
}: {
  config: RawConfiguration;
  isSelected: boolean;
  isDisabled: boolean;
  makeSelected: () => void;
}) {
  const t = useTranslations();

  return (
    <div
      className="bg-background-secondary hover:ring-primary-dark has-[:checked]:ring-primary-dark flex items-center gap-4 rounded-lg px-3 py-1.5 ring-1 ring-transparent transition-shadow duration-200 hover:cursor-pointer hover:ring-1"
      onClick={() => !isDisabled && makeSelected()}
    >
      <DatabaseIcon className="text-primary-main size-6 shrink-0" />
      <div className="grow">
        <div className="text-text-primary font-bold">
          {config.displayLabel || config.id}
        </div>
        {config.connection ? (
          <div className="text-text-secondary text-sm">
            {config.connection.url}
          </div>
        ) : null}
      </div>
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
          onChange={makeSelected}
          isDisabled={isDisabled}
        >
          {isSelected ? "Active" : "Inactive"}
        </Switch>
      </div>
    </div>
  );
}

export default AvailableConnections;
