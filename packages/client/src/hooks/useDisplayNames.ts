import { useCallback } from "react";
import { Edge, Vertex } from "../@types/entities";
import { useConfiguration } from "../core";
import useTextTransform from "./useTextTransform";

const isVertex = (vOrE: any): vOrE is Vertex => {
  return vOrE.data.neighborsCount != null;
};

const useDisplayNames = () => {
  const config = useConfiguration();
  const textTransform = useTextTransform();

  return useCallback(
    (vertexOrEdge: Vertex | Edge) => {
      if (isVertex(vertexOrEdge)) {
        const vertex = vertexOrEdge;
        const vtConfig = config?.getVertexTypeConfig(vertex.data.type);

        let name = textTransform(vertex.data.id);
        let longName = (vertex.data.types ?? [vertex.data.type])
          .map(textTransform)
          .join(", ");

        if (!vtConfig) {
          return {
            name,
            longName,
          };
        }

        const attrs = vertex.data.attributes;
        const {
          displayNameAttribute: __name,
          longDisplayNameAttribute: __longName,
        } = vtConfig;

        if (__name === "id") {
          name = vertex.data.id;
        } else if (__name === "types") {
          name = (vertex.data.types ?? [vertex.data.type])
            .map(textTransform)
            .join(", ");
        } else if (__name) {
          name = attrs[__name] ? String(attrs[__name]) : "---";
        }

        if (__longName === "id") {
          longName = vertex.data.id;
        } else if (__longName === "types") {
          longName = (vertex.data.types ?? [vertex.data.type])
            .map(textTransform)
            .join(", ");
        } else if (__longName) {
          longName = attrs[__longName] ? String(attrs[__longName]) : "---";
        }

        return {
          name,
          longName,
        };
      }

      const edge = vertexOrEdge;
      const etConfig = config?.getEdgeTypeConfig(edge.data.type);
      const attrs = edge.data.attributes;
      let name = textTransform(edge.data.type);

      if (!etConfig) {
        return {
          name,
          longName: name,
        };
      }

      const { displayNameAttribute: __name } = etConfig;

      if (__name && attrs[__name]) {
        name = String(attrs[__name]);
      }

      return {
        name,
        longName: name,
      };
    },
    [config, textTransform]
  );
};

export default useDisplayNames;
