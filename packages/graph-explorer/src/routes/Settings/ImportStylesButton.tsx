import { useMutation } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { AlertTriangleIcon, CheckCircleIcon, UploadIcon } from "lucide-react";
import { useState } from "react";

import type {
  EntryImportIssue,
  GeneralImportIssue,
  ImportConflicts,
  ImportIssue,
  StylingParseResult,
} from "@/core/styling";

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
  FileButton,
  Group,
  GroupHeader,
  GroupItem,
  GroupTitle,
} from "@/components";
import {
  importedEdgeStylesAtom,
  importedVertexStylesAtom,
} from "@/core/StateProvider/storageAtoms";
import {
  getStylingConflicts,
  parseStylingFile,
  StylingParseError,
  useApplyStylingImport,
} from "@/core/styling";

/**
 * What the import dialog is showing, derived each render from the parse mutation
 * plus whether an apply has happened. `null` means the dialog is closed.
 * Confirming a conflict advances the phase in place (`conflicts` → `complete`)
 * without closing the dialog, so the result replaces the prompt seamlessly.
 *
 * Import is atomic: a file with any invalid value never reaches `conflicts` or
 * `complete` — it surfaces as `invalid` with the full list of offending
 * locations. `failed` is reserved for envelope-level errors (wrong file, too
 * new), which are a single message with no per-field detail.
 */
type Phase =
  | {
      kind: "conflicts";
      parsed: StylingParseResult;
      conflicts: ImportConflicts;
    }
  | { kind: "failed"; message: string }
  | { kind: "invalid"; issues: ImportIssue[] }
  | { kind: "complete"; vertexCount: number; edgeCount: number };

export default function ImportStylesButton() {
  const applyImport = useApplyStylingImport();
  const importedVertexStyles = useAtomValue(importedVertexStylesAtom);
  const importedEdgeStyles = useAtomValue(importedEdgeStylesAtom);

  // Whether the parsed file has been merged into the imported-defaults layer.
  // The only outcome not already captured by the parse mutation.
  const [applied, setApplied] = useState(false);

  const parse = useMutation({
    mutationFn: async (file: File) => {
      const parsed = await parseStylingFile(file);
      const conflicts = getStylingConflicts(
        parsed,
        importedVertexStyles,
        importedEdgeStyles,
      );
      return { parsed, conflicts };
    },
    onSuccess: ({ parsed, conflicts }) => {
      // No conflicts → apply immediately. Otherwise wait for confirmation.
      if (conflicts.vertices.length + conflicts.edges.length === 0) {
        applyImport(parsed);
        setApplied(true);
      }
    },
  });

  function reset() {
    parse.reset();
    setApplied(false);
  }

  const phase = derivePhase(parse.data, parse.error, applied);

  function confirmConflicts(parsed: StylingParseResult) {
    applyImport(parsed);
    setApplied(true);
  }

  function renderPhase() {
    switch (phase?.kind) {
      case "conflicts":
        return (
          <ConflictContent
            conflicts={phase.conflicts}
            onConfirm={() => confirmConflicts(phase.parsed)}
          />
        );
      case "failed":
        return <ImportFailedContent error={phase.message} />;
      case "invalid":
        return <ImportInvalidContent issues={phase.issues} />;
      case "complete":
        return (
          <ImportCompleteContent
            vertexCount={phase.vertexCount}
            edgeCount={phase.edgeCount}
          />
        );
      case undefined:
        return null;
    }
  }

  return (
    <>
      <FileButton
        onChange={file => file && parse.mutate(file)}
        accept=".json"
        asChild
      >
        <Button className="min-w-28" disabled={parse.isPending}>
          <UploadIcon />
          Import
        </Button>
      </FileButton>

      <AlertDialog open={phase !== null} onOpenChange={o => !o && reset()}>
        {renderPhase()}
      </AlertDialog>
    </>
  );
}

function derivePhase(
  result:
    | { parsed: StylingParseResult; conflicts: ImportConflicts }
    | undefined,
  error: Error | null,
  applied: boolean,
): Phase | null {
  if (error) {
    return error instanceof StylingParseError
      ? { kind: "invalid", issues: error.issues }
      : { kind: "failed", message: error.message };
  }
  if (!result) {
    return null;
  }
  const { parsed, conflicts } = result;
  if (applied) {
    return {
      kind: "complete",
      vertexCount: parsed.vertexStyles.size,
      edgeCount: parsed.edgeStyles.size,
    };
  }
  return conflicts.vertices.length + conflicts.edges.length > 0
    ? { kind: "conflicts", parsed, conflicts }
    : null;
}

function ConflictContent({
  conflicts,
  onConfirm,
}: {
  conflicts: ImportConflicts;
  onConfirm: () => void;
}) {
  const conflictCount = conflicts.vertices.length + conflicts.edges.length;
  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogMedia className="bg-primary-subtle text-primary-foreground">
          <UploadIcon />
        </AlertDialogMedia>
        <AlertDialogTitle>
          {`Replace ${conflictCount} existing ${conflictCount === 1 ? "default" : "defaults"}?`}
        </AlertDialogTitle>
        <AlertDialogDescription>
          The imported file will overwrite these existing imported defaults. New
          types will be added alongside them. This cannot be undone — consider
          exporting first.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <ConflictLists conflicts={conflicts} />
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        {/* A plain button, not AlertDialogAction: confirming advances the phase
            in place rather than closing the dialog. */}
        <Button variant="primary" onClick={onConfirm}>
          Import &amp; Replace
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}

function ImportFailedContent({ error }: { error: string }) {
  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogMedia className="bg-danger-subtle text-danger">
          <AlertTriangleIcon />
        </AlertDialogMedia>
        <AlertDialogTitle>Import Failed</AlertDialogTitle>
        <AlertDialogDescription>{error}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogAction>Close</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}

function ImportInvalidContent({ issues }: { issues: ImportIssue[] }) {
  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogMedia className="bg-danger-subtle text-danger">
          <AlertTriangleIcon />
        </AlertDialogMedia>
        <AlertDialogTitle>Import Failed</AlertDialogTitle>
        <AlertDialogDescription>
          The file was not imported because it contains invalid values. Fix the
          values below and try again.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <IssuesList issues={issues} />
      <AlertDialogFooter>
        <AlertDialogAction>Close</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}

function ImportCompleteContent({
  vertexCount,
  edgeCount,
}: {
  vertexCount: number;
  edgeCount: number;
}) {
  // A structurally valid file can still carry zero recognized styles (every
  // entry held only unknown fields). Nothing was applied, so say so rather than
  // claiming a successful import.
  if (vertexCount + edgeCount === 0) {
    return (
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-warning-subtle text-warning-main">
            <AlertTriangleIcon />
          </AlertDialogMedia>
          <AlertDialogTitle>No Styles Found</AlertDialogTitle>
          <AlertDialogDescription>
            The file was read successfully but contained no styles to import.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction>Close</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    );
  }

  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogMedia className="bg-success-subtle text-success-main">
          <CheckCircleIcon />
        </AlertDialogMedia>
        <AlertDialogTitle>Import Complete</AlertDialogTitle>
        <AlertDialogDescription>
          {`Imported ${formatTypeCount(vertexCount, "vertex")} and ${formatTypeCount(edgeCount, "edge")}.`}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogAction>Close</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}

/** e.g. `formatTypeCount(2, "vertex")` → `"2 vertex types"`. */
function formatTypeCount(count: number, entity: string): string {
  return `${count} ${entity} ${count === 1 ? "type" : "types"}`;
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

function IssuesList({ issues }: { issues: ImportIssue[] }) {
  const general = issues.filter(issue => issue.scope === "general");
  const entries = issues.filter(issue => issue.scope === "entry");
  const vertices = entries.filter(issue => issue.entityType === "vertex");
  const edges = entries.filter(issue => issue.entityType === "edge");
  return (
    <div className="min-h-0 space-y-3 overflow-y-auto">
      {general.length > 0 ? <GeneralIssuesGroup issues={general} /> : null}
      {vertices.length > 0 ? (
        <EntryIssuesGroup
          label={`${vertices.length} vertex ${vertices.length === 1 ? "type" : "types"}`}
          issues={vertices}
        />
      ) : null}
      {edges.length > 0 ? (
        <EntryIssuesGroup
          label={`${edges.length} edge ${edges.length === 1 ? "type" : "types"}`}
          issues={edges}
        />
      ) : null}
    </div>
  );
}

function GeneralIssuesGroup({ issues }: { issues: GeneralImportIssue[] }) {
  return (
    <Group size="small">
      <GroupHeader>
        <GroupTitle>File structure</GroupTitle>
      </GroupHeader>
      {issues.map((issue, i) => (
        <GroupItem key={i} className="gx-wrap-break-word space-y-1 text-xs">
          <div>
            <span className="font-mono">{issue.location}</span>: {issue.message}
          </div>
        </GroupItem>
      ))}
    </Group>
  );
}

function EntryIssuesGroup({
  label,
  issues,
}: {
  label: string;
  issues: EntryImportIssue[];
}) {
  return (
    <Group size="small">
      <GroupHeader>
        <GroupTitle>{label}</GroupTitle>
      </GroupHeader>
      {issues.map((issue, i) => (
        <GroupItem key={i} className="gx-wrap-break-word space-y-1 text-xs">
          <div>
            <span className="text-text-primary font-mono font-medium">
              {issue.typeName}
            </span>
            {" — "}
            <span className="font-mono">{issue.field}</span>: {issue.message}
          </div>
          <div className="text-text-secondary">
            value:{" "}
            <span className="font-mono">{formatIssueValue(issue.value)}</span>
          </div>
        </GroupItem>
      ))}
    </Group>
  );
}

function formatIssueValue(value: unknown): string {
  if (typeof value === "string") {
    return `"${value}"`;
  }
  if (value === undefined) {
    return "undefined";
  }
  return JSON.stringify(value);
}
