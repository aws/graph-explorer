import { edgeDetailsQuery } from "@/connector";
import { EdgeId, explorerSelector } from "@/core";
import { useQuery } from "@tanstack/react-query";
import { useRecoilValue } from "recoil";

export function useEdgeDetailsQuery(edgeId: EdgeId) {
  const explorer = useRecoilValue(explorerSelector);
  const query = useQuery(edgeDetailsQuery({ edgeId }, explorer));
  return query;
}
