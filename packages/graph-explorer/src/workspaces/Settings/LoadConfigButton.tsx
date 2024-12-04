import { cn } from "@/utils";
import { FileButton } from "@mantine/core";
import { useMutation, useQuery } from "@tanstack/react-query";
import localforage from "localforage";
import { useState, useRef, useCallback, useEffect } from "react";
import {
  UploadIcon,
  Paragraph,
  LoaderIcon,
  Button,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogIcon,
  AlertDialogTitle,
} from "@/components";
import {
  readBackupDataFromFile,
  restoreBackup,
} from "@/core/StateProvider/localDb";
import { useDebounceValue } from "@/hooks";
import { APP_NAME, RELOAD_URL } from "@/utils/constants";
import { CheckCircle2Icon, FileIcon, TriangleAlertIcon } from "lucide-react";
import {
  AlertDialogCancel,
  AlertDialogDescription,
} from "@radix-ui/react-alert-dialog";
import { VisuallyHidden } from "@react-aria/visually-hidden";

export default function LoadConfigButton() {
  const [file, setFile] = useState<File | null>(null);
  const resetRef = useRef<() => void>(null);
  const [openConfirmation, setOpenConfirmation] = useState(false);

  const backupFileQuery = useQuery({
    queryKey: ["backup", "file", file],
    queryFn: () => (file ? readBackupDataFromFile(file) : null),
    retry: false,
    staleTime: 0,
  });

  useEffect(() => {
    if (backupFileQuery.data) {
      setOpenConfirmation(true);
    }
  }, [backupFileQuery.data]);

  const resetState = useCallback(() => {
    setOpenConfirmation(false);
    setFile(null);
    resetRef.current?.();
  }, []);

  const load = useMutation({
    mutationFn: async () => {
      if (!backupFileQuery.data) {
        return;
      }
      await restoreBackup(backupFileQuery.data, localforage);
    },
    onSuccess: () => {
      resetState();
    },
    onError: () => {
      setOpenConfirmation(false);
    },
  });

  return (
    <>
      <FileButton
        resetRef={resetRef}
        onChange={file => {
          setFile(file);
          setOpenConfirmation(true);
        }}
        accept="application/json"
        disabled={load.isPending}
      >
        {props => (
          <Button icon={<UploadIcon />} {...props}>
            Load Configuration
          </Button>
        )}
      </FileButton>
      <AlertDialog open={openConfirmation} onOpenChange={setOpenConfirmation}>
        <ConfirmationModal
          fileName={file?.name}
          onCancel={resetState}
          onConfirm={load.mutate}
          isPending={load.isPending}
        />
      </AlertDialog>

      <ParseFailureModal
        error={backupFileQuery.error ?? load.error}
        onCancel={resetState}
        fileName={file?.name}
      />
      <SuccessModal success={load.isSuccess} />
    </>
  );
}

function ConfirmationModal({
  fileName,
  onCancel,
  onConfirm,
  isPending,
}: {
  fileName?: string;
  onCancel: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Replace {APP_NAME} Configuration</AlertDialogTitle>
        <VisuallyHidden>
          <AlertDialogDescription>
            Replace configuration data with contents of the chosen file
          </AlertDialogDescription>
        </VisuallyHidden>
      </AlertDialogHeader>
      <AlertDialogBody className="flex flex-row items-start">
        <div className="gap-5">
          <Paragraph>
            This action will replace all configuration data within {APP_NAME},
            including connections and custom styles, with the contents of the
            config file selected.
          </Paragraph>
          <FileNameWell fileName={fileName} />
          <Paragraph>
            <i>Any connected graph databases will be unaffected.</i>
          </Paragraph>
        </div>
      </AlertDialogBody>
      <AlertDialogFooter className="flex flex-row gap-2 self-end">
        <Button isDisabled={isPending} onPress={onCancel}>
          Cancel
        </Button>
        <Button
          variant="danger"
          onPress={onConfirm}
          isDisabled={isPending}
          className="relative transition-opacity"
        >
          <span className={cn(isPending && "opacity-0")}>
            Replace {APP_NAME} Configuration
          </span>
          <div
            className={cn(
              "absolute inset-auto opacity-0",
              isPending && "opacity-100"
            )}
          >
            <LoaderIcon className="animate-spin" />
          </div>
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
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
  const displayFileName = fileName ?? debouncedFileName ?? "No file selected";

  if (!error) {
    return null;
  }

  return (
    <AlertDialog
      defaultOpen
      onOpenChange={open => {
        if (!open) {
          onCancel();
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Failed To Parse Config</AlertDialogTitle>
          <VisuallyHidden>
            <AlertDialogDescription>
              Failed to parse the contents of the config file {displayFileName}
            </AlertDialogDescription>
          </VisuallyHidden>
        </AlertDialogHeader>
        <AlertDialogBody className="flex flex-row items-start">
          <AlertDialogIcon className="text-warning-main pt-3">
            <TriangleAlertIcon />
          </AlertDialogIcon>
          <div className="flex grow flex-col">
            <Paragraph>
              Could not parse the contents of the config file provided. Perhaps
              the file is not a config file from {APP_NAME} or the file is
              corrupted.
            </Paragraph>
            <FileNameWell fileName={fileName} />
          </div>
        </AlertDialogBody>
        <AlertDialogFooter className="sm:justify-end">
          <AlertDialogCancel asChild>
            <Button variant="filled" onPress={onCancel} className="self-end">
              Close
            </Button>
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function SuccessModal({ success }: { success: boolean }) {
  if (!success) {
    return null;
  }

  return (
    <AlertDialog defaultOpen>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Restore Successful</AlertDialogTitle>
          <VisuallyHidden>
            <AlertDialogDescription>
              Successfully restored configuration from backup
            </AlertDialogDescription>
          </VisuallyHidden>
        </AlertDialogHeader>
        <AlertDialogBody className="flex flex-row items-center">
          <AlertDialogIcon className="text-success-main">
            <CheckCircle2Icon />
          </AlertDialogIcon>
          <Paragraph className="w-full min-w-0 p-2">
            All data was restored successfully. Please reload {APP_NAME} to
            complete the process.
          </Paragraph>
        </AlertDialogBody>
        <AlertDialogFooter className="sm:justify-end">
          {/* Force a full reload of the app in the browser */}
          <a href={RELOAD_URL}>
            <Button variant="filled">Reload {APP_NAME}</Button>
          </a>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function FileNameWell({ fileName }: { fileName?: string }) {
  // Used to ensure the file name does not disappear while the modal is animating out
  const debouncedFileName = useDebounceValue(fileName, 200);
  const displayFileName = fileName ?? debouncedFileName ?? "No file selected";
  return (
    <div className="bg-background-contrast/75 my-4 flex items-center gap-1.5 rounded-lg px-5 py-3">
      <FileIcon className="size-6" />
      <b>{displayFileName}</b>
    </div>
  );
}
