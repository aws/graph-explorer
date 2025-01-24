import { vertexDetailsQuery, VertexRef } from "@/connector";
import { explorerSelector } from "@/core";
import { useQuery } from "@tanstack/react-query";
import { useRecoilValue } from "recoil";

export function useVertexDetailsQuery(vertex: VertexRef) {
  const explorer = useRecoilValue(explorerSelector);
  const query = useQuery(vertexDetailsQuery({ vertex }, explorer));
  return query;
}
