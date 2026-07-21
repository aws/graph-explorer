import { useSetAtom } from "jotai";

import {
  userEdgeStylesAtom,
  userVertexStylesAtom,
} from "@/core/StateProvider/storageAtoms";

import type { StyleImportItem } from "./styleImportPlan";

/**
 * Writes the chosen styles into the user styles layer. Each item replaces its
 * type's entry wholesale (full-type replacement, not a per-field merge), and
 * types absent from the selection are left untouched. Vertices and edges are
 * split into one write per atom so a mixed selection still lands atomically.
 */
export function useApplyStyleImport() {
  const setUserVertexStyles = useSetAtom(userVertexStylesAtom);
  const setUserEdgeStyles = useSetAtom(userEdgeStylesAtom);

  return function applyStyleImport(items: StyleImportItem[]): void {
    const vertexItems = items.filter(item => item.kind === "vertex");
    const edgeItems = items.filter(item => item.kind === "edge");

    if (vertexItems.length > 0) {
      setUserVertexStyles(prev => {
        const next = new Map(prev);
        for (const item of vertexItems) {
          next.set(item.type, item.incoming);
        }
        return next;
      });
    }

    if (edgeItems.length > 0) {
      setUserEdgeStyles(prev => {
        const next = new Map(prev);
        for (const item of edgeItems) {
          next.set(item.type, item.incoming);
        }
        return next;
      });
    }
  };
}
