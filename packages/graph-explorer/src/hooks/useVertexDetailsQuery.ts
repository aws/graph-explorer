import { vertexDetailsQuery } from "@/connector";
import { VertexId } from "@/core";
import { useQuery } from "@tanstack/react-query";

export function useVertexDetailsQuery(vertexId: VertexId) {
  return useQuery(vertexDetailsQuery({ vertexId }));
}
