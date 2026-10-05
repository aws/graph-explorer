import { useAtomValue } from "jotai";
import { DatabaseIcon } from "lucide-react";
import { useId, useState } from "react";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/Dialog";
import { useImportConnectionFile } from "@/connections";
import { activeConfigurationAtom, configurationAtom } from "@/core";
import {
  ConnectionForm,
  createNewConnectionForm,
  useCreateConnection,
} from "@/modules/ConnectionForm";
import { cn } from "@/utils";

import { ConnectionRow } from "./ConnectionRow";

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
                    className="has-[:checked]:bg-primary-subtle group has-[:checked]:ring-primary ring-border rounded-lg ring-1 has-[:checked]:ring-2"
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
        <AddConnectionDialogBody onClose={() => setDialogOpen(false)} />
      </DialogContent>
    </Dialog>
  );
};

function AddConnectionDialogBody({ onClose }: { onClose: () => void }) {
  const formId = useId();
  const createConnection = useCreateConnection();
  const [initialValues] = useState(() => createNewConnectionForm(new Date()));

  return (
    <>
      <DialogBody>
        <ConnectionForm
          id={formId}
          initialValues={initialValues}
          onSubmit={values => {
            createConnection(values);
            onClose();
          }}
        />
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" form={formId}>
          Add Connection
        </Button>
      </DialogFooter>
    </>
  );
}

function useAllConnections() {
  const connectionMap = useAtomValue(configurationAtom);
  return Array.from(connectionMap.values());
}

export default AvailableConnections;
