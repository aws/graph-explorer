import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import type { VertexType } from "@/core";

import { nodeCountByNodeTypeQuery } from "@/connector";

import useUpdateSchema from "./useUpdateSchema";

export default function useUpdateVertexTypeCounts(vertexType: VertexType) {
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
