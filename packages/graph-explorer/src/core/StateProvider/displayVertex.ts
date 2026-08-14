import { atom, useAtomValue } from "jotai";
import { atomFamily } from "jotai-family";

import {
  type DisplayAttribute,
  getRawId,
  getSortedDisplayAttributes,
  nodesAtom,
  nodeSelector,
  nodesSelectedIdsAtom,
  queryEngineSelector,
  useVertex,
  type Vertex,
  type VertexId,
  vertexStyleAtom,
  type VertexStyleLookup,
  type VertexType,
} from "@/core";
import { type TextTransformer, textTransformSelector } from "@/hooks";
import { LABELS, RESERVED_ID_PROPERTY, RESERVED_TYPES_PROPERTY } from "@/utils";

/** Represents a vertex's display information after all transformations have been applied. */
export type DisplayVertex = {
  entityType: "vertex";
  id: VertexId;
  primaryType: VertexType;
  types: VertexType[];
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

/** Maps a `Vertex` instance to a `DisplayVertex` instance using the schema and any user styles. */
export function useDisplayVertexFromVertex(vertex: Vertex) {
  return toDisplayVertex(vertex, useAtomValue(displayVertexContextSelector));
}

/** Maps the `Vertex` instances to a `DisplayVertex` instances using the schema and any user styles. */
export function useDisplayVerticesFromVertices(vertices: Vertex[]) {
  const context = useAtomValue(displayVertexContextSelector);
  return new Map(vertices.map(v => [v.id, toDisplayVertex(v, context)]));
}

const selectedDisplayVerticesSelector = atom(get =>
  get(nodesSelectedIdsAtom)
    .values()
    .map(id => get(displayVertexSelector(id)))
    .filter(v => v != null)
    .toArray(),
);

/** Maps all `Vertex` instances which are selected in the graph canvas to `DisplayVertex` instances. */
export function useSelectedDisplayVertices() {
  return useAtomValue(selectedDisplayVerticesSelector);
}

/**
 * Everything a `Vertex` needs to become a `DisplayVertex`, resolved once per
 * store change instead of once per vertex.
 */
type DisplayVertexContext = {
  textTransform: TextTransformer;
  isSparql: boolean;
  vertexStyles: VertexStyleLookup;
};

const displayVertexContextSelector = atom<DisplayVertexContext>(get => ({
  textTransform: get(textTransformSelector),
  isSparql: get(queryEngineSelector) === "sparql",
  vertexStyles: get(vertexStyleAtom),
}));

/**
 * Keyed by `VertexId` rather than the `Vertex` object so the family interns one
 * entry per node instead of one per object identity, which `nodesAtom` mutations
 * would otherwise leak on every recomputation.
 */
const displayVertexSelector = atomFamily((id: VertexId) =>
  atom(get => {
    const vertex = get(nodeSelector(id));
    if (!vertex) {
      return null;
    }
    return toDisplayVertex(vertex, get(displayVertexContextSelector));
  }),
);

function toDisplayVertex(
  vertex: Vertex,
  { textTransform, isSparql, vertexStyles }: DisplayVertexContext,
): DisplayVertex {
  const rawStringId = String(getRawId(vertex.id));
  const displayId = isSparql ? textTransform(rawStringId) : rawStringId;

  // List all vertex types for displaying
  const vertexTypes =
    vertex.types && vertex.types.length > 0 ? vertex.types : [vertex.type];
  const displayTypes = vertexTypes
    .map(type => vertexStyles.get(type).displayLabel ?? textTransform(type))
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

  const vertexStyle = vertexStyles.get(vertex.type);
  const displayName = getDisplayAttributeValueByName(
    vertexStyle.displayNameAttribute,
  );
  const displayDescription = getDisplayAttributeValueByName(
    vertexStyle.longDisplayNameAttribute,
  );

  return {
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
}

export const displayVerticesInCanvasSelector = atom(
  get =>
    new Map(
      get(nodesAtom)
        .keys()
        .map(id => get(displayVertexSelector(id)))
        .filter(v => v != null)
        .map(v => [v.id, v] as const),
    ),
);
