import { useAtomValue } from "jotai";

import { useBackgroundImageMap } from "@/core/icons";

import type { EdgeType, VertexType } from "../entities";

import {
  type EdgeStyleData,
  edgeStyleData,
  type VertexStyleData,
  vertexStyleData,
} from "./graphElementStyleData";
import {
  type EdgeStyleLookup,
  edgeStyleAtom,
  type VertexStyle,
  type VertexStyleLookup,
  vertexStyleAtom,
} from "./graphStyles";

/**
 * Style data varies only by type, so within one render pass the graph surfaces
 * resolve it once per type rather than once per element — N nodes of a type cost
 * one `vertexStyleData` call.
 *
 * The cache is keyed only by type; the styles and icons it was built from are
 * pinned by resolver identity alone. It is discarded whenever those inputs
 * change identity, which includes every node add or remove, so treat it as a
 * per-render dedupe and not a cross-render cache.
 */

/** Resolves the cytoscape data-mapper fields for a vertex type, memoized per type. */
export type VertexStyleDataResolver = (type: VertexType) => VertexStyleData;

/** Resolves the cytoscape data-mapper fields for an edge type, memoized per type. */
export type EdgeStyleDataResolver = (type: EdgeType) => EdgeStyleData;

/**
 * @param iconStyles The styles whose icons should be resolved — the caller's
 * scope, since the canvas needs only the types it draws while the schema view
 * needs every type. A type outside this set resolves without an icon.
 */
export function useVertexStyleDataResolver(
  iconStyles: VertexStyle[],
): VertexStyleDataResolver {
  const styles = useAtomValue(vertexStyleAtom);
  const backgroundImages = useBackgroundImageMap(iconStyles);
  return createVertexStyleDataResolver(styles, backgroundImages);
}

export function useEdgeStyleDataResolver(): EdgeStyleDataResolver {
  return createEdgeStyleDataResolver(useAtomValue(edgeStyleAtom));
}

function createVertexStyleDataResolver(
  styles: VertexStyleLookup,
  backgroundImages: Map<VertexType, string>,
): VertexStyleDataResolver {
  const cache = new Map<VertexType, VertexStyleData>();
  return type => {
    let data = cache.get(type);
    if (data === undefined) {
      data = vertexStyleData(styles.get(type), backgroundImages.get(type));
      cache.set(type, data);
    }
    return data;
  };
}

function createEdgeStyleDataResolver(
  styles: EdgeStyleLookup,
): EdgeStyleDataResolver {
  const cache = new Map<EdgeType, EdgeStyleData>();
  return type => {
    let data = cache.get(type);
    if (data === undefined) {
      data = edgeStyleData(styles.get(type));
      cache.set(type, data);
    }
    return data;
  };
}
