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
import useExpandNode from "../../hooks/useExpandNode";

export default function useResetState() {
  const { reset: resetExpandNodeRequest } = useExpandNode();

  return useRecoilCallback(
    ({ reset }) =>
      () => {
        resetExpandNodeRequest();
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
      },
    [resetExpandNodeRequest]
  );
}
