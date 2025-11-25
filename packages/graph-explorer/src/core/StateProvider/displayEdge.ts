import {
  type Edge,
  type EdgeId,
  getRawId,
  type VertexId,
  displayEdgeTypeConfigSelector,
  type DisplayAttribute,
  getSortedDisplayAttributes,
  edgesAtom,
  edgesSelectedIdsAtom,
  queryEngineSelector,
  edgeSelector,
  edgePreferenceByTypeAtom,
  useEdgeInCanvas,
} from "@/core";
import { textTransformSelector } from "@/hooks";
import { LABELS, RESERVED_ID_PROPERTY, RESERVED_TYPES_PROPERTY } from "@/utils";
import { atom, useAtomValue } from "jotai";
import { atomFamily } from "jotai/utils";

/** Represents an edge's display information after all transformations have been applied. */
export type DisplayEdge = {
  entityType: "edge";
  id: EdgeId;
  type: string;
  displayId: string;
  displayName: string;
  displayTypes: string;
  sourceId: VertexId;
  targetId: VertexId;
  attributes: DisplayAttribute[];
  hasUniqueId: boolean;
};

export function useDisplayEdgeInCanvas(edgeId: EdgeId) {
  const edge = useEdgeInCanvas(edgeId);
  return useAtomValue(displayEdgeSelector(edge));
}

/** Maps all `Edge` instances in the graph canvas to `DisplayEdge` instances. */
export function useDisplayEdgesInCanvas() {
  return useAtomValue(displayEdgesInCanvasSelector);
}

const selectedDisplayEdgesSelector = atom(get => {
  const selectedIds = get(edgesSelectedIdsAtom);
  return selectedIds
    .values()
    .map(id => get(edgeSelector(id)))
    .filter(e => e != null)
    .map(e => get(displayEdgeSelector(e)))
    .filter(n => n != null)
    .toArray();
});

/** Maps all `Edge` instances which are selected in the graph canvas to `DisplayEdge` instances. */
export function useSelectedDisplayEdges() {
  return useAtomValue(selectedDisplayEdgesSelector);
}

export function useDisplayEdgeFromEdge(edge: Edge) {
  return useAtomValue(displayEdgeSelector(edge));
}

const displayEdgeSelector = atomFamily((edge: Edge) =>
  atom(get => {
    const textTransform = get(textTransformSelector);
    const queryEngine = get(queryEngineSelector);
    const isSparql = queryEngine === "sparql";

    // One type config used for shape, color, icon, etc.
    const preferences = get(edgePreferenceByTypeAtom(edge.type));

    // List all edge types for displaying
    const edgeTypes = [edge.type];
    const displayTypes = edgeTypes
      .map(type => get(displayEdgeTypeConfigSelector(type)).displayLabel)
      .join(", ");

    // For SPARQL, display the edge type as the ID
    const rawStringId = String(getRawId(edge.id));
    const displayId = isSparql ? displayTypes : rawStringId;

    const sortedAttributes = getSortedDisplayAttributes(edge, textTransform);

    // Get the display name and description for the edge
    function getDisplayAttributeValueByName(name: string | undefined) {
      if (name === RESERVED_ID_PROPERTY) {
        return displayId;
      } else if (name === RESERVED_TYPES_PROPERTY) {
        return displayTypes;
      } else if (name) {
        return (
          sortedAttributes.find(attr => attr.name === name)?.displayValue ??
          LABELS.MISSING_VALUE
        );
      }

      return LABELS.MISSING_VALUE;
    }

    const displayName = getDisplayAttributeValueByName(
      preferences.displayNameAttribute,
    );

    const displayEdge: DisplayEdge = {
      entityType: "edge",
      id: edge.id,
      type: edge.type,
      displayId,
      displayName,
      displayTypes,
      sourceId: edge.sourceId,
      targetId: edge.targetId,
      attributes: sortedAttributes,
      // SPARQL does not have unique ID values for predicates, so the UI should hide them
      hasUniqueId: isSparql === false,
    };
    return displayEdge;
  }),
);

const displayEdgesInCanvasSelector = atom(get => {
  return new Map(
    get(edgesAtom)
      .entries()
      .map(([id, edge]) => [id, get(displayEdgeSelector(edge))]),
  );
});
