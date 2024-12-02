import { Edge, EdgeId, VertexId } from "@/@types/entities";
import { selector, selectorFamily, useRecoilValue } from "recoil";
import { textTransformSelector } from "@/hooks/useTextTransform";
import {
  edgeTypeConfigSelector,
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

/** Represents an edge's display information after all transformations have been applied. */
export type DisplayEdge = {
  entityType: "edge";
  id: EdgeId;
  displayId: string | null;
  displayTypes: string;
  typeConfig: DisplayEdgeTypeConfig;
  source: EdgeVertex;
  target: EdgeVertex;
  attributes: DisplayAttribute[];
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

/** Finds the `DisplayEdge` instance for a give `EdgeId` within the edges added to the graph canvas. */
export function useDisplayEdge(id: EdgeId) {
  const edge = useRecoilValue(displayEdgesInCanvasSelector).get(id);

  if (!edge) {
    throw new Error(`Edge with id ${id} not found in displayEdges`);
  }

  return edge;
}

/** Maps a `Edge` instance to a `DisplayEdge` instance using the schema and any user preferences. */
export function useDisplayEdgeFromEdge(edge: Edge) {
  return useRecoilValue(displayEdgeSelector(edge));
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
        .map(
          type =>
            get(edgeTypeConfigSelector(type))?.displayLabel ||
            textTransform(type)
        )
        .join(", ");

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

      const displayEdge: DisplayEdge = {
        entityType: "edge",
        id: edge.id,
        displayId: isSparql ? null : edge.id,
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
