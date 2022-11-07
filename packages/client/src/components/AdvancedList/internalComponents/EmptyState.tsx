import type { ReactNode } from "react";
import { PanelEmptyState } from "../../EmptyStates";
import NoWidgetIcon from "../../icons/NoWidgetIcon";
import SearchSadIcon from "../../icons/SearchSadIcon";

const getEmptyStateItems = (
  empty: boolean,
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
    title: emptyState?.noElementsTitle || "No elements",
    subtitle:
      emptyState?.noElementsSubtitle || "No Elements available in this list",
    icon: emptyState?.noElementsIcon || <NoWidgetIcon />,
  };
};

export type EmptyStateProps = {
  empty: boolean;
  noSearchResults: boolean;
  classNamePrefix?: string;
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
  classNamePrefix = "ft",
  className,
}: EmptyStateProps) => {
  const state = getEmptyStateItems(empty, noSearchResults, emptyState);
  return (
    <PanelEmptyState
      classNamePrefix={classNamePrefix}
      className={className}
      icon={state.icon}
      title={state.title}
      subtitle={state.subtitle}
    />
  );
};

export default EmptyState;
