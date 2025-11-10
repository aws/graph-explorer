import {
  type DisplayAttribute,
  getSortedDisplayAttributes,
  nodesAtom,
  nodesSelectedIdsAtom,
  queryEngineSelector,
  nodeSelector,
  getRawId,
  type Vertex,
  type VertexId,
  useVertex,
  vertexPreferenceByTypeAtom,
} from "@/core";
import { textTransformSelector } from "@/hooks";
import { LABELS, RESERVED_ID_PROPERTY, RESERVED_TYPES_PROPERTY } from "@/utils";
import { atom, useAtomValue } from "jotai";
import { atomFamily } from "jotai/utils";

/** Represents a vertex's display information after all transformations have been applied. */
export type DisplayVertex = {
  entityType: "vertex";
  id: VertexId;
  primaryType: string;
  types: string[];
  displayId: string;
  displayTypes: string;
  displayName: string;
  displayDescription: string;
  attributes: DisplayAttribute[];
  isBlankNode: boolean;
  original: Vertex;
};

/** Finds the `DisplayVertex` instance for a give `VertexId`. */
export function useDisplayVertex(id: VertexId) {
  const vertex = useVertex(id);
  return useDisplayVertexFromVertex(vertex);
}

/** Maps all `Vertex` instances in the graph canvas to `DisplayVertex` instances. */
export function useDisplayVerticesInCanvas() {
  return useAtomValue(displayVerticesInCanvasSelector);
}

/** Maps a `Vertex` instance to a `DisplayVertex` instance using the schema and any user preferences. */
export function useDisplayVertexFromVertex(vertex: Vertex) {
  return useAtomValue(displayVertexSelector(vertex));
}

/** Maps the `Vertex` instances to a `DisplayVertex` instances using the schema and any user preferences. */
export function useDisplayVerticesFromVertices(vertices: Vertex[]) {
  return useAtomValue(displayVerticesSelector(vertices));
}

const selectedDisplayVerticesSelector = atom(get => {
  const selectedIds = get(nodesSelectedIdsAtom);
  return selectedIds
    .values()
    .map(id => get(nodeSelector(id)))
    .filter(n => n != null)
    .map(n => get(displayVertexSelector(n)))
    .filter(n => n != null)
    .toArray();
});

/** Maps all `Vertex` instances which are selected in the graph canvas to `DisplayVertex` instances. */
export function useSelectedDisplayVertices() {
  return useAtomValue(selectedDisplayVerticesSelector);
}

const displayVertexSelector = atomFamily((vertex: Vertex) =>
  atom(get => {
    const textTransform = get(textTransformSelector);
    const queryEngine = get(queryEngineSelector);
    const isSparql = queryEngine === "sparql";

    const rawStringId = String(getRawId(vertex.id));
    const displayId = isSparql ? textTransform(rawStringId) : rawStringId;

    // List all vertex types for displaying
    const vertexTypes =
      vertex.types && vertex.types.length > 0 ? vertex.types : [vertex.type];
    const displayTypes = vertexTypes
      .map(
        type =>
          get(vertexPreferenceByTypeAtom(type)).displayLabel ??
          textTransform(type)
      )
      .join(", ");

    // Map all the attributes for displaying
    const sortedAttributes = getSortedDisplayAttributes(vertex, textTransform);

    // Get the display name and description for the vertex
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

    const vertexPreferences = get(vertexPreferenceByTypeAtom(vertex.type));
    const displayName = getDisplayAttributeValueByName(
      vertexPreferences.displayNameAttribute
    );
    const displayDescription = getDisplayAttributeValueByName(
      vertexPreferences.longDisplayNameAttribute
    );

    const result: DisplayVertex = {
      entityType: "vertex",
      id: vertex.id,
      primaryType: vertex.type,
      types: vertexTypes,
      displayId,
      displayTypes,
      displayName,
      displayDescription,
      attributes: sortedAttributes,
      isBlankNode: vertex.isBlankNode ?? false,
      original: vertex,
    };
    return result;
  })
);

const displayVerticesSelector = atomFamily((vertices: Vertex[]) =>
  atom(get => {
    return new Map(
      vertices.map(vertex => [vertex.id, get(displayVertexSelector(vertex))])
    );
  })
);

const displayVerticesInCanvasSelector = atom(get => {
  return get(displayVerticesSelector(get(nodesAtom).values().toArray()));
});
