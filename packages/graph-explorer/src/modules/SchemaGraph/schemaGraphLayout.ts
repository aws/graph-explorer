import { atom } from "jotai";

import type { LayoutName } from "@/core/graphLayout";

import { schemaViewLayoutAtom } from "@/core/StateProvider/storageAtoms";

export const schemaViewLayoutAlgorithmAtom = atom(
  get => get(schemaViewLayoutAtom).layoutAlgorithm,
  (_get, set, layoutAlgorithm: LayoutName) =>
    set(schemaViewLayoutAtom, previous =>
      previous.layoutAlgorithm === layoutAlgorithm
        ? previous
        : { ...previous, layoutAlgorithm },
    ),
);
