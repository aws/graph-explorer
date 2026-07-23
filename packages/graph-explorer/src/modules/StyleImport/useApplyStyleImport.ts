import { useSetAtom } from "jotai";

import type { EdgeType, VertexType } from "@/core/entities";
import type {
  EdgeStyleStorage,
  VertexStyleStorage,
} from "@/core/StateProvider/graphStyles";

import {
  userEdgeStylesAtom,
  userVertexStylesAtom,
} from "@/core/StateProvider/storageAtoms";

import type { StyleImportItem } from "./styleImportPlan";

/**
 * Collapses the selected items for one entity kind into the entry to write per
 * type. A type can contribute both a `base` and a `conditional` item; the
 * conditional entry already includes the base fields plus the condition, so it
 * supersedes the base item and there is no cross-item dependency to enforce.
 */
function composeEntries<T extends string, S extends { type: T }>(
  items: { type: T; variant: StyleImportItem["variant"]; incoming: S }[],
): Map<T, S> {
  const byType = new Map<T, S>();
  for (const item of items) {
    if (!byType.has(item.type) || item.variant === "conditional") {
      byType.set(item.type, item.incoming);
    }
  }
  return byType;
}

/**
 * Writes the chosen styles into the user styles layer. Each type's selected
 * items are composed into a single entry that replaces its type's entry
 * wholesale (full-type replacement, not a per-field merge); types absent from
 * the selection are left untouched. Vertices and edges are split into one write
 * per atom so a mixed selection still lands atomically.
 */
export function useApplyStyleImport() {
  const setUserVertexStyles = useSetAtom(userVertexStylesAtom);
  const setUserEdgeStyles = useSetAtom(userEdgeStylesAtom);

  return function applyStyleImport(items: StyleImportItem[]): void {
    const vertexEntries = composeEntries<VertexType, VertexStyleStorage>(
      items.filter(item => item.kind === "vertex"),
    );
    const edgeEntries = composeEntries<EdgeType, EdgeStyleStorage>(
      items.filter(item => item.kind === "edge"),
    );

    if (vertexEntries.size > 0) {
      setUserVertexStyles(prev => {
        const next = new Map(prev);
        for (const [type, incoming] of vertexEntries) {
          next.set(type, incoming);
        }
        return next;
      });
    }

    if (edgeEntries.size > 0) {
      setUserEdgeStyles(prev => {
        const next = new Map(prev);
        for (const [type, incoming] of edgeEntries) {
          next.set(type, incoming);
        }
        return next;
      });
    }
  };
}
