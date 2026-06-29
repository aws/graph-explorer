import { useAtomValue, useSetAtom } from "jotai";
import {
  DownloadIcon,
  SwatchBookIcon,
  Trash2Icon,
  TriangleAlertIcon,
  UploadIcon,
} from "lucide-react";
import { useRef, useState } from "react";

import type { ImportConflicts, ImportIssue } from "@/core/styling";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  Button,
  Group,
  GroupHeader,
  GroupItem,
  GroupMedia,
  GroupTitle,
  LabelledSetting,
  SettingsPageDescription,
  SettingsPageHeader,
  SettingsPageIcon,
  SettingsPageTitle,
  SettingsPage,
  useConfirm,
} from "@/components";
import { createFileEnvelope } from "@/core/fileEnvelope";
import {
  importedEdgeStylesAtom,
  importedVertexStylesAtom,
  userEdgeStylesAtom,
  userVertexStylesAtom,
} from "@/core/StateProvider/storageAtoms";
import {
  STYLING_EXPORT_KIND,
  STYLING_EXPORT_VERSION,
  useExportStylingFile,
  useImportStylingFile,
} from "@/core/styling";
import { logger } from "@/utils";
import { saveFile, toJsonFileData } from "@/utils/fileData";

import StylingImportIssuesDialog from "./StylingImportIssuesDialog";

/**
 * The single lifecycle of an export or import operation. Modeled as one union
 * so illegal combinations (busy while a result dialog is open, or two result
 * dialogs at once) are unrepresentable. Conflict confirmation is handled inline
 * via {@link useConfirm}, so it is not a state here.
 */
type StylingOpState =
  | { status: "idle" }
  | { status: "busy" }
  | { status: "importDone"; issues: ImportIssue[] }
  | { status: "importError"; message: string }
  | { status: "exportError"; message: string };

const IDLE: StylingOpState = { status: "idle" };
const BUSY: StylingOpState = { status: "busy" };

export default function SettingsStyles() {
  const confirm = useConfirm();
  const { parseFile, getConflicts, applyImport } = useImportStylingFile();
  const { getExportPayload } = useExportStylingFile();
  const setUserVertexStyles = useSetAtom(userVertexStylesAtom);
  const setUserEdgeStyles = useSetAtom(userEdgeStylesAtom);
  const setImportedVertexStyles = useSetAtom(importedVertexStylesAtom);
  const setImportedEdgeStyles = useSetAtom(importedEdgeStylesAtom);
  const importedVertexStyles = useAtomValue(importedVertexStylesAtom);
  const importedEdgeStyles = useAtomValue(importedEdgeStylesAtom);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [op, setOp] = useState<StylingOpState>(IDLE);

  async function handleResetCustomStyles() {
    const confirmed = await confirm({
      title: "Reset All Custom Styles",
      description: (
        <>
          <p>
            This will clear all your per-type style customizations. Your
            imported defaults will remain. Consider exporting first.
          </p>
          <p>This cannot be undone.</p>
        </>
      ),
      icon: <Trash2Icon />,
      mediaClassName: "bg-danger-subtle text-danger",
      confirmLabel: "Reset Custom Styles",
      confirmVariant: "primary-danger",
    });
    if (!confirmed) return;
    setUserVertexStyles(new Map());
    setUserEdgeStyles(new Map());
  }

  async function handleClearImportedDefaults() {
    const confirmed = await confirm({
      title: "Reset Imported Defaults",
      description:
        "This will remove all imported default styles. Your custom styles will remain. You can re-import a file at any time.",
      icon: <Trash2Icon />,
      mediaClassName: "bg-danger-subtle text-danger",
      confirmLabel: "Reset Imported Defaults",
      confirmVariant: "primary-danger",
    });
    if (!confirmed) return;
    setImportedVertexStyles(new Map());
    setImportedEdgeStyles(new Map());
  }

  async function handleExport() {
    setOp(BUSY);
    try {
      const payload = getExportPayload();
      const envelope = createFileEnvelope(
        STYLING_EXPORT_KIND,
        STYLING_EXPORT_VERSION,
        payload,
      );
      const blob = toJsonFileData(envelope);
      await saveFile(blob, "graph-explorer-styles.json");
      setOp(IDLE);
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "AbortError") {
        setOp(IDLE);
        return;
      }
      logger.warn("Export failed", e);
      setOp({
        status: "exportError",
        message:
          e instanceof Error
            ? e.message
            : "The styles file could not be saved.",
      });
    }
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setOp(BUSY);
    try {
      const parsed = await parseFile(file);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      const conflicts = getConflicts(parsed);
      const conflictCount = conflicts.vertices.length + conflicts.edges.length;
      if (conflictCount > 0) {
        const confirmed = await confirm({
          title: `Replace ${conflictCount} existing ${conflictCount === 1 ? "default" : "defaults"}?`,
          description:
            "The imported file will overwrite these existing imported defaults. New types will be added alongside them.",
          icon: <UploadIcon />,
          mediaClassName: "bg-primary-subtle text-primary-foreground",
          confirmLabel: "Import & Replace",
          body: <ConflictLists conflicts={conflicts} />,
        });
        if (!confirmed) {
          setOp(IDLE);
          return;
        }
      }

      const issues = applyImport(parsed);
      setOp({ status: "importDone", issues });
    } catch (error: unknown) {
      setOp({
        status: "importError",
        message:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while importing the file.",
      });
    }
  }

  const isBusy = op.status === "busy";

  return (
    <SettingsPage>
      <SettingsPageHeader>
        <SettingsPageIcon>
          <SwatchBookIcon />
        </SettingsPageIcon>
        <SettingsPageTitle>Styles</SettingsPageTitle>
        <SettingsPageDescription>
          Share your node and edge styling with others, or reset them back to
          defaults. Custom styles and imported defaults are tracked separately.
        </SettingsPageDescription>
      </SettingsPageHeader>

      <Group>
        <GroupHeader>
          <GroupTitle>Style Sharing</GroupTitle>
        </GroupHeader>
        <GroupItem>
          <LabelledSetting
            label="Export styles"
            description="Save your current node and edge styling to a file. Share it with others or import it on another machine to get the same look."
          >
            <Button
              className="min-w-28"
              onClick={handleExport}
              disabled={isBusy}
            >
              <DownloadIcon />
              Export
            </Button>
          </LabelledSetting>
        </GroupItem>
        <GroupItem className="space-y-2">
          <LabelledSetting
            label="Import default styles"
            description="Load styles from a file to become your new imported defaults. Your custom styles are left untouched."
          >
            <Button
              className="min-w-28"
              onClick={() => fileInputRef.current?.click()}
              disabled={isBusy}
            >
              <UploadIcon />
              Import
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              aria-label="Import styling file"
              className="hidden"
              onChange={handleFileSelected}
            />
          </LabelledSetting>
          <ImportedStylesStatus
            vertexCount={importedVertexStyles.size}
            edgeCount={importedEdgeStyles.size}
          />
        </GroupItem>
      </Group>

      <Group variant="danger">
        <GroupHeader>
          <GroupMedia>
            <TriangleAlertIcon />
          </GroupMedia>
          <GroupTitle>Danger Zone</GroupTitle>
        </GroupHeader>
        <GroupItem>
          <LabelledSetting
            label="Reset custom styles"
            description="Clear all per-type style customizations you've made. Imported defaults remain."
          >
            <Button
              variant="danger"
              className="min-w-28"
              onClick={handleResetCustomStyles}
            >
              <Trash2Icon />
              Reset Custom Styles
            </Button>
          </LabelledSetting>
        </GroupItem>
        <GroupItem>
          <LabelledSetting
            label="Reset imported defaults"
            description="Remove the imported default styles. Your custom styles remain."
          >
            <Button
              variant="danger"
              className="min-w-28"
              onClick={handleClearImportedDefaults}
            >
              <Trash2Icon />
              Reset Imported Defaults
            </Button>
          </LabelledSetting>
        </GroupItem>
      </Group>

      <StylingImportIssuesDialog
        outcome={
          op.status === "importDone"
            ? { issues: op.issues }
            : op.status === "importError"
              ? { error: op.message }
              : null
        }
        onClose={() => setOp(IDLE)}
      />
      <ExportFailedDialog
        error={op.status === "exportError" ? op.message : null}
        onClose={() => setOp(IDLE)}
      />
    </SettingsPage>
  );
}

function ExportFailedDialog({
  error,
  onClose,
}: {
  error: string | null;
  onClose: () => void;
}) {
  return (
    <AlertDialog open={error !== null} onOpenChange={o => !o && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-danger-subtle text-danger">
            <TriangleAlertIcon />
          </AlertDialogMedia>
          <AlertDialogTitle>Export Failed</AlertDialogTitle>
          <AlertDialogDescription>
            {error ?? "The styles file could not be saved."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose}>Close</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ConflictLists({ conflicts }: { conflicts: ImportConflicts }) {
  const { vertices, edges } = conflicts;
  return (
    <div className="min-h-0 space-y-3 overflow-y-auto">
      {vertices.length > 0 ? (
        <ConflictGroup
          label={`${vertices.length} vertex ${vertices.length === 1 ? "type" : "types"}`}
          types={vertices}
        />
      ) : null}
      {edges.length > 0 ? (
        <ConflictGroup
          label={`${edges.length} edge ${edges.length === 1 ? "type" : "types"}`}
          types={edges}
        />
      ) : null}
    </div>
  );
}

function ConflictGroup({ label, types }: { label: string; types: string[] }) {
  return (
    <Group size="small">
      <GroupHeader>
        <GroupTitle>{label}</GroupTitle>
      </GroupHeader>
      {types.toSorted().map(type => (
        <GroupItem key={type} className="gx-wrap-break-word font-mono text-xs">
          {type}
        </GroupItem>
      ))}
    </Group>
  );
}

function ImportedStylesStatus({
  vertexCount,
  edgeCount,
}: {
  vertexCount: number;
  edgeCount: number;
}) {
  if (vertexCount === 0 && edgeCount === 0) return null;

  const parts: string[] = [];
  if (vertexCount > 0) {
    parts.push(`${vertexCount} vertex`);
  }
  if (edgeCount > 0) {
    parts.push(`${edgeCount} edge`);
  }

  return (
    <div className="flex gap-2 text-sm" role="status">
      <div className="grid h-lh place-items-center">
        <span className="bg-primary-main size-2 rounded-full" />
      </div>
      <p className="text-text-secondary">
        {parts.join(" and ")}{" "}
        {vertexCount + edgeCount === 1 ? "type has" : "types have"} imported
        default styles
      </p>
    </div>
  );
}
