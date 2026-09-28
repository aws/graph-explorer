import Color from "color";
import { useAtomValue } from "jotai";
import { useDeferredValue, useMemo } from "react";

import type { GraphProps } from "@/components/Graph";

import {
  nodesAtom,
  type EdgeStyle,
  resolveVertexStyleForTypes,
  useAllEdgeStyles,
  useAllVertexStyles,
  userVertexStylesAtom,
  vertexTypeSetKey,
  type VertexStyle,
  type VertexType,
} from "@/core";

import { useBackgroundImageMap } from "./useBackgroundImageMap";

const LINE_PATTERN = {
  solid: undefined,
  dashed: [5, 6],
  dotted: [1, 2],
};

/**
 * One resolved style per distinct combination of types among the vertices
 * currently on the canvas, in addition to (not instead of) the one-per-schema-
 * type styles from `useAllVertexStyles`. A vertex can carry more than one type
 * (e.g. under RDFS/OWL inference, where every superclass is asserted as a
 * peer rdf:type), and its Cytoscape node is tagged with the combined key from
 * `vertexTypeSetKey` (see `renderedEntities.ts`) rather than a single type, so
 * a merged rule is needed for that key too — see `resolveVertexStyleForTypes`
 * for how conflicting fields across a vertex's types are resolved. For a
 * vertex with exactly one type, `vertexTypeSetKey` returns that same type, so
 * this produces a redundant entry rather than a wrong one.
 *
 * Reads `nodesAtom` directly rather than `useDisplayVerticesInCanvas()` —
 * only `.types` is needed here, and `displayVerticesInCanvasSelector`
 * rebuilds its array/Map on every single read (`get(nodesAtom).values().toArray()`
 * allocates fresh, and its atomFamily is keyed by reference), so memoizing
 * against its output never actually memoizes. `nodesAtom` itself only
 * changes identity when actually written to, so memoizing against it is
 * real memoization.
 *
 * That alone isn't enough, though: `nodesAtom` gets a new identity on
 * *every* vertex add/remove (e.g. once per vertex while a session restores),
 * and most of those adds don't introduce a new type combination — they add
 * another vertex of a combination already on the canvas. Memoizing directly
 * against `nodes` would still rebuild this array (and, downstream, the whole
 * Cytoscape stylesheet — expensive, since it re-resolves icons per type) on
 * every single one of those adds. Deriving a stable, content-based key from
 * the *distinct* type combinations first — a plain string, compared by
 * value — means the expensive rebuild only happens when the actual set of
 * combinations changes, not on every vertex added to an existing one. This
 * is what a fresh session restore with many vertices needs: without it, the
 * combination of "new nodesAtom identity per vertex" and "this hook's output
 * feeding back into a re-rendered `styles` prop" is a per-vertex full
 * stylesheet rebuild — pathological for a large restored graph, not a true
 * non-terminating loop, but indistinguishable from one in practice.
 *
 * Exported (only) so a test can assert directly on that stability — see
 * `useGraphStyles.test.tsx` for why a render-count assertion alone doesn't
 * reliably catch a regression here.
 */
export function useAllRenderedVertexStyles(): VertexStyle[] {
  const nodes = useAtomValue(nodesAtom);
  const userStyles = useAtomValue(userVertexStylesAtom);

  const distinctTypeSetKeys = useMemo(() => {
    const keys = new Set<VertexType>();
    for (const vertex of nodes.values()) {
      keys.add(vertexTypeSetKey(vertex.types));
    }
    return [...keys].sort().join("\n");
  }, [nodes]);

  return useMemo(() => {
    if (distinctTypeSetKeys === "") {
      return [];
    }
    // Each key is itself a space-joined list of the combination's individual
    // types (see `vertexTypeSetKey`) — split back into a types array so
    // `resolveVertexStyleForTypes` looks up each *individual* type's stored
    // style, not the composite key as if it were one type's name.
    return distinctTypeSetKeys
      .split("\n")
      .map(key =>
        resolveVertexStyleForTypes(key.split(" ") as VertexType[], userStyles),
      );
  }, [distinctTypeSetKeys, userStyles]);
}

export default function useGraphStyles() {
  const vtConfigs = useAllVertexStyles();
  const renderedVtConfigs = useAllRenderedVertexStyles();
  const etConfigs = useAllEdgeStyles();

  const deferredVtConfigs = useDeferredValue(vtConfigs);
  const deferredRenderedVtConfigs = useDeferredValue(renderedVtConfigs);
  const deferredEtConfigs = useDeferredValue(etConfigs);

  const allVtConfigs = useMemo(
    () => [...deferredVtConfigs, ...deferredRenderedVtConfigs],
    [deferredVtConfigs, deferredRenderedVtConfigs],
  );

  const backgroundImageMap = useBackgroundImageMap(allVtConfigs);

  return createGraphStyles(allVtConfigs, deferredEtConfigs, backgroundImageMap);
}

function createGraphStyles(
  deferredVtConfigs: VertexStyle[],
  deferredEtConfigs: EdgeStyle[],
  backgroundImageMap: Map<VertexType, string>,
): GraphProps["styles"] {
  const styles: GraphProps["styles"] = {};

  for (const vtConfig of deferredVtConfigs) {
    const vt = vtConfig.type;

    const backgroundImage = backgroundImageMap.get(vt);

    styles[`node[type="${vt}"]`] = {
      "background-image": backgroundImage,
      "background-color": vtConfig.color,
      "background-opacity": vtConfig.backgroundOpacity,
      "border-color": vtConfig.borderColor,
      "border-width": vtConfig.borderWidth,
      "border-opacity": vtConfig.borderWidth > 0 ? 1 : 0,
      "border-style": vtConfig.borderStyle,
      shape: vtConfig.shape,
      width: 24,
      height: 24,
    };
  }

  for (const etConfig of deferredEtConfigs) {
    const et = etConfig?.type;

    styles[`edge[type="${et}"]`] = {
      label: "data(displayName)",
      color: new Color(etConfig?.labelColor || "#17457b").isDark()
        ? "#FFFFFF"
        : "#000000",
      "line-color": etConfig.lineColor,
      "line-style":
        etConfig.lineStyle === "dotted" ? "dashed" : etConfig.lineStyle,
      "line-dash-pattern": etConfig.lineStyle
        ? LINE_PATTERN[etConfig.lineStyle]
        : undefined,
      "source-arrow-shape": etConfig.sourceArrowStyle,
      "source-arrow-color": etConfig.lineColor,
      "target-arrow-shape": etConfig.targetArrowStyle,
      "target-arrow-color": etConfig.lineColor,
      "text-background-opacity": etConfig?.labelBackgroundOpacity,
      "text-background-color": etConfig?.labelColor,
      "text-border-width": etConfig?.labelBorderWidth,
      "text-border-color": etConfig?.labelBorderColor,
      "text-border-style": etConfig?.labelBorderStyle,
      width: etConfig.lineThickness,
      "source-distance-from-node": 0,
      "target-distance-from-node": 0,
    };
  }
  return styles;
}
