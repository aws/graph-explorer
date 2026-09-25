import { atom } from "jotai";

import { DEFAULT_GRAPH_LAYOUT, type LayoutName } from "@/core/graphLayout";

import { activeGraphSessionAtom } from "./storage";

const liveGraphLayoutAtom = atom<LayoutName>(DEFAULT_GRAPH_LAYOUT);

export const graphViewLayoutAlgorithmAtom = atom(
  get => get(liveGraphLayoutAtom),
  (get, set, layout: LayoutName) => {
    if (get(liveGraphLayoutAtom) === layout) return;

    set(liveGraphLayoutAtom, layout);

    const session = get(activeGraphSessionAtom);
    if (session && (session.vertices.size > 0 || session.edges.size > 0)) {
      set(activeGraphSessionAtom, { ...session, layout });
    }
  },
);
