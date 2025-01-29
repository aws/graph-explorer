import { edgeDetailsQuery } from "@/connector";
import { EdgeId, useExplorer } from "@/core";
import { useQuery } from "@tanstack/react-query";

export function useEdgeDetailsQuery(edgeId: EdgeId) {
  const explorer = useExplorer();
  const query = useQuery(edgeDetailsQuery({ edgeId }, explorer));
  return query;
}
