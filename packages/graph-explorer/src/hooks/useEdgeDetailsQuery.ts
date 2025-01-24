import { edgeDetailsQuery, EdgeRef } from "@/connector";
import { explorerSelector } from "@/core";
import { useQuery } from "@tanstack/react-query";
import { useRecoilValue } from "recoil";

export function useEdgeDetailsQuery(edge: EdgeRef) {
  const explorer = useRecoilValue(explorerSelector);
  const query = useQuery(edgeDetailsQuery({ edge }, explorer));
  return query;
}
