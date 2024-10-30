import { useCallback } from "react";
import { Edge, Vertex } from "@/types/entities";
import { useConfiguration } from "@/core";
import useTextTransform from "./useTextTransform";
import { RESERVED_ID_PROPERTY } from "@/utils/constants";

const isVertex = (vOrE: Vertex | Edge): vOrE is Vertex => {
  return "neighborsCount" in vOrE && vOrE.neighborsCount != null;
};

const useDisplayNames = () => {
  const config = useConfiguration();
  const textTransform = useTextTransform();

  return useCallback(
    (vertexOrEdge: Vertex | Edge) => {
      if (isVertex(vertexOrEdge)) {
        const vertex = vertexOrEdge;
        const vtConfig = config?.getVertexTypeConfig(vertex.type);

        let name = textTransform(vertex.id);
        let longName = (vertex.types ?? [vertex.type])
          .map(textTransform)
          .join(", ");

        if (!vtConfig) {
          return {
            name,
            longName,
          };
        }

        const attrs = vertex.attributes;
        const {
          displayNameAttribute: __name,
          longDisplayNameAttribute: __longName,
        } = vtConfig;

        if (__name === RESERVED_ID_PROPERTY) {
          name = vertex.id;
        } else if (__name === "types") {
          name = (vertex.types ?? [vertex.type]).map(textTransform).join(", ");
        } else if (__name) {
          name = attrs[__name] ? String(attrs[__name]) : "---";
        }

        if (__longName === RESERVED_ID_PROPERTY) {
          longName = vertex.id;
        } else if (__longName === "types") {
          longName = (vertex.types ?? [vertex.type])
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
      const etConfig = config?.getEdgeTypeConfig(edge.type);
      const attrs = edge.attributes;
      let name = textTransform(edge.type);

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
