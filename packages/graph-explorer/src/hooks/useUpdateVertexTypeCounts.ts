import { useMemo } from "react";
import { useQuery } from "react-query";
import { useConfiguration } from "../core";
import useConnector from "../core/ConnectorProvider/useConnector";
import useUpdateSchema from "./useUpdateSchema";

const useUpdateVertexTypeCounts = (vertexType?: string) => {
  const config = useConfiguration();
  const connector = useConnector();

  const vertexConfig = useMemo(() => {
    if (!vertexType) {
      return;
    }

    return config?.getVertexTypeConfig(vertexType);
  }, [config, vertexType]);

  const updateSchemaState = useUpdateSchema();
  useQuery(
    ["fetchCountsByType", vertexConfig?.type],
    () => {
      if (vertexConfig?.total != null || vertexConfig?.type == null) {
        return;
      }

      return connector.explorer?.fetchVertexCountsByType({
        label: vertexConfig?.type,
      });
    },
    {
      enabled: vertexConfig?.total == null && vertexConfig?.type != null,
      onSuccess: response => {
        if (!config?.id || !response) {
          return;
        }

        updateSchemaState(config.id, prevSchema => {
          const vertexSchema = prevSchema?.vertices.find(
            vertex => vertex.type === vertexType
          );
          if (!vertexSchema) {
            return { ...(prevSchema || {}) };
          }

          vertexSchema.total = response.total;
          return {
            vertices: [
              ...(prevSchema?.vertices.filter(
                vertex => vertex.type !== vertexType
              ) || []),
              vertexSchema,
            ],
          };
        });
      },
    }
  );
};

export default useUpdateVertexTypeCounts;
