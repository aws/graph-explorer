import { useMutation, useQuery } from "@tanstack/react-query";
import localforage from "localforage";
import { useState, useRef } from "react";
import {
  ErrorIcon,
  Paragraph,
  Button,
  CheckIcon,
  FileButton,
  FileButtonHandle,
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Spinner,
} from "@/components";
import {
  readBackupDataFromFile,
  restoreBackup,
  type SerializedBackup,
} from "@/core/StateProvider/localDb";
import { useDebounceValue } from "@/hooks";
import { APP_NAME, RELOAD_URL } from "@/utils/constants";
import { FolderOpenIcon } from "lucide-react";

export default function LoadConfigButton() {
  const [file, setFile] = useState<File | null>(null);
  const resetRef = useRef<FileButtonHandle | null>(null);

  const backupFileQuery = useQuery({
    queryKey: ["backup", "file", file],
    queryFn: () => (file ? readBackupDataFromFile(file) : null),
    retry: false,
    staleTime: 0,
  });

  const clearFile = () => {
    setFile(null);
    resetRef.current?.reset();
  };

  const load = useMutation({
    mutationFn: async () => {
      if (!backupFileQuery.data) {
        return;
      }
      await restoreBackup(backupFileQuery.data, localforage);
    },
    onSuccess: () => {
      clearFile();
    },
  });

  return (
    <>
      <FileButton
        resetRef={resetRef}
        onChange={file => setFile(file)}
        accept="application/json"
        disabled={load.isPending}
        asChild
      >
        <Button icon={<FolderOpenIcon />} className="min-w-28">
          Load
        </Button>
      </FileButton>
      <ConfirmationModal
        backupData={backupFileQuery.data}
        fileName={file?.name}
        onCancel={clearFile}
        onConfirm={load.mutate}
        isPending={load.isPending}
      />
      <ParseFailureModal
        error={backupFileQuery.error}
        onCancel={clearFile}
        fileName={file?.name}
      />
      <SuccessModal success={load.isSuccess} />
    </>
  );
}

function ConfirmationModal({
  backupData,
  fileName,
  onCancel,
  onConfirm,
  isPending,
}: {
  backupData: SerializedBackup | null | undefined;
  fileName?: string;
  onCancel: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  // Used to ensure the file name does not disappear while the modal is animating out
  const debouncedFileName = useDebounceValue(fileName, 200);

  return (
    <Dialog
      open={Boolean(backupData)}
      onOpenChange={open => !open && onCancel()}
    >
      <DialogContent className="w-[588px]">
        <DialogHeader>
          <DialogTitle>Replace {APP_NAME} Configuration</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="flex flex-row items-start gap-8">
            <div className="py-1">
              <ErrorIcon className="text-warning-main size-16" />
            </div>
            <div className="flex grow flex-col gap-8">
              <div>
                <Paragraph>
                  This action will replace all configuration data within{" "}
                  {APP_NAME}, including connections and custom styles, with the
                  contents of the config file selected.
                </Paragraph>
                <Paragraph className="my-4">
                  <b>{fileName ?? debouncedFileName ?? "No file selected"}</b>
                </Paragraph>
                <Paragraph>
                  <i>Any connected graph databases will be unaffected.</i>
                </Paragraph>
              </div>
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button isDisabled={isPending} onPress={onCancel}>
            Cancel
          </Button>
          <Button
            variant="filled"
            color="danger"
            onPress={onConfirm}
            isDisabled={isPending}
            className="relative transition-opacity"
          >
            <Spinner loading={isPending}>
              Replace {APP_NAME} Configuration
            </Spinner>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ParseFailureModal({
  error,
  fileName,
  onCancel,
}: {
  error: Error | null;
  fileName?: string;
  onCancel: () => void;
}) {
  // Used to ensure the file name does not disappear while the modal is animating out
  const debouncedFileName = useDebounceValue(fileName, 200);

  return (
    <Dialog open={Boolean(error)} onOpenChange={open => !open && onCancel()}>
      <DialogContent className="w-[588px]">
        <DialogHeader>
          <DialogTitle>Failed To Parse Config</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="flex flex-row items-start gap-8">
            <div className="py-1">
              <ErrorIcon className="text-warning-main size-16" />
            </div>
            <div>
              <Paragraph>
                Could not parse the contents of the config file provided.
                Perhaps the file is not a config file from {APP_NAME} or the
                file is corrupted.
              </Paragraph>
              <Paragraph>
                <b>{fileName ?? debouncedFileName ?? "No file selected"}</b>
              </Paragraph>
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button onPress={onCancel}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SuccessModal({ success }: { success: boolean }) {
  return (
    <Dialog open={success}>
      <DialogContent className="w-[588px]">
        <DialogHeader>
          <DialogTitle>Restore Successful</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="flex flex-row items-start gap-8">
            <div className="py-1">
              <CheckIcon className="text-success-main size-16" />
            </div>
            <Paragraph className="w-full min-w-0">
              All data was restored successfully. Please reload {APP_NAME}
              to complete the process.
            </Paragraph>
          </div>
        </DialogBody>
        <DialogFooter>
          {/* Force a full reload of the app in the browser */}
          <a href={RELOAD_URL}>
            <Button variant="filled">Reload {APP_NAME}</Button>
          </a>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
