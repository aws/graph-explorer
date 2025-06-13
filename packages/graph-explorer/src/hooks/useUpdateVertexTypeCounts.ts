import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import useUpdateSchema from "./useUpdateSchema";
import { nodeCountByNodeTypeQuery } from "@/connector";

export default function useUpdateVertexTypeCounts(vertexType: string) {
  const query = useQuery(nodeCountByNodeTypeQuery(vertexType));

  // Sync the result over to the schema in Jotai state
  const { updateVertexTotal } = useUpdateSchema();
  useEffect(() => {
    if (!query.data) {
      return;
    }
    const vertexTotal = query.data.total;

    updateVertexTotal(vertexType, vertexTotal);
  }, [query.data, vertexType, updateVertexTotal]);
}
