import { useAtomValue } from "jotai";
import { Virtuoso } from "react-virtuoso";

import {
  AddIcon,
  Button,
  FileButton,
  Panel,
  PanelContent,
  PanelHeader,
  PanelHeaderActions,
  PanelHeaderDivider,
  PanelTitle,
  TrayArrowIcon,
} from "@/components";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/Dialog";
import { activeConfigurationAtom, configurationAtom } from "@/core";
import CreateConnection from "@/modules/CreateConnection";
import { cn } from "@/utils";

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
  const activeConnectionId = useAtomValue(activeConfigurationAtom);
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
            asChild
          >
            <Button
              tooltip="Import Connection"
              variant="ghost"
              size="icon"
              disabled={isSync}
            >
              <TrayArrowIcon style={{ transform: "rotate(180deg)" }} />
            </Button>
          </FileButton>
          <PanelHeaderDivider />
          <Button
            tooltip="Add New Connection"
            variant="ghost"
            size="icon"
            onClick={() => onModalChange(true)}
          >
            <AddIcon />
          </Button>
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
                index === allConnections.length - 1 && "pb-3",
              )}
            >
              <div
                key={connection.id}
                className="has-[:checked]:bg-secondary-subtle group has-[:checked]:ring-primary-main rounded-lg ring-1 ring-gray-200 has-[:checked]:ring-2"
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
        <Dialog open={isModalOpen} onOpenChange={onModalChange}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Connection</DialogTitle>
              <DialogDescription>
                Enter the details of the new connection.
              </DialogDescription>
            </DialogHeader>
            <DialogBody>
              <CreateConnection onClose={() => onModalChange(false)} />
            </DialogBody>
          </DialogContent>
        </Dialog>
      </PanelContent>
    </Panel>
  );
};

function useAllConnections() {
  const connectionMap = useAtomValue(configurationAtom);
  return connectionMap.values().toArray();
}

export default AvailableConnections;
