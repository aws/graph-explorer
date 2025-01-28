import { vertexDetailsQuery } from "@/connector";
import { useExplorer, VertexId } from "@/core";
import { useQuery } from "@tanstack/react-query";

export function useVertexDetailsQuery(vertexId: VertexId) {
  const explorer = useExplorer();
  const query = useQuery(vertexDetailsQuery({ vertexId }, explorer));
  return query;
}
