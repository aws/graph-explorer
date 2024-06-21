import type { NeighborsCountRequest } from "../../useGEFetchTypes";

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
  idType,
}: NeighborsCountRequest) {
  let template = "";
  if (idType === "number") {
    template = `g.V(${vertexId}L).both()`;
  } else {
    template = `g.V("${vertexId}").both()`;
  }

  if (limit > 0) {
    template += `.limit(${limit})`;
  }
  template += `.dedup().group().by(label).by(count())`;

  return template;
}
