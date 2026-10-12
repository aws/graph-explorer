import { atom } from "jotai";

import type { LayoutName } from "@/core/graphLayout";

import { graphViewLayoutAtom } from "../storageAtoms";

export const graphViewLayoutAlgorithmAtom = atom(
  get => get(graphViewLayoutAtom).layoutAlgorithm,
  (_get, set, layoutAlgorithm: LayoutName) =>
    set(graphViewLayoutAtom, previous =>
      previous.layoutAlgorithm === layoutAlgorithm
        ? previous
        : { ...previous, layoutAlgorithm },
    ),
);
