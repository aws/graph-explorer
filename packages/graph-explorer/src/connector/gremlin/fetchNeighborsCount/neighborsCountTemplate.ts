import type { NeighborsCountRequest } from "@/connector/useGEFetchTypes";
import { idParam } from "../idParam";

/**
 * Given a single node ids, it returns a Gremlin template with
 * all neighbors types with their counts.
 *
 * @example
 * ids = "44"
 * limit = 10
 *
 * g.V("44").both().limit(10).dedup()
 *  .group().by(label).by(count())
 */
export default function neighborsCountTemplate({
  vertexId,
}: NeighborsCountRequest) {
  return `g.V(${idParam(vertexId)}).both().dedup().group().by(label).by(count())`;
}
