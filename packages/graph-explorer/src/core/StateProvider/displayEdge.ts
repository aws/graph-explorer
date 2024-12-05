import { Edge, EdgeId, VertexId } from "@/@types/entities";
import { selector, selectorFamily, useRecoilValue } from "recoil";
import { textTransformSelector } from "@/hooks/useTextTransform";
import {
  vertexTypeAttributesSelector,
  vertexTypeConfigSelector,
} from "../ConfigurationProvider/useConfiguration";
import { edgesAtom, edgesSelectedIdsAtom } from "./edges";
import {
  DisplayAttribute,
  getSortedDisplayAttributes,
} from "./displayAttribute";
import {
  DisplayEdgeTypeConfig,
  displayEdgeTypeConfigSelector,
} from "./displayTypeConfigs";
import { queryEngineSelector } from "../connector";
import {
  MISSING_DISPLAY_VALUE,
  RESERVED_ID_PROPERTY,
  RESERVED_TYPES_PROPERTY,
} from "@/utils/constants";

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

/** Maps all `Edge` instances which are selected in the graph canvas to `DisplayEdge` instances. */
export function useSelectedDisplayEdges() {
  const selectedIds = useRecoilValue(edgesSelectedIdsAtom);
  const displayEdges = useDisplayEdgesInCanvas();
  return selectedIds
    .values()
    .map(id => displayEdges.get(id))
    .filter(n => n != null)
    .toArray();
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
      const displayId = isSparql ? displayTypes : edge.id;

      const typeAttributes = get(vertexTypeAttributesSelector(edgeTypes));
      const sortedAttributes = getSortedDisplayAttributes(
        edge,
        typeAttributes,
        textTransform
      );

      const sourceDisplayId = isSparql
        ? textTransform(edge.source)
        : edge.source;
      const targetDisplayId = isSparql
        ? textTransform(edge.target)
        : edge.target;

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

      // Get the display name and description for the vertex
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
