import { selector, selectorFamily, useRecoilValue } from "recoil";
import { Vertex, VertexId, VertexIdType } from "@/@types/entities";
import {
  DisplayAttribute,
  getSortedDisplayAttributes,
  vertexTypeAttributesSelector,
  nodesAtom,
  nodesSelectedIdsAtom,
  DisplayVertexTypeConfig,
  displayVertexTypeConfigSelector,
  queryEngineSelector,
  nodeSelector,
} from "@/core";
import { textTransformSelector } from "@/hooks";
import {
  MISSING_DISPLAY_VALUE,
  RESERVED_ID_PROPERTY,
  RESERVED_TYPES_PROPERTY,
} from "@/utils";

/** Represents a vertex's display information after all transformations have been applied. */
export type DisplayVertex = {
  entityType: "vertex";
  id: VertexId;
  idType: VertexIdType;
  displayId: string;
  displayTypes: string;
  displayName: string;
  displayDescription: string;
  typeConfig: DisplayVertexTypeConfig;
  attributes: DisplayAttribute[];
  isBlankNode: boolean;
  original: Vertex;
};

/** Finds the `DisplayVertex` instance for a give `VertexId` within the vertices added to the graph canvas. */
export function useDisplayVertex(id: VertexId) {
  const vertex = useRecoilValue(displayVerticesInCanvasSelector).get(id);

  if (!vertex) {
    throw new Error(`Vertex with id ${id} not found in displayVertices`);
  }

  return vertex;
}

/** Maps all `Vertex` instances in the graph canvas to `DisplayVertex` instances. */
export function useDisplayVerticesInCanvas() {
  return useRecoilValue(displayVerticesInCanvasSelector);
}

/** Maps a `Vertex` instance to a `DisplayVertex` instance using the schema and any user preferences. */
export function useDisplayVertexFromVertex(vertex: Vertex) {
  return useRecoilValue(displayVertexSelector(vertex));
}

/** Maps the `Vertex` instances to a `DisplayVertex` instances using the schema and any user preferences. */
export function useDisplayVerticesFromVertices(vertices: Vertex[]) {
  return useRecoilValue(displayVerticesSelector(vertices));
}

const selectedDisplayVerticesSelector = selector({
  key: "selected-display-vertices",
  get: ({ get }) => {
    const selectedIds = get(nodesSelectedIdsAtom);
    return selectedIds
      .values()
      .map(id => get(nodeSelector(id)))
      .filter(n => n != null)
      .map(n => get(displayVertexSelector(n)))
      .filter(n => n != null)
      .toArray();
  },
});

/** Maps all `Vertex` instances which are selected in the graph canvas to `DisplayVertex` instances. */
export function useSelectedDisplayVertices() {
  return useRecoilValue(selectedDisplayVerticesSelector);
}

const displayVertexSelector = selectorFamily({
  key: "display-vertex",
  get:
    (vertex: Vertex) =>
    ({ get }) => {
      const textTransform = get(textTransformSelector);
      const queryEngine = get(queryEngineSelector);
      const isSparql = queryEngine === "sparql";

      const displayId = isSparql ? textTransform(vertex.id) : vertex.id;

      // One type config used for shape, color, icon, etc.
      const typeConfig = get(displayVertexTypeConfigSelector(vertex.type));

      // List all vertex types for displaying
      const vertexTypes = vertex.types ?? [vertex.type];
      const displayTypes = vertexTypes
        .map(type => get(displayVertexTypeConfigSelector(type)).displayLabel)
        .join(", ");

      // Map all the attributes for displaying
      const typeAttributes = get(vertexTypeAttributesSelector(vertexTypes));
      const sortedAttributes = getSortedDisplayAttributes(
        vertex,
        typeAttributes,
        textTransform
      );

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
      const displayDescription = getDisplayAttributeValueByName(
        typeConfig.displayDescriptionAttribute
      );

      const result: DisplayVertex = {
        entityType: "vertex",
        id: vertex.id,
        idType: vertex.idType,
        displayId,
        displayTypes,
        displayName,
        displayDescription,
        typeConfig,
        attributes: sortedAttributes,
        isBlankNode: vertex.__isBlank ?? false,
        original: vertex,
      };
      return result;
    },
});

const displayVerticesSelector = selectorFamily({
  key: "display-vertices",
  get:
    (vertices: Vertex[]) =>
    ({ get }) => {
      return new Map(
        vertices.map(vertex => [vertex.id, get(displayVertexSelector(vertex))])
      );
    },
});

const displayVerticesInCanvasSelector = selector({
  key: "display-vertices-in-canvas",
  get: ({ get }) => {
    return get(displayVerticesSelector(get(nodesAtom).values().toArray()));
  },
});
