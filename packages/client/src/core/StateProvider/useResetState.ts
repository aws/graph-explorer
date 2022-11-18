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
  nodesLockedIdsAtom,
  nodesOutOfFocusIdsAtom,
  nodesSelectedIdsAtom,
  nodesTypesFilteredAtom,
} from "./nodes";

const useResetState = () => {
  return useRecoilCallback(
    ({ reset }) => () => {
      reset(nodesAtom);
      reset(nodesSelectedIdsAtom);
      reset(nodesLockedIdsAtom);
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
    []
  );
};

export default useResetState;
