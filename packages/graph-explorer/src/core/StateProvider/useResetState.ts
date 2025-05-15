import {
  edgesAtom,
  edgesFilteredIdsAtom,
  edgesOutOfFocusIdsAtom,
  edgesSelectedIdsAtom,
  edgesTypesFilteredAtom,
} from "./edges";
import {
  nodesAtom,
  nodesFilteredIdsAtom,
  nodesOutOfFocusIdsAtom,
  nodesSelectedIdsAtom,
  nodesTypesFilteredAtom,
} from "./nodes";
import {
  partialMatchAtom,
  searchTermAtom,
  selectedAttributeAtom,
  selectedVertexTypeAtom,
} from "@/modules/SearchSidebar/useKeywordSearch";
import { isRestorePreviousSessionAvailableAtom } from "./graphSession";
import { RESET, useAtomCallback } from "jotai/utils";
import { useCallback } from "react";
import { selectedTabAtom } from "@/modules/SearchSidebar";
import { queryTextAtom } from "@/modules/SearchSidebar/QuerySearchTabContent";

export default function useResetState() {
  return useAtomCallback(
    useCallback((_get, set) => {
      // Nodes
      set(nodesAtom, RESET);
      set(nodesSelectedIdsAtom, RESET);
      set(nodesOutOfFocusIdsAtom, RESET);
      set(nodesFilteredIdsAtom, RESET);
      set(nodesTypesFilteredAtom, RESET);

      // Edges
      set(edgesAtom, RESET);
      set(edgesSelectedIdsAtom, RESET);
      set(edgesOutOfFocusIdsAtom, RESET);
      set(edgesFilteredIdsAtom, RESET);
      set(edgesTypesFilteredAtom, RESET);

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
    }, [])
  );
}
