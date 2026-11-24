import { atom } from "jotai";

import type { LayoutName } from "@/core/graphLayout";

import { graphViewLayoutAtom } from "../storageAtoms";
import {
  activeGraphSessionAtom,
  isRestorePreviousSessionAvailableAtom,
} from "./storage";

/**
 * The Graph View's chosen layout algorithm. Choosing one while the graph on
 * screen is the active Session also updates that Session's layout, so restoring
 * it later brings back the latest choice.
 */
export const graphViewLayoutAlgorithmAtom = atom(
  get => get(graphViewLayoutAtom).layoutAlgorithm,
  (get, set, layoutAlgorithm: LayoutName) => {
    set(graphViewLayoutAtom, previous =>
      previous.layoutAlgorithm === layoutAlgorithm
        ? previous
        : { ...previous, layoutAlgorithm },
    );

    const session = get(activeGraphSessionAtom);
    if (
      session &&
      session.layout !== layoutAlgorithm &&
      !get(isRestorePreviousSessionAvailableAtom)
    ) {
      set(activeGraphSessionAtom, { ...session, layout: layoutAlgorithm });
    }
  },
);
