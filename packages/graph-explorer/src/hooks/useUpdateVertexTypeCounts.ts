import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useConfiguration } from "../core";
import { explorerSelector } from "../core/connector";
import useUpdateSchema from "./useUpdateSchema";
import { useRecoilValue } from "recoil";

const useUpdateVertexTypeCounts = (vertexType?: string) => {
  const config = useConfiguration();
  const configId = config?.id;
  const explorer = useRecoilValue(explorerSelector);

  const vertexConfig = useMemo(() => {
    if (!vertexType) {
      return;
    }

    return config?.getVertexTypeConfig(vertexType);
  }, [config, vertexType]);

  const updateSchemaState = useUpdateSchema();
  const query = useQuery({
    queryKey: ["fetchCountsByType", vertexConfig?.type],
    queryFn: () => {
      if (vertexConfig?.total != null || vertexConfig?.type == null) {
        return;
      }

      return explorer?.fetchVertexCountsByType({
        label: vertexConfig?.type,
      });
    },
    enabled: vertexConfig?.total == null && vertexConfig?.type != null,
  });

  // Sync the result over to the schema in Recoil state
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
};

export default useUpdateVertexTypeCounts;
