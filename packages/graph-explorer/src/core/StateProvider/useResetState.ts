import { useRecoilCallback } from "recoil";
import {
  edgesAtom,
  edgesFilteredIdsAtom,
  edgesHiddenIdsAtom,
  edgesOutOfFocusIdsAtom,
  edgesSelectedIdsAtom,
  edgesTypesFilteredAtom,
} from "./edges";
import {
  nodesAtom,
  nodesFilteredIdsAtom,
  nodesHiddenIdsAtom,
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
        reset(nodesAtom);
        reset(nodesSelectedIdsAtom);
        reset(nodesHiddenIdsAtom);
        reset(nodesOutOfFocusIdsAtom);
        reset(nodesFilteredIdsAtom);
        reset(nodesTypesFilteredAtom);
        reset(edgesAtom);
        reset(edgesSelectedIdsAtom);
        reset(edgesHiddenIdsAtom);
        reset(edgesOutOfFocusIdsAtom);
        reset(edgesFilteredIdsAtom);
        reset(edgesTypesFilteredAtom);
        reset(searchTermAtom);
        reset(selectedVertexTypeAtom);
        reset(selectedAttributeAtom);
        reset(partialMatchAtom);
      },
    []
  );
}
