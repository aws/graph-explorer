import { FileButton } from "@mantine/core";
import { useRecoilValue } from "recoil";
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
  Dialog,
  DialogTrigger,
} from "@/components";
import {
  activeConfigurationAtom,
  configurationAtom,
} from "@/core/StateProvider/configuration";
import CreateConnection from "@/modules/CreateConnection";
import { useMemo } from "react";
import { cn } from "@/utils";
import { Virtuoso } from "react-virtuoso";
import { ConnectionRow } from "./ConnectionRow";
import { useImportConnectionFile } from "./useImportConnectionFile";

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
  const activeConnectionId = useRecoilValue(activeConfigurationAtom);
  const allConnections = useAllConnections();
  const importConnectionFile = useImportConnectionFile();

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Available connections</PanelTitle>
        <PanelHeaderActions>
          <FileButton
            onChange={payload => payload && importConnectionFile(payload)}
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
          <Dialog open={isModalOpen} onOpenChange={onModalChange}>
            <DialogTrigger asChild>
              <PanelHeaderActionButton
                label="Add New Connection"
                icon={<AddIcon />}
              />
            </DialogTrigger>

            <CreateConnection onClose={() => onModalChange(false)} />
          </Dialog>
        </PanelHeaderActions>
      </PanelHeader>

      <PanelContent>
        <Virtuoso
          data={allConnections}
          itemContent={(index, connection) => (
            <div
              className={cn(
                "px-3 py-1.5",
                index === 0 && "pt-3",
                index === allConnections.length - 1 && "pb-3"
              )}
            >
              <div
                key={connection.id}
                className="has-[:checked]:bg-background-secondary-subtle has-[:checked]:ring-primary-main group rounded-lg ring-1 ring-gray-200 has-[:checked]:ring-2"
              >
                <ConnectionRow
                  connection={connection}
                  isSelected={activeConnectionId === connection.id}
                  isDisabled={isSync}
                />
              </div>
            </div>
          )}
        />
      </PanelContent>
    </Panel>
  );
};

function useAllConnections() {
  const connectionMap = useRecoilValue(configurationAtom);
  return useMemo(() => connectionMap.values().toArray(), [connectionMap]);
}

export default AvailableConnections;
