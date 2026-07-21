import { useAtomValue } from "jotai";
import { AlertTriangleIcon, FolderOpenIcon } from "lucide-react";
import { startTransition, useActionState } from "react";
import { toast } from "sonner";

import type {
  EntryImportIssue,
  GeneralImportIssue,
  ImportIssue,
  StylingParseResult,
} from "@/core/styling";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  Button,
  Dialog,
  FileButton,
  Group,
  GroupHeader,
  GroupItem,
  GroupTitle,
} from "@/components";
import {
  userEdgeStylesAtom,
  userVertexStylesAtom,
} from "@/core/StateProvider/storageAtoms";
import { parseStylingFile, StylingParseError } from "@/core/styling";
import { logger } from "@/utils";
import {
  createDisplayError,
  type DisplayError,
} from "@/utils/createDisplayError";

import type { StyleImportItem, StyleImportPlan } from "./styleImportPlan";

import { StyleImportModal } from "./StyleImportModal";
import { buildStyleImportPlan } from "./styleImportPlan";
import { useApplyStyleImport } from "./useApplyStyleImport";

/**
 * What the load flow is showing. `closed` is the resting state. A valid file
 * with actionable styles opens `picking` (the selective modal); a valid file
 * whose styles all already match resolves to `empty`. Parse failures split by
 * cause: `invalid` carries per-field issues, `failed` carries a single
 * envelope-level message.
 */
type LoadState =
  | { kind: "closed" }
  | { kind: "picking"; fileName: string; plan: StyleImportPlan }
  | { kind: "empty"; allMatched: boolean }
  | { kind: "invalid"; issues: ImportIssue[] }
  | { kind: "failed"; error: DisplayError };

type LoadAction =
  | { type: "submitFile"; file: File }
  | { type: "loaded" }
  | { type: "dismiss" };

export function LoadStylesButton() {
  const applyStyleImport = useApplyStyleImport();
  const userVertexStyles = useAtomValue(userVertexStylesAtom);
  const userEdgeStyles = useAtomValue(userEdgeStylesAtom);

  // The action runs as an event and may await the file read, so it doubles as
  // an async reducer. React tracks `isPending` across the await, so `state`
  // stays the single source of truth for what the flow shows.
  async function runLoad(
    _state: LoadState,
    action: LoadAction,
  ): Promise<LoadState> {
    switch (action.type) {
      case "submitFile":
        try {
          const parsed = await parseStylingFile(action.file);
          return toPickingOrEmpty(action.file.name, parsed);
        } catch (error) {
          return toErrorState(error);
        }
      case "loaded":
      case "dismiss":
        return { kind: "closed" };
    }
  }

  function toPickingOrEmpty(
    fileName: string,
    parsed: StylingParseResult,
  ): LoadState {
    const plan = buildStyleImportPlan(parsed, userVertexStyles, userEdgeStyles);
    if (plan.items.length === 0) {
      // No cards to show for two different reasons: the file carried no styles
      // at all, or every style it carried already matches. The copy differs, so
      // distinguish them by whether anything was skipped as identical.
      return { kind: "empty", allMatched: plan.skippedCount > 0 };
    }
    return { kind: "picking", fileName, plan };
  }

  const [state, dispatchAction, isPending] = useActionState(runLoad, {
    kind: "closed",
  });

  // The action awaits, so every dispatch must run inside a transition — else a
  // pending update can reveal the nearest Suspense fallback.
  function dispatch(action: LoadAction) {
    startTransition(() => dispatchAction(action));
  }

  function load(items: StyleImportItem[]) {
    applyStyleImport(items);
    dispatch({ type: "loaded" });
    toast.success(
      `Loaded ${items.length} ${items.length === 1 ? "style" : "styles"}`,
    );
  }

  return (
    <>
      <FileButton
        onChange={file => file && dispatch({ type: "submitFile", file })}
        accept="application/json"
        asChild
      >
        <Button className="min-w-28" disabled={isPending}>
          <FolderOpenIcon />
          Load
        </Button>
      </FileButton>

      <Dialog
        open={state.kind === "picking"}
        onOpenChange={open => !open && dispatch({ type: "dismiss" })}
      >
        {state.kind === "picking" ? (
          <StyleImportModal
            fileName={state.fileName}
            plan={state.plan}
            onLoad={load}
            onClose={() => dispatch({ type: "dismiss" })}
          />
        ) : null}
      </Dialog>

      <AlertDialog
        open={
          state.kind === "empty" ||
          state.kind === "invalid" ||
          state.kind === "failed"
        }
        onOpenChange={open => !open && dispatch({ type: "dismiss" })}
      >
        {state.kind === "empty" ? (
          <LoadEmptyContent allMatched={state.allMatched} />
        ) : null}
        {state.kind === "invalid" ? (
          <LoadInvalidContent issues={state.issues} />
        ) : null}
        {state.kind === "failed" ? (
          <LoadFailedContent error={state.error} />
        ) : null}
      </AlertDialog>
    </>
  );
}

function toErrorState(error: unknown): LoadState {
  if (error instanceof StylingParseError) {
    return { kind: "invalid", issues: error.issues };
  }
  logger.error("Load failed", error);
  return { kind: "failed", error: createDisplayError(error) };
}

function LoadFailedContent({ error }: { error: DisplayError }) {
  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogMedia className="bg-danger-subtle text-danger-foreground">
          <AlertTriangleIcon />
        </AlertDialogMedia>
        <AlertDialogTitle>{error.title}</AlertDialogTitle>
        <AlertDialogDescription>{error.message}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogAction>Close</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}

function LoadInvalidContent({ issues }: { issues: ImportIssue[] }) {
  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogMedia className="bg-danger-subtle text-danger-foreground">
          <AlertTriangleIcon />
        </AlertDialogMedia>
        <AlertDialogTitle>Load Failed</AlertDialogTitle>
        <AlertDialogDescription>
          The file was not loaded because it contains invalid values. Fix the
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

function LoadEmptyContent({ allMatched }: { allMatched: boolean }) {
  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogMedia className="bg-warning-subtle text-warning-foreground">
          <AlertTriangleIcon />
        </AlertDialogMedia>
        <AlertDialogTitle>
          {allMatched ? "No Styles to Load" : "No Styles Found"}
        </AlertDialogTitle>
        <AlertDialogDescription>
          {allMatched
            ? "The file was read successfully, but every style in it already matches your current styles."
            : "The file was read successfully but contained no styles to load."}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogAction>Close</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}

function IssuesList({ issues }: { issues: ImportIssue[] }) {
  const general = issues.filter(issue => issue.scope === "general");
  const entries = issues.filter(issue => issue.scope === "entry");
  const vertices = entries.filter(issue => issue.entityType === "vertex");
  const edges = entries.filter(issue => issue.entityType === "edge");
  return (
    <AlertDialogBody className="space-y-3">
      {general.length > 0 ? <GeneralIssuesGroup issues={general} /> : null}
      {vertices.length > 0 ? (
        <EntryIssuesGroup
          label={`${vertices.length} node ${vertices.length === 1 ? "type" : "types"}`}
          issues={vertices}
        />
      ) : null}
      {edges.length > 0 ? (
        <EntryIssuesGroup
          label={`${edges.length} edge ${edges.length === 1 ? "type" : "types"}`}
          issues={edges}
        />
      ) : null}
    </AlertDialogBody>
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
            <span className="text-foreground font-mono font-medium">
              {issue.typeName}
            </span>
            {" → "}
            <span className="font-mono">{issue.field}</span>: {issue.message}
          </div>
          <div className="text-muted-foreground">
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
