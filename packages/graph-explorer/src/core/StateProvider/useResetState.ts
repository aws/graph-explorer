import { useRecoilCallback } from "recoil";
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

export default function useResetState() {
  return useRecoilCallback(
    ({ reset }) =>
      () => {
        // Nodes
        reset(nodesAtom);
        reset(nodesSelectedIdsAtom);
        reset(nodesOutOfFocusIdsAtom);
        reset(nodesFilteredIdsAtom);
        reset(nodesTypesFilteredAtom);

        // Edges
        reset(edgesAtom);
        reset(edgesSelectedIdsAtom);
        reset(edgesOutOfFocusIdsAtom);
        reset(edgesFilteredIdsAtom);
        reset(edgesTypesFilteredAtom);

        // Search related
        reset(searchTermAtom);
        reset(selectedVertexTypeAtom);
        reset(selectedAttributeAtom);
        reset(partialMatchAtom);
      },
    []
  );
}
