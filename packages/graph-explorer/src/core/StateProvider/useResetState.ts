import { useQueryClient } from "@tanstack/react-query";
import { RESET, useAtomCallback } from "jotai/utils";
import { useCallback } from "react";

import { selectedTabAtom } from "@/modules/SearchSidebar";
import { queryTextAtom } from "@/modules/SearchSidebar/QuerySearchTabContent";
import {
  partialMatchAtom,
  searchTermAtom,
  selectedAttributeAtom,
  selectedVertexTypeAtom,
} from "@/modules/SearchSidebar/useKeywordSearch";
import { logger } from "@/utils";

import {
  edgesAtom,
  edgesFilteredIdsAtom,
  edgesOutOfFocusIdsAtom,
  edgesSelectedIdsAtom,
  edgesTableFiltersAtom,
  edgesTableSortsAtom,
  edgesTypesFilteredAtom,
} from "./edges";
import { isRestorePreviousSessionAvailableAtom } from "./graphSession";
import {
  nodesAtom,
  nodesFilteredIdsAtom,
  nodesOutOfFocusIdsAtom,
  nodesSelectedIdsAtom,
  nodesTableFiltersAtom,
  nodesTableSortsAtom,
  nodesTypesFilteredAtom,
} from "./nodes";

export default function useResetState() {
  const queryClient = useQueryClient();

  return useAtomCallback(
    useCallback(
      (_get, set) => {
        logger.debug("Resetting all session state in Jotai");

        // Nodes
        set(nodesAtom, RESET);
        set(nodesSelectedIdsAtom, RESET);
        set(nodesOutOfFocusIdsAtom, RESET);
        set(nodesFilteredIdsAtom, RESET);
        set(nodesTypesFilteredAtom, RESET);
        set(nodesTableFiltersAtom, RESET);
        set(nodesTableSortsAtom, RESET);

        // Edges
        set(edgesAtom, RESET);
        set(edgesSelectedIdsAtom, RESET);
        set(edgesOutOfFocusIdsAtom, RESET);
        set(edgesFilteredIdsAtom, RESET);
        set(edgesTypesFilteredAtom, RESET);
        set(edgesTableFiltersAtom, RESET);
        set(edgesTableSortsAtom, RESET);

        // Search related
        set(searchTermAtom, RESET);
        set(selectedVertexTypeAtom, RESET);
        set(selectedAttributeAtom, RESET);
        set(partialMatchAtom, RESET);

        // Query editor
        set(selectedTabAtom, RESET);
        set(queryTextAtom, RESET);

        // Previous session
        set(isRestorePreviousSessionAvailableAtom, RESET);

        logger.debug("Clearing React Query cache");
        queryClient.removeQueries();
      },
      [queryClient],
    ),
  );
}
