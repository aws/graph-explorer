import type { ReactNode } from "react";
import { NoWidgetIcon, SearchSadIcon } from "@/components/icons";
import { PanelEmptyState } from "@/components/PanelEmptyState";

const getEmptyStateItems = (
  _empty: boolean,
  noSearchResults: boolean,
  emptyState?: {
    noSearchResultsTitle?: ReactNode;
    noSearchResultsSubtitle?: ReactNode;
    noSearchResultsIcon?: ReactNode;
    noElementsTitle?: ReactNode;
    noElementsSubtitle?: ReactNode;
    noElementsIcon?: ReactNode;
  }
) => {
  if (noSearchResults) {
    return {
      title: emptyState?.noSearchResultsTitle || "No results found",
      subtitle:
        emptyState?.noSearchResultsSubtitle ||
        "Your search returned with no results",
      icon: emptyState?.noSearchResultsIcon || <SearchSadIcon />,
    };
  }

  return {
    title: emptyState?.noElementsTitle || "No saved connections",
    subtitle:
      emptyState?.noElementsSubtitle ||
      "To get started, click + to add a new connection to a graph database.",
    icon: emptyState?.noElementsIcon || <NoWidgetIcon />,
  };
};

export type EmptyStateProps = {
  empty: boolean;
  noSearchResults: boolean;
  className?: string;
  emptyState?: {
    noSearchResultsTitle?: ReactNode;
    noSearchResultsSubtitle?: ReactNode;
    noSearchResultsIcon?: ReactNode;
    noElementsTitle?: ReactNode;
    noElementsSubtitle?: ReactNode;
    noElementsIcon?: ReactNode;
  };
};

const EmptyState = ({
  empty,
  noSearchResults,
  emptyState,
  className,
}: EmptyStateProps) => {
  const state = getEmptyStateItems(empty, noSearchResults, emptyState);
  return (
    <PanelEmptyState
      className={className}
      icon={state.icon}
      title={state.title}
      subtitle={state.subtitle}
    />
  );
};

export default EmptyState;
