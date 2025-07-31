import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogDescription,
} from "@/components/Dialog";
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
  FileButton,
} from "@/components";
import {
  activeConfigurationAtom,
  configurationAtom,
} from "@/core/StateProvider/configuration";
import CreateConnection from "@/modules/CreateConnection";
import { cn } from "@/utils";
import { Virtuoso } from "react-virtuoso";
import { ConnectionRow } from "./ConnectionRow";
import { useImportConnectionFile } from "./useImportConnectionFile";
import { useAtomValue } from "jotai";

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
            <PanelHeaderActionButton
              label="Import Connection"
              isDisabled={isSync}
              icon={<TrayArrowIcon style={{ transform: "rotate(180deg)" }} />}
            />
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
