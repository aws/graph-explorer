import { useRecoilCallback } from "recoil";
import { SchemaResponse } from "../connector/AbstractConnector";
import { schemaAtom } from "../core/StateProvider/schema";

const useUpdateSchema = () => {
  return useRecoilCallback(
    ({ set }) => (
      id: string,
      schema?:
        | Partial<SchemaResponse>
        | ((prevSchema?: SchemaResponse) => Partial<SchemaResponse>)
    ) => {
      set(schemaAtom, prevSchemaMap => {
        const updatedSchema = new Map(prevSchemaMap);
        const prevSchema = prevSchemaMap.get(id);

        const currentSchema =
          typeof schema === "function" ? schema(prevSchema) : schema;

        // Vertices counts
        const vertices = (currentSchema?.vertices || []).map(vertex => {
          return {
            ...vertex,
            total: vertex.total,
          };
        });

        // Edges counts
        const edges = (currentSchema?.edges || prevSchema?.edges || []).map(
          edge => {
            return {
              ...edge,
              total: edge.total,
            };
          }
        );

        updatedSchema.set(id, {
          totalVertices: currentSchema?.totalVertices || 0,
          vertices,
          totalEdges: currentSchema?.totalEdges || 0,
          edges,
          prefixes: prevSchema?.prefixes || [],
          lastUpdate: !currentSchema ? prevSchema?.lastUpdate : new Date(),
          triedToSync: true,
          lastSyncFail: !currentSchema && !!prevSchema,
        });
        return updatedSchema;
      });
    },
    []
  );
};

export default useUpdateSchema;
