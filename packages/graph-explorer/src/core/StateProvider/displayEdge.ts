import { Edge, EdgeId, getRawId, VertexId } from "@/core";
import { selector, selectorFamily, useRecoilValue } from "recoil";
import { textTransformSelector } from "@/hooks";
import {
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
import {
  MISSING_DISPLAY_VALUE,
  RESERVED_ID_PROPERTY,
  RESERVED_TYPES_PROPERTY,
} from "@/utils";

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
};

/** Maps all `Edge` instances in the graph canvas to `DisplayEdge` instances. */
export function useDisplayEdgesInCanvas() {
  return useRecoilValue(displayEdgesInCanvasSelector);
}

const selectedDisplayEdgesSelector = selector({
  key: "selected-display-edges",
  get: ({ get }) => {
    const selectedIds = get(edgesSelectedIdsAtom);
    return selectedIds
      .values()
      .map(id => get(edgeSelector(id)))
      .filter(e => e != null)
      .map(e => get(displayEdgeSelector(e)))
      .filter(n => n != null)
      .toArray();
  },
});

/** Maps all `Edge` instances which are selected in the graph canvas to `DisplayEdge` instances. */
export function useSelectedDisplayEdges() {
  return useRecoilValue(selectedDisplayEdgesSelector);
}

export function useDisplayEdgeFromEdge(edge: Edge) {
  return useRecoilValue(displayEdgeSelector(edge));
}

const displayEdgeSelector = selectorFamily({
  key: "display-edge",
  get:
    (edge: Edge) =>
    ({ get }) => {
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

      const sourceDisplayTypes = edge.sourceType
        .split("::")
        .map(
          type =>
            get(vertexTypeConfigSelector(type))?.displayLabel ||
            textTransform(type)
        )
        .join(", ");
      const targetDisplayTypes = edge.targetType
        .split("::")
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
        },
        target: {
          id: edge.target,
          displayId: targetDisplayId,
          displayTypes: targetDisplayTypes,
        },
        attributes: sortedAttributes,
        // SPARQL does not have unique ID values for predicates, so the UI should hide them
        hasUniqueId: isSparql === false,
      };
      return displayEdge;
    },
});

const displayEdgesInCanvasSelector = selector({
  key: "display-edges-in-canvas",
  get: ({ get }) => {
    return new Map(
      get(edgesAtom)
        .entries()
        .map(([id, edge]) => [id, get(displayEdgeSelector(edge))])
    );
  },
});
