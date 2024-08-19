import { cx } from "@emotion/css";
import { FileButton, Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useMutation, useQuery } from "@tanstack/react-query";
import localforage from "localforage";
import { useState, useRef } from "react";
import {
  UploadIcon,
  ErrorIcon,
  SectionTitle,
  Paragraph,
  LoaderIcon,
  Button,
  CheckIcon,
} from "../../components";
import {
  readBackupDataFromFile,
  restoreBackup,
  type SerializedBackup,
} from "../../core/StateProvider/localDb";
import { useDebounceValue } from "../../hooks";
import { env } from "../../utils";
import { APP_NAME } from "../../utils/constants";

export default function LoadConfigButton() {
  const [file, setFile] = useState<File | null>(null);
  const resetRef = useRef<() => void>(null);

  const backupFileQuery = useQuery({
    queryKey: ["backup", "file", file],
    queryFn: () => (file ? readBackupDataFromFile(file) : null),
    retry: false,
    staleTime: 0,
  });

  const clearFile = () => {
    setFile(null);
    resetRef.current?.();
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
      >
        {props => (
          <Button icon={<UploadIcon />} {...props}>
            Load Configuration
          </Button>
        )}
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
  const [_, { close }] = useDisclosure(Boolean(backupData));

  // Used to ensure the file name does not disappear while the modal is animating out
  const debouncedFileName = useDebounceValue(fileName, 200);

  const internalOnCancel = () => {
    onCancel();
    close();
  };

  return (
    <Modal
      opened={Boolean(backupData)}
      onClose={internalOnCancel}
      withCloseButton={false}
      size="lg"
      centered={true}
    >
      <div className="flex flex-row items-start gap-8 p-2">
        <div className="py-1">
          <ErrorIcon className="text-warning-main size-16" />
        </div>
        <div className="flex grow flex-col gap-8">
          <div>
            <SectionTitle>Replace {APP_NAME} Configuration</SectionTitle>
            <Paragraph>
              This action will replace all configuration data within {APP_NAME},
              including connections and custom styles, with the contents of the
              config file selected.
            </Paragraph>
            <Paragraph className="my-4">
              <b>{fileName ?? debouncedFileName ?? "No file selected"}</b>
            </Paragraph>
            <Paragraph>
              <i>Any connected graph databases will be unaffected.</i>
            </Paragraph>
          </div>
          <div className="flex flex-row gap-2 self-end">
            <Button
              size="large"
              isDisabled={isPending}
              onPress={internalOnCancel}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="large"
              onPress={onConfirm}
              isDisabled={isPending}
              className="relative transition-opacity"
            >
              <span className={cx(isPending && "opacity-0")}>
                Replace {APP_NAME} Configuration
              </span>
              <div
                className={cx(
                  "absolute inset-auto opacity-0",
                  isPending && "opacity-100"
                )}
              >
                <LoaderIcon className="animate-spin" />
              </div>
            </Button>
          </div>
        </div>
      </div>
    </Modal>
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
  const [_, { close }] = useDisclosure(Boolean(error));

  // Used to ensure the file name does not disappear while the modal is animating out
  const debouncedFileName = useDebounceValue(fileName, 200);

  const internalOnCancel = () => {
    close();
    onCancel();
  };

  return (
    <Modal
      opened={Boolean(error)}
      onClose={internalOnCancel}
      withCloseButton={false}
      size="lg"
      centered={true}
    >
      <div className="flex flex-row items-start gap-8 p-2">
        <div className="py-1">
          <ErrorIcon className="text-warning-main size-16" />
        </div>
        <div className="flex grow flex-col gap-8">
          <div>
            <SectionTitle>Failed To Parse Config</SectionTitle>
            <Paragraph>
              Could not parse the contents of the config file provided. Perhaps
              the file is not a config file from {APP_NAME} or the file is
              corrupted.
            </Paragraph>
            <Paragraph>
              <b>{fileName ?? debouncedFileName ?? "No file selected"}</b>
            </Paragraph>
          </div>
          <Button size="large" onPress={internalOnCancel} className="self-end">
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function SuccessModal({ success }: { success: boolean }) {
  const [_, { close }] = useDisclosure(success);

  return (
    <Modal
      opened={success}
      onClose={close}
      withCloseButton={false}
      closeOnClickOutside={false}
      closeOnEscape={false}
      size="lg"
      centered={true}
    >
      <div className="flex flex-row items-start gap-8 p-2">
        <div className="py-1">
          <CheckIcon className="text-success-main size-16" />
        </div>
        <div className="flex grow flex-col gap-8">
          <div>
            <SectionTitle>Restore Successful</SectionTitle>
            <Paragraph className="w-full min-w-0">
              All data was restored successfully. Please reload {APP_NAME}
              to complete the process.
            </Paragraph>
          </div>

          {/* Force a full reload of the app in the browser */}
          <a href={env.BASE_URL} className="self-end">
            <Button variant="filled" size="large">
              Reload {APP_NAME}
            </Button>
          </a>
        </div>
      </div>
    </Modal>
  );
}
