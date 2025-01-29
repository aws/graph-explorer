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
  limit = 0,
}: NeighborsCountRequest) {
  let template = `g.V(${idParam(vertexId)}).both()`;

  if (limit > 0) {
    template += `.limit(${limit})`;
  }
  template += `.dedup().group().by(label).by(count())`;

  return template;
}
