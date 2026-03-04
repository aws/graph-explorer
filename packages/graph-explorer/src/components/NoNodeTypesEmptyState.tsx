import { DatabaseIcon } from "lucide-react";

import useTranslations from "@/hooks/useTranslations";

import {
  EmptyState,
  EmptyStateContent,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "./EmptyState";

export function NoNodeTypesEmptyState() {
  const t = useTranslations();
  const nodeTypes = t("node-types");

  return (
    <EmptyState>
      <EmptyStateIcon>
        <DatabaseIcon />
      </EmptyStateIcon>
      <EmptyStateContent>
        <EmptyStateTitle>No {nodeTypes} Available</EmptyStateTitle>
        <EmptyStateDescription>
          No {nodeTypes.toLocaleLowerCase()} found in the connected database
        </EmptyStateDescription>
      </EmptyStateContent>
    </EmptyState>
  );
}
