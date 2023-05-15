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

        // Preserve vertices counts
        const vertices = (
          currentSchema?.vertices ||
          prevSchema?.vertices ||
          []
        ).map(vertex => {
          const prevVertex = prevSchema?.vertices.find(
            v => v.type === vertex.type
          );
          return {
            ...vertex,
            total: vertex.total ?? prevVertex?.total,
          };
        });

        // Preserve edges counts
        const edges = (currentSchema?.edges || prevSchema?.edges || []).map(
          edge => {
            const prevEdge = prevSchema?.edges.find(e => e.type === edge.type);
            return {
              ...edge,
              total: edge.total ?? prevEdge?.total,
            };
          }
        );

        updatedSchema.set(id, {
          totalVertices:
            currentSchema?.totalVertices || prevSchema?.totalVertices || 0,
          vertices,
          totalEdges: currentSchema?.totalEdges || prevSchema?.totalEdges || 0,
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
