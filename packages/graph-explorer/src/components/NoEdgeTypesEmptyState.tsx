import { DatabaseIcon } from "lucide-react";

import useTranslations from "@/hooks/useTranslations";

import {
  EmptyState,
  EmptyStateContent,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "./EmptyState";

export function NoEdgeTypesEmptyState() {
  const t = useTranslations();
  const edgeTypes = t("edge-types");

  return (
    <EmptyState>
      <EmptyStateIcon>
        <DatabaseIcon />
      </EmptyStateIcon>
      <EmptyStateContent>
        <EmptyStateTitle>No {edgeTypes} Available</EmptyStateTitle>
        <EmptyStateDescription>
          No {edgeTypes.toLocaleLowerCase()} found in the connected database
        </EmptyStateDescription>
      </EmptyStateContent>
    </EmptyState>
  );
}
