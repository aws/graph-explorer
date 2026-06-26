import { useAtomValue, useSetAtom } from "jotai";
import {
  DownloadIcon,
  SwatchBookIcon,
  Trash2Icon,
  TriangleAlertIcon,
  UploadIcon,
} from "lucide-react";
import { useRef, useState } from "react";

import type { ImportConflicts, StylingParseResult } from "@/core/styling";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
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
} from "@/components";
import { createFileEnvelope } from "@/core/fileEnvelope";
import {
  importedEdgeStylesAtom,
  importedVertexStylesAtom,
  userEdgeStylesAtom,
  userVertexStylesAtom,
} from "@/core/StateProvider/storageAtoms";
import { useExportStylingFile, useImportStylingFile } from "@/core/styling";
import { logger } from "@/utils";
import { saveFile, toJsonFileData } from "@/utils/fileData";

import StylingImportIssuesDialog, {
  type ImportOutcome,
} from "./StylingImportIssuesDialog";

export default function SettingsStyles() {
  const { parseFile, getConflicts, applyImport } = useImportStylingFile();
  const { getExportPayload } = useExportStylingFile();
  const setUserVertexStyles = useSetAtom(userVertexStylesAtom);
  const setUserEdgeStyles = useSetAtom(userEdgeStylesAtom);
  const setImportedVertexStyles = useSetAtom(importedVertexStylesAtom);
  const setImportedEdgeStyles = useSetAtom(importedEdgeStylesAtom);
  const importedVertexStyles = useAtomValue(importedVertexStylesAtom);
  const importedEdgeStyles = useAtomValue(importedEdgeStylesAtom);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importOutcome, setImportOutcome] = useState<ImportOutcome | null>(
    null,
  );
  const [exportError, setExportError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [pendingImport, setPendingImport] = useState<{
    parsed: StylingParseResult;
    conflicts: ImportConflicts;
  } | null>(null);

  function handleResetCustomStyles() {
    setUserVertexStyles(new Map());
    setUserEdgeStyles(new Map());
    setConfirmReset(false);
  }

  function handleClearImportedDefaults() {
    setImportedVertexStyles(new Map());
    setImportedEdgeStyles(new Map());
    setConfirmClear(false);
  }

  async function handleExport() {
    setIsBusy(true);
    try {
      const payload = getExportPayload();
      const envelope = createFileEnvelope("styling-export", "1.0", payload);
      const blob = toJsonFileData(envelope);
      await saveFile(blob, "graph-explorer-styles.json");
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "AbortError") return;
      logger.warn("Export failed", e);
      setExportError(
        e instanceof Error ? e.message : "The styles file could not be saved.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsBusy(true);
    try {
      const parsed = await parseFile(file);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      const conflicts = getConflicts(parsed);
      if (conflicts.vertices.length > 0 || conflicts.edges.length > 0) {
        setPendingImport({ parsed, conflicts });
      } else {
        const issues = applyImport(parsed);
        setImportOutcome({ issues });
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while importing the file.";
      setImportOutcome({ error: message });
    } finally {
      setIsBusy(false);
    }
  }

  function handleConfirmImport() {
    if (!pendingImport) return;
    const issues = applyImport(pendingImport.parsed);
    setPendingImport(null);
    setImportOutcome({ issues });
  }

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
            description="Save your current styles to a file. This includes both your custom styles and any imported defaults, merged together."
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
              onClick={() => setConfirmReset(true)}
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
              onClick={() => setConfirmClear(true)}
            >
              <Trash2Icon />
              Reset Imported Defaults
            </Button>
          </LabelledSetting>
        </GroupItem>
      </Group>

      <ConfirmResetDialog
        open={confirmReset}
        onConfirm={handleResetCustomStyles}
        onCancel={() => setConfirmReset(false)}
      />
      <ConfirmClearDialog
        open={confirmClear}
        onConfirm={handleClearImportedDefaults}
        onCancel={() => setConfirmClear(false)}
      />
      <ConfirmImportMergeDialog
        pending={pendingImport}
        onConfirm={handleConfirmImport}
        onCancel={() => setPendingImport(null)}
      />
      <StylingImportIssuesDialog
        outcome={importOutcome}
        onClose={() => setImportOutcome(null)}
      />
      <ExportFailedDialog
        error={exportError}
        onClose={() => setExportError(null)}
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

function ConfirmResetDialog({
  open,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={o => !o && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-danger-subtle text-danger">
            <Trash2Icon />
          </AlertDialogMedia>
          <AlertDialogTitle>Reset All Custom Styles</AlertDialogTitle>
          <AlertDialogDescription>
            <p>
              This will clear all your per-type style customizations. Your
              imported defaults will remain. Consider exporting first.
            </p>
            <p>This cannot be undone.</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="primary-danger" onClick={onConfirm}>
            Reset Custom Styles
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ConfirmClearDialog({
  open,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={o => !o && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-danger-subtle text-danger">
            <Trash2Icon />
          </AlertDialogMedia>
          <AlertDialogTitle>Reset Imported Defaults</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove all imported default styles. Your custom styles
            will remain. You can re-import a file at any time.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="primary-danger" onClick={onConfirm}>
            Reset Imported Defaults
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ConfirmImportMergeDialog({
  pending,
  onConfirm,
  onCancel,
}: {
  pending: { parsed: StylingParseResult; conflicts: ImportConflicts } | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!pending) return null;

  const { vertices, edges } = pending.conflicts;
  const total = vertices.length + edges.length;

  return (
    <AlertDialog open onOpenChange={o => !o && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-primary-subtle text-primary-foreground">
            <UploadIcon />
          </AlertDialogMedia>
          <AlertDialogTitle>
            Replace {total} existing {total === 1 ? "default" : "defaults"}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            The imported file will overwrite these existing imported defaults.
            New types will be added alongside them.
          </AlertDialogDescription>
        </AlertDialogHeader>
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
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="primary" onClick={onConfirm}>
            Import & Replace
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
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
