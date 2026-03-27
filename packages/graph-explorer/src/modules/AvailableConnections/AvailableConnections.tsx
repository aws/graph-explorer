import { useAtomValue } from "jotai";
import { DatabaseIcon } from "lucide-react";
import { useState } from "react";
import { Virtuoso } from "react-virtuoso";

import {
  AddIcon,
  Button,
  EmptyState,
  EmptyStateActions,
  EmptyStateContent,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
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
  DialogTrigger,
} from "@/components/Dialog";
import { activeConfigurationAtom, configurationAtom } from "@/core";
import CreateConnection from "@/modules/CreateConnection";
import { cn } from "@/utils";

import { ConnectionRow } from "./ConnectionRow";
import { useImportConnectionFile } from "./useImportConnectionFile";

export type AvailableConnectionsProps = {
  isSync: boolean;
};

const AvailableConnections = ({ isSync }: AvailableConnectionsProps) => {
  const activeConnectionId = useAtomValue(activeConfigurationAtom);
  const allConnections = useAllConnections();
  const importConnectionFile = useImportConnectionFile();
  const [isDialogOpen, setDialogOpen] = useState(false);

  return (
    <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
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
            <DialogTrigger asChild>
              <Button tooltip="Add New Connection" variant="ghost" size="icon">
                <AddIcon />
              </Button>
            </DialogTrigger>
          </PanelHeaderActions>
        </PanelHeader>

        <PanelContent>
          {allConnections.length === 0 ? (
            <EmptyState>
              <EmptyStateIcon>
                <DatabaseIcon />
              </EmptyStateIcon>
              <EmptyStateContent>
                <EmptyStateTitle>No Connections</EmptyStateTitle>
                <EmptyStateDescription>
                  Get started by adding or importing a connection.
                </EmptyStateDescription>
                <EmptyStateActions>
                  <DialogTrigger asChild>
                    <Button variant="primary">Add New Connection</Button>
                  </DialogTrigger>
                  <FileButton
                    onChange={payload =>
                      payload && importConnectionFile(payload)
                    }
                    accept="application/json"
                    asChild
                  >
                    <Button>Import Connection</Button>
                  </FileButton>
                </EmptyStateActions>
              </EmptyStateContent>
            </EmptyState>
          ) : (
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
          )}
        </PanelContent>
      </Panel>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Connection</DialogTitle>
          <DialogDescription>
            Enter the details of the new connection.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <CreateConnection onClose={() => setDialogOpen(false)} />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};

function useAllConnections() {
  const connectionMap = useAtomValue(configurationAtom);
  return connectionMap.values().toArray();
}

export default AvailableConnections;
