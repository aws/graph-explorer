import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { explorerSelector } from "@/core/connector";
import useUpdateSchema from "./useUpdateSchema";
import { useRecoilValue } from "recoil";
import { nodeCountByNodeTypeQuery } from "@/connector";

export default function useUpdateVertexTypeCounts(vertexType: string) {
  const explorer = useRecoilValue(explorerSelector);

  const query = useQuery(nodeCountByNodeTypeQuery(vertexType, explorer));

  // Sync the result over to the schema in Recoil state
  const { updateVertexTotal } = useUpdateSchema();
  useEffect(() => {
    if (!query.data) {
      return;
    }
    const vertexTotal = query.data.total;

    updateVertexTotal(vertexType, vertexTotal);
  }, [query.data, vertexType, updateVertexTotal]);
}
