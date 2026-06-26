import { AlertTriangleIcon, CheckCircleIcon } from "lucide-react";

import type { ImportIssue } from "@/core/styling";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components";

export type ImportOutcome = {
  error?: string;
  issues?: ImportIssue[];
};

type Props = {
  outcome: ImportOutcome | null;
  onClose: () => void;
};

export default function StylingImportIssuesDialog({ outcome, onClose }: Props) {
  if (!outcome) return null;

  if (outcome.error) {
    return (
      <AlertDialog open onOpenChange={open => !open && onClose()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-danger-subtle text-danger">
              <AlertTriangleIcon />
            </AlertDialogMedia>
            <AlertDialogTitle>Import Failed</AlertDialogTitle>
            <AlertDialogDescription>{outcome.error}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={onClose}>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  const issues = outcome.issues ?? [];
  const hasWarnings = issues.length > 0;

  return (
    <AlertDialog open onOpenChange={open => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia
            className={
              hasWarnings
                ? "bg-warning-subtle text-warning-main"
                : "bg-success-subtle text-success-main"
            }
          >
            {hasWarnings ? <AlertTriangleIcon /> : <CheckCircleIcon />}
          </AlertDialogMedia>
          <AlertDialogTitle>
            {hasWarnings ? "Imported with Warnings" : "Import Complete"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {hasWarnings
              ? "Some fields were skipped because they contained invalid values."
              : "All styles were imported successfully."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {hasWarnings ? <IssuesList issues={issues} /> : null}
        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose}>Close</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function IssuesList({ issues }: { issues: ImportIssue[] }) {
  return (
    <div className="max-h-48 overflow-y-auto rounded-xl border">
      <ul>
        {issues.map((issue, i) => (
          <li
            key={i}
            className="text-text-secondary px-3 py-2 text-xs not-last:border-b"
          >
            <span className="text-text-primary font-medium">
              {issue.entityType}/{issue.typeName}
            </span>
            {" — "}
            <span className="font-mono">{issue.field}</span>: {issue.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
