import { useAtomValue } from "jotai";
import { AlertTriangleIcon, CheckCircleIcon, UploadIcon } from "lucide-react";
import { useActionState } from "react";

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
 * What the import dialog is showing. `closed` is the resting state — the dialog
 * is hidden. Confirming a conflict advances the state in place (`conflicts` →
 * terminal) without closing the dialog, so the result replaces the prompt
 * seamlessly.
 *
 * Import is atomic: a file with any invalid value never reaches `conflicts` or a
 * terminal state — it surfaces as `invalid` with the full list of offending
 * locations. `failed` is reserved for envelope-level errors (wrong file, too
 * new), which are a single message with no per-field detail. A structurally
 * valid file that carries no recognized styles lands on `empty`, not `complete`.
 */
type DialogState =
  | { kind: "closed" }
  | {
      kind: "conflicts";
      parsed: StylingParseResult;
      conflicts: ImportConflicts;
    }
  | { kind: "failed"; message: string }
  | { kind: "invalid"; issues: ImportIssue[] }
  | { kind: "empty" }
  | { kind: "complete"; vertexCount: number; edgeCount: number };

type ImportAction =
  | { type: "submitFile"; file: File }
  | { type: "confirmConflicts" }
  | { type: "dismiss" };

export default function ImportStylesButton() {
  const applyImport = useApplyStylingImport();
  const importedVertexStyles = useAtomValue(importedVertexStylesAtom);
  const importedEdgeStyles = useAtomValue(importedEdgeStylesAtom);

  // The action is a reducer that may await and perform the import side effect,
  // since it runs as an event rather than as a pure reducer. React tracks
  // `isPending` across the await, so there is no manual async state to keep in
  // sync — `state` is the single source of truth for what the dialog shows.
  async function runImport(
    state: DialogState,
    action: ImportAction,
  ): Promise<DialogState> {
    switch (action.type) {
      case "submitFile":
        try {
          const parsed = await parseStylingFile(action.file);
          const conflicts = getStylingConflicts(
            parsed,
            importedVertexStyles,
            importedEdgeStyles,
          );
          // Conflicts must be confirmed before overwriting; otherwise apply now.
          if (hasConflicts(conflicts)) {
            return { kind: "conflicts", parsed, conflicts };
          }
          applyImport(parsed);
          return terminalState(parsed);
        } catch (error) {
          // Expected failures become state, not throws — an uncaught throw would
          // escape to the nearest error boundary instead of the dialog.
          return toErrorState(error);
        }
      // Confirming the overwrite advances the same parsed file to its terminal
      // outcome in place. This transition replaces the old `confirmed` flag.
      case "confirmConflicts":
        if (state.kind !== "conflicts") {
          return state;
        }
        applyImport(state.parsed);
        return terminalState(state.parsed);
      case "dismiss":
        return { kind: "closed" };
    }
  }

  const [state, dispatch, isPending] = useActionState(runImport, {
    kind: "closed",
  });

  function renderState() {
    switch (state.kind) {
      case "conflicts":
        return (
          <ConflictContent
            conflicts={state.conflicts}
            onConfirm={() => dispatch({ type: "confirmConflicts" })}
          />
        );
      case "failed":
        return <ImportFailedContent error={state.message} />;
      case "invalid":
        return <ImportInvalidContent issues={state.issues} />;
      case "empty":
        return <ImportEmptyContent />;
      case "complete":
        return (
          <ImportCompleteContent
            vertexCount={state.vertexCount}
            edgeCount={state.edgeCount}
          />
        );
      case "closed":
        return null;
    }
  }

  return (
    <>
      <FileButton
        onChange={file => file && dispatch({ type: "submitFile", file })}
        accept=".json"
        asChild
      >
        <Button className="min-w-28" disabled={isPending}>
          <UploadIcon />
          Import
        </Button>
      </FileButton>

      <AlertDialog
        open={state.kind !== "closed"}
        onOpenChange={o => !o && dispatch({ type: "dismiss" })}
      >
        {renderState()}
      </AlertDialog>
    </>
  );
}

function hasConflicts(conflicts: ImportConflicts): boolean {
  return conflicts.vertices.length + conflicts.edges.length > 0;
}

function terminalState(parsed: StylingParseResult): DialogState {
  const vertexCount = parsed.vertexStyles.size;
  const edgeCount = parsed.edgeStyles.size;
  return vertexCount + edgeCount === 0
    ? { kind: "empty" }
    : { kind: "complete", vertexCount, edgeCount };
}

function toErrorState(error: unknown): DialogState {
  if (error instanceof StylingParseError) {
    return { kind: "invalid", issues: error.issues };
  }
  return {
    kind: "failed",
    message: error instanceof Error ? error.message : String(error),
  };
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

function ImportEmptyContent() {
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

function ImportCompleteContent({
  vertexCount,
  edgeCount,
}: {
  vertexCount: number;
  edgeCount: number;
}) {
  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogMedia className="bg-success-subtle text-success-main">
          <CheckCircleIcon />
        </AlertDialogMedia>
        <AlertDialogTitle>Import Complete</AlertDialogTitle>
        <AlertDialogDescription>
          {`Imported ${formatImportedCounts(vertexCount, edgeCount)}.`}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogAction>Close</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}

/**
 * Summarizes what was imported, omitting a zero side so a vertex-only import
 * reads "2 vertex styles" rather than "2 vertex styles and 0 edge styles". The
 * empty case is handled by its own phase, so at least one count is non-zero.
 */
function formatImportedCounts(vertexCount: number, edgeCount: number): string {
  const clauses: string[] = [];
  if (vertexCount > 0) {
    clauses.push(formatStyleCount(vertexCount, "vertex"));
  }
  if (edgeCount > 0) {
    clauses.push(formatStyleCount(edgeCount, "edge"));
  }
  return clauses.join(" and ");
}

/** e.g. `formatStyleCount(2, "vertex")` → `"2 vertex styles"`. */
function formatStyleCount(count: number, entity: string): string {
  return `${count} ${entity} ${count === 1 ? "style" : "styles"}`;
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
