import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useConfiguration } from "@/core";
import { explorerSelector } from "@/core/connector";
import useUpdateSchema from "./useUpdateSchema";
import { useRecoilValue } from "recoil";
import { nodeCountByNodeTypeQuery } from "@/connector/queries";

export default function useUpdateVertexTypeCounts(vertexType: string) {
  const config = useConfiguration();
  const configId = config?.id;
  const explorer = useRecoilValue(explorerSelector);

  const query = useQuery(nodeCountByNodeTypeQuery(vertexType, explorer));

  // Sync the result over to the schema in Recoil state
  const updateSchemaState = useUpdateSchema();
  useEffect(() => {
    if (!configId || !query.data) {
      return;
    }
    const vertexTotal = query.data.total;

    updateSchemaState(configId, prevSchema => {
      const vertexSchema = prevSchema?.vertices.find(
        vertex => vertex.type === vertexType
      );
      if (!vertexSchema) {
        return { ...(prevSchema || {}) };
      }
      vertexSchema.total = vertexTotal;
      return {
        ...prevSchema,
        vertices: [
          ...(prevSchema?.vertices.filter(
            vertex => vertex.type !== vertexType
          ) || []),
          vertexSchema,
        ],
      };
    });
  }, [query.data, configId, updateSchemaState, vertexType]);
}
