import {
  Edge,
  EdgeId,
  getRawId,
  Vertex,
  VertexId,
  DisplayEdgeTypeConfig,
  displayEdgeTypeConfigSelector,
  DisplayAttribute,
  getSortedDisplayAttributes,
  edgesAtom,
  edgesSelectedIdsAtom,
  vertexTypeConfigSelector,
  queryEngineSelector,
  edgeSelector,
  edgeTypeAttributesSelector,
} from "@/core";
import { textTransformSelector } from "@/hooks";
import {
  MISSING_DISPLAY_VALUE,
  RESERVED_ID_PROPERTY,
  RESERVED_TYPES_PROPERTY,
} from "@/utils";
import { atom, useAtomValue } from "jotai";
import { atomFamily } from "jotai/utils";

/** Represents an edge's display information after all transformations have been applied. */
export type DisplayEdge = {
  entityType: "edge";
  id: EdgeId;
  displayId: string;
  displayName: string;
  displayTypes: string;
  typeConfig: DisplayEdgeTypeConfig;
  source: EdgeVertex;
  target: EdgeVertex;
  attributes: DisplayAttribute[];
  hasUniqueId: boolean;
};

type EdgeVertex = {
  id: VertexId;
  displayId: string;
  displayTypes: string;
  types: Vertex["types"];
};

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
    const typeConfig = get(displayEdgeTypeConfigSelector(edge.type));

    // List all edge types for displaying
    const edgeTypes = [edge.type];
    const displayTypes = edgeTypes
      .map(type => get(displayEdgeTypeConfigSelector(type)).displayLabel)
      .join(", ");

    // For SPARQL, display the edge type as the ID
    const rawStringId = String(getRawId(edge.id));
    const displayId = isSparql ? displayTypes : rawStringId;

    const typeAttributes = get(edgeTypeAttributesSelector(edgeTypes));
    const sortedAttributes = getSortedDisplayAttributes(
      edge,
      typeAttributes,
      textTransform
    );

    const sourceRawStringId = String(getRawId(edge.source));
    const targetRawStringId = String(getRawId(edge.target));
    const sourceDisplayId = isSparql
      ? textTransform(sourceRawStringId)
      : sourceRawStringId;
    const targetDisplayId = isSparql
      ? textTransform(targetRawStringId)
      : targetRawStringId;

    const sourceDisplayTypes = edge.sourceTypes
      .map(
        type =>
          get(vertexTypeConfigSelector(type))?.displayLabel ||
          textTransform(type)
      )
      .join(", ");
    const targetDisplayTypes = edge.targetTypes
      .map(
        type =>
          get(vertexTypeConfigSelector(type))?.displayLabel ||
          textTransform(type)
      )
      .join(", ");

    // Get the display name and description for the edge
    function getDisplayAttributeValueByName(name: string | undefined) {
      if (name === RESERVED_ID_PROPERTY) {
        return displayId;
      } else if (name === RESERVED_TYPES_PROPERTY) {
        return displayTypes;
      } else if (name) {
        return (
          sortedAttributes.find(attr => attr.name === name)?.displayValue ??
          MISSING_DISPLAY_VALUE
        );
      }

      return MISSING_DISPLAY_VALUE;
    }

    const displayName = getDisplayAttributeValueByName(
      typeConfig.displayNameAttribute
    );

    const displayEdge: DisplayEdge = {
      entityType: "edge",
      id: edge.id,
      displayId,
      displayName,
      displayTypes,
      typeConfig,
      source: {
        id: edge.source,
        displayId: sourceDisplayId,
        displayTypes: sourceDisplayTypes,
        types: edge.sourceTypes,
      },
      target: {
        id: edge.target,
        displayId: targetDisplayId,
        displayTypes: targetDisplayTypes,
        types: edge.targetTypes,
      },
      attributes: sortedAttributes,
      // SPARQL does not have unique ID values for predicates, so the UI should hide them
      hasUniqueId: isSparql === false,
    };
    return displayEdge;
  })
);

const displayEdgesInCanvasSelector = atom(get => {
  return new Map(
    get(edgesAtom)
      .entries()
      .map(([id, edge]) => [id, get(displayEdgeSelector(edge))])
  );
});
