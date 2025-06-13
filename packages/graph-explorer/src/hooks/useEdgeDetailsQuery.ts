import { edgeDetailsQuery } from "@/connector";
import { EdgeId } from "@/core";
import { useQuery } from "@tanstack/react-query";

export function useEdgeDetailsQuery(edgeId: EdgeId) {
  const query = useQuery(edgeDetailsQuery({ edgeId }));
  return query;
}
