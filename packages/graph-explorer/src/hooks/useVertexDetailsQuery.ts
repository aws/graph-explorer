import { vertexDetailsQuery } from "@/connector";
import { explorerSelector, VertexId } from "@/core";
import { useQuery } from "@tanstack/react-query";
import { useRecoilValue } from "recoil";

export function useVertexDetailsQuery(vertexId: VertexId) {
  const explorer = useRecoilValue(explorerSelector);
  const query = useQuery(vertexDetailsQuery({ vertexId }, explorer));
  return query;
}
